import express from "express";
import {
  getProjects,
  createProject,
  inviteToProject,
} from "../controllers/projectController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, getProjects).post(protect, createProject);

router.route("/:id/invite").post(protect, inviteToProject);

export default router;
