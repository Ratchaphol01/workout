import mongoose, { Schema } from "mongoose";

const SavedSetSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["warm-up", "working", "drop", "failure"],
      default: "working",
    },
    weight: { type: Number, default: 0 },
    reps: { type: Number, default: 0 },
    completedAt: String,
  },
  { _id: false }
);

const SavedExerciseSchema = new Schema(
  {
    exerciseId: String,
    exerciseName: String,
    muscleGroup: String,
    sets: [SavedSetSchema],
    notes: String,
  },
  { _id: false }
);

const WorkoutSessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: { type: String, required: true },
    startedAt: String,
    finishedAt: String,
    duration: Number,
    exercises: [SavedExerciseSchema],
    notes: String,
    totalVolume: { type: Number, default: 0 },
    totalCalories: Number,
  },
  { timestamps: true }
);

WorkoutSessionSchema.index({ userId: 1, date: -1 });

export default mongoose.models.WorkoutSession ??
  mongoose.model("WorkoutSession", WorkoutSessionSchema);
