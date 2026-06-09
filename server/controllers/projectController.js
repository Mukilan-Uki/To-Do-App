import Task from "../models/Task.js";
import User from "../models/User.js";
import Invitation from "../models/Invitation.js";

// Helper: check access
const canAccessTask = (task, userId) => {
  const ownerId = task.owner 
    ? (task.owner._id ? task.owner._id.toString() : task.owner.toString()) 
    : (task.user?._id ? task.user._id.toString() : task.user?.toString());
    
  return (
    ownerId === userId.toString() ||
    task.collaborators.some((collab) => {
      const collabId = collab._id ? collab._id.toString() : collab.toString();
      return collabId === userId.toString();
    })
  );
};

const isTaskOwner = (task, userId) => {
  const ownerId = task.owner 
    ? (task.owner._id ? task.owner._id.toString() : task.owner.toString()) 
    : (task.user?._id ? task.user._id.toString() : task.user?.toString());
  return ownerId === userId.toString();
};

// @desc    Get logged in user's projects
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res) => {
  try {
    const projects = await Task.find({
      type: "project",
      $or: [
        { owner: req.user._id },
        { user: req.user._id },
        { collaborators: req.user._id },
      ],
    })
      .sort({ order: 1, createdAt: -1 })
      .populate("owner", "name email")
      .populate("collaborators", "name email");

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req, res) => {
  try {
    const { title, description, priority, category, dueDate, subtasks } = req.body;

    const lastTask = await Task.findOne({ owner: req.user._id, type: "project" }).sort({
      order: -1,
    });
    const order = lastTask ? lastTask.order + 1 : 0;

    const formattedSubtasks = Array.isArray(subtasks)
      ? subtasks.map((subtask, index) => ({
          title: subtask.title,
          completed: !!subtask.completed,
          order: index,
        }))
      : [];

    const project = new Task({
      owner: req.user._id,
      user: req.user._id,
      title,
      description,
      priority,
      category,
      dueDate,
      type: "project",
      subtasks: formattedSubtasks,
      order,
    });

    const createdProject = await project.save();
    const populatedProject = await Task.findById(createdProject._id)
      .populate("owner", "name email")
      .populate("collaborators", "name email");

    res.status(201).json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Invite a collaborator to a project
// @route   POST /api/projects/:id/invite
// @access  Private
export const inviteToProject = async (req, res) => {
  try {
    const { invite } = req.body;
    if (!invite) {
      return res.status(400).json({ message: "Invite must include email or username" });
    }

    const task = await Task.findById(req.params.id);
    if (!task || task.type !== "project") {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!isTaskOwner(task, req.user._id)) {
      return res.status(401).json({ message: "Only the owner can invite collaborators" });
    }

    const collaborator = await User.findOne({
      $or: [{ email: invite }, { name: invite }],
    });

    if (!collaborator) {
      return res.status(404).json({ message: "User not found" });
    }

    const ownerId = task.owner ? task.owner.toString() : task.user?.toString();
    if (collaborator._id.toString() === ownerId) {
      return res.status(400).json({ message: "Owner is already part of the project" });
    }

    if (task.collaborators.some((id) => id.toString() === collaborator._id.toString())) {
      return res.status(400).json({ message: "User is already a collaborator" });
    }

    if (task.collaborators.length >= 10) {
      return res.status(400).json({ message: "A project may have up to 10 collaborators" });
    }

    // Check for an existing pending invitation
    const existingInvite = await Invitation.findOne({
      from: req.user._id,
      to: collaborator._id,
      task: task._id,
      status: 'pending',
    });
    if (existingInvite) {
      return res.status(400).json({ message: "An invitation has already been sent to this user" });
    }

    const invitation = await Invitation.create({
      from: req.user._id,
      to: collaborator._id,
      task: task._id,
    });

    const populated = await Invitation.findById(invitation._id)
      .populate('from', 'name email')
      .populate('to', 'name email')
      .populate('task', 'title');

    res.status(201).json({ message: `Invitation sent to ${collaborator.name}`, invitation: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
