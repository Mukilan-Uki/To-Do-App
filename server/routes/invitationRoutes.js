import express from 'express';
import {
  getMyInvitations,
  acceptInvitation,
  rejectInvitation,
} from '../controllers/invitationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMyInvitations);
router.put('/:id/accept', protect, acceptInvitation);
router.put('/:id/reject', protect, rejectInvitation);

export default router;
