import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  chatWithAI,
  chatRoutineHealth,
  unifiedChat,
  unifiedChatStream,
  getAIContext,
} from "../controllers/aiController.js";

const router = express.Router();

router.get("/context", protect, getAIContext);
router.post("/unified", protect, unifiedChat);
router.post("/unified/stream", protect, unifiedChatStream);
router.post("/chat", protect, chatWithAI);
router.post("/routine-health", protect, chatRoutineHealth);

export default router;
