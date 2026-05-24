import Task from "../models/Task.js";
import User from "../models/User.js";
import Invitation from "../models/Invitation.js";

// Helper: update user streak + productivity score after completing a task
const updateStreakAndScore = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastDate = user.lastCompletionDate ? new Date(user.lastCompletionDate) : null;
    if (lastDate) {
      lastDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
        // Already logged today — no streak change
      } else if (diffDays === 1) {
        user.streak += 1; // Consecutive day
      } else {
        user.streak = 1; // Streak broken
      }
    } else {
      user.streak = 1; // First ever completion
    }

    user.lastCompletionDate = today;

    // Count tasks completed today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const completedToday = await Task.countDocuments({
      $or: [{ owner: userId }, { user: userId }],
      status: 'completed',
      updatedAt: { $gte: todayStart },
    });
    user.productivityScore = Math.min(completedToday * 20, 100);

    await user.save();
  } catch (err) {
    console.error('Streak update error:', err.message);
  }
};

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

// @desc    Get logged in user's tasks
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      $or: [
        { owner: req.user._id },
        { user: req.user._id },
        { collaborators: req.user._id },
      ],
    })
      .sort({ order: 1, createdAt: -1 })
      .populate("owner", "name email")
      .populate("collaborators", "name email");

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get task by id
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("owner", "name email")
      .populate("collaborators", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!canAccessTask(task, req.user._id)) {
      return res
        .status(401)
        .json({ message: "Not authorized to view this task" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res) => {
  try {
    const { title, description, priority, category, dueDate, type, subtasks } =
      req.body;

    const lastTask = await Task.findOne({ owner: req.user._id }).sort({
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

    const task = new Task({
      owner: req.user._id,
      user: req.user._id,
      title,
      description,
      priority,
      category,
      dueDate,
      type: type === "project" ? "project" : "simple",
      subtasks: formattedSubtasks,
      order,
    });

    const createdTask = await task.save();
    const populatedTask = await Task.findById(createdTask._id)
      .populate("owner", "name email")
      .populate("collaborators", "name email");

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!canAccessTask(task, req.user._id)) {
      return res.status(401).json({ message: "User not authorized" });
    }

    const ownerOnlyFields = ["collaborators", "owner", "type"];
    if (
      !isTaskOwner(task, req.user._id) &&
      ownerOnlyFields.some((field) => field in req.body)
    ) {
      return res
        .status(401)
        .json({ message: "Only the owner can update this field" });
    }

    const wasCompleted = task.status === 'completed';
    task.title = req.body.title ?? task.title;
    task.description = req.body.description ?? task.description;
    task.priority = req.body.priority ?? task.priority;
    task.category = req.body.category ?? task.category;
    task.dueDate = req.body.dueDate ?? task.dueDate;
    task.status = req.body.status ?? task.status;

    if (req.body.type && isTaskOwner(task, req.user._id)) {
      task.type = req.body.type === "project" ? "project" : "simple";
      if (task.type === "simple") {
        task.subtasks = [];
      }
    }

    if (req.body.subtasks && Array.isArray(req.body.subtasks)) {
      task.subtasks = req.body.subtasks.map((subtask, index) => ({
        _id: subtask._id,
        title: subtask.title,
        completed: !!subtask.completed,
        order: subtask.order ?? index,
      }));
    }

    if (req.body.collaborators && isTaskOwner(task, req.user._id)) {
      task.collaborators = req.body.collaborators;
    }

    await task.save();

    // Update streak if task was just marked complete
    if (!wasCompleted && task.status === 'completed') {
      const ownerId = task.owner ? task.owner.toString() : task.user?.toString();
      await updateStreakAndScore(ownerId);
    }

    const updatedTask = await Task.findById(task._id)
      .populate("owner", "name email")
      .populate("collaborators", "name email");

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!isTaskOwner(task, req.user._id)) {
      return res.status(401).json({ message: "User not authorized" });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reorder tasks (Drag and Drop)
// @route   PUT /api/tasks/reorder
// @access  Private
export const reorderTasks = async (req, res) => {
  try {
    const { items } = req.body;

    for (const item of items) {
      await Task.findOneAndUpdate(
        {
          _id: item._id,
          $or: [{ owner: req.user._id }, { collaborators: req.user._id }],
        },
        { order: item.order },
      );
    }

    res.json({ message: "Tasks reordered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Invite a collaborator to a task (creates a pending invitation)
// @route   POST /api/tasks/:id/collaborators
// @access  Private
export const addCollaborator = async (req, res) => {
  try {
    const { invite } = req.body;
    if (!invite) {
      return res.status(400).json({ message: "Invite must include email or username" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
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
      return res.status(400).json({ message: "Owner is already part of the task" });
    }

    if (task.collaborators.some((id) => id.toString() === collaborator._id.toString())) {
      return res.status(400).json({ message: "User is already a collaborator" });
    }

    if (task.collaborators.length >= 10) {
      return res.status(400).json({ message: "A task may have up to 10 collaborators" });
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

// @desc    Remove collaborator from task
// @route   DELETE /api/tasks/:id/collaborators/:collaboratorId
// @access  Private
export const removeCollaborator = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!isTaskOwner(task, req.user._id)) {
      return res
        .status(401)
        .json({ message: "Only the owner can remove collaborators" });
    }

    task.collaborators = task.collaborators.filter(
      (id) => id.toString() !== req.params.collaboratorId,
    );

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("owner", "name email")
      .populate("collaborators", "name email");

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a subtask
// @route   POST /api/tasks/:id/subtasks
// @access  Private
export const addSubtask = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Subtask title is required" });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!canAccessTask(task, req.user._id)) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (task.type !== "project") {
      return res
        .status(400)
        .json({ message: "Subtasks can only be added to project tasks" });
    }

    task.subtasks.push({
      title,
      completed: false,
      order: task.subtasks.length,
    });
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("owner", "name email")
      .populate("collaborators", "name email");

    res.status(201).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update subtask
// @route   PUT /api/tasks/:id/subtasks/:subtaskId
// @access  Private
export const updateSubtask = async (req, res) => {
  try {
    const { title, completed } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!canAccessTask(task, req.user._id)) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (task.type !== "project") {
      return res
        .status(400)
        .json({ message: "Subtasks only available for project tasks" });
    }

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) {
      return res.status(404).json({ message: "Subtask not found" });
    }

    if (title !== undefined) subtask.title = title;
    if (completed !== undefined) subtask.completed = completed;

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("owner", "name email")
      .populate("collaborators", "name email");

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a subtask
// @route   DELETE /api/tasks/:id/subtasks/:subtaskId
// @access  Private
export const deleteSubtask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!canAccessTask(task, req.user._id)) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (task.type !== "project") {
      return res
        .status(400)
        .json({ message: "Subtasks only available for project tasks" });
    }

    task.subtasks.pull(req.params.subtaskId);

    task.subtasks.forEach((subtask, index) => {
      subtask.order = index;
    });

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate("owner", "name email")
      .populate("collaborators", "name email");

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
