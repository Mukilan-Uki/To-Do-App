import mongoose from "mongoose";

const routineItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    time: { type: String, required: true },
    duration: { type: Number, default: 15 },
    category: {
      type: String,
      enum: ["general", "health", "workout", "wellness", "other"],
      default: "general",
    },
    reminder: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    completedDates: [{ type: String }],
  },
  { _id: true },
);

const routineSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    title: { type: String, default: "My Daily Routine", trim: true },
    items: [routineItemSchema],
    isRecurring: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Routine = mongoose.model("Routine", routineSchema);
export default Routine;
