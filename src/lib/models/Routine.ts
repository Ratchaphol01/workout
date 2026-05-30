import mongoose, { Schema } from "mongoose";

const RoutineExerciseSchema = new Schema(
  {
    exerciseId: String,
    exerciseName: String,
    muscleGroup: String,
    targetSets: { type: Number, default: 3 },
    targetReps: { type: Number, default: 10 },
  },
  { _id: false }
);

const RoutineSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    exercises: [RoutineExerciseSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Routine ??
  mongoose.model("Routine", RoutineSchema);
