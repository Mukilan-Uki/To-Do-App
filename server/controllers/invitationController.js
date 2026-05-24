import Invitation from '../models/Invitation.js';
import Task from '../models/Task.js';

// @desc    Get all pending invitations for the logged-in user
// @route   GET /api/invitations
// @access  Private
export const getMyInvitations = async (req, res) => {
  try {
    const invitations = await Invitation.find({
      to: req.user._id,
      status: 'pending',
    })
      .populate('from', 'name email')
      .populate('task', 'title type priority category')
      .sort({ createdAt: -1 });

    res.json(invitations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept a collaboration invitation
// @route   PUT /api/invitations/:id/accept
// @access  Private
export const acceptInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.to.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already responded to' });
    }

    // Add user to task collaborators
    const task = await Task.findById(invitation.task);
    if (!task) {
      invitation.status = 'rejected';
      await invitation.save();
      return res.status(404).json({ message: 'Task no longer exists' });
    }

    // Avoid duplicates
    const alreadyCollaborator = task.collaborators.some(
      (id) => id.toString() === req.user._id.toString()
    );
    if (!alreadyCollaborator) {
      task.collaborators.push(req.user._id);
      await task.save();
    }

    invitation.status = 'accepted';
    await invitation.save();

    const updatedTask = await Task.findById(task._id)
      .populate('owner', 'name email')
      .populate('collaborators', 'name email');

    res.json({ invitation, task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject a collaboration invitation
// @route   PUT /api/invitations/:id/reject
// @access  Private
export const rejectInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);

    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (invitation.to.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: 'Invitation already responded to' });
    }

    invitation.status = 'rejected';
    await invitation.save();

    res.json({ message: 'Invitation rejected', invitation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
