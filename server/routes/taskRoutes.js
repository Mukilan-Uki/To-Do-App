import express from "express";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  reorderTasks,
  addCollaborator,
  removeCollaborator,
  addSubtask,
  updateSubtask,
  deleteSubtask,
} from "../controllers/taskController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getTasks).post(protect, createTask);

router.route("/reorder").put(protect, reorderTasks);

router
  .route("/:id")
  .get(protect, getTaskById)
  .put(protect, updateTask)
  .delete(protect, deleteTask);

router.route("/:id/collaborators").post(protect, addCollaborator);

router
  .route("/:id/collaborators/:collaboratorId")
  .delete(protect, removeCollaborator);

router.route("/:id/subtasks").post(protect, addSubtask);

router
  .route("/:id/subtasks/:subtaskId")
  .put(protect, updateSubtask)
  .delete(protect, deleteSubtask);

export default router;
