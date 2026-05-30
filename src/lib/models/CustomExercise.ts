import mongoose, { Schema } from "mongoose";

const CustomExerciseSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    muscleGroup: { type: String, required: true },
    category: {
      type: String,
      enum: ["compound", "isolation"],
      default: "isolation",
    },
    equipment: { type: String, default: "other" },
  },
  { timestamps: true }
);

export default mongoose.models.CustomExercise ??
  mongoose.model("CustomExercise", CustomExerciseSchema);
