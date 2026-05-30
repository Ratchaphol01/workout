import mongoose, { Schema } from "mongoose";

const PRSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    exerciseId: { type: String, required: true },
    exerciseName: String,
    weight: Number,
    reps: Number,
    oneRM: { type: Number, required: true },
    date: String,
  },
  { timestamps: true }
);

PRSchema.index({ userId: 1, exerciseId: 1 }, { unique: true });

export default mongoose.models.PersonalRecord ??
  mongoose.model("PersonalRecord", PRSchema);
