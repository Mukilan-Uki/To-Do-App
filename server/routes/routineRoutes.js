import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getRoutine,
  updateRoutine,
  toggleItemComplete,
  addRoutineItem,
  deleteRoutineItem,
} from "../controllers/routineController.js";

const router = express.Router();

router.get("/", protect, getRoutine);
router.put("/", protect, updateRoutine);
router.post("/items", protect, addRoutineItem);
router.put("/items/:itemId/toggle", protect, toggleItemComplete);
router.delete("/items/:itemId", protect, deleteRoutineItem);

export default router;
