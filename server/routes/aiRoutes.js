import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { chatWithAI, chatRoutineHealth } from "../controllers/aiController.js";

const router = express.Router();

router.post("/chat", protect, chatWithAI);
router.post("/routine-health", protect, chatRoutineHealth);

export default router;
