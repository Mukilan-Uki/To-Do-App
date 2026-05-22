import mongoose from "mongoose";

const subtaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true },
);

const taskSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["simple", "project"],
      default: "simple",
    },
    description: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    subtasks: [subtaskSchema],
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// Calculate progress for project tasks and keep status in sync
taskSchema.pre("save", function (next) {
  if (this.type === "project") {
    const total = this.subtasks.length;
    const completed = this.subtasks.filter(
      (subtask) => subtask.completed,
    ).length;
    this.progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    this.status = total > 0 && completed === total ? "completed" : "pending";
  } else {
    this.progress = this.status === "completed" ? 100 : 0;
  }
  if (this.collaborators && this.collaborators.length > 10) {
    return next(new Error("A task can have a maximum of 10 collaborators"));
  }
  next();
});

const Task = mongoose.model("Task", taskSchema);
export default Task;
