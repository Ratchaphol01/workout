import mongoose, { Schema } from "mongoose";

const WeightLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true },
    weightKg: { type: Number, required: true },
  },
  { timestamps: true }
);

// One entry per user per day
WeightLogSchema.index({ userId: 1, date: 1 }, { unique: true });
WeightLogSchema.index({ userId: 1, date: -1 });

export default mongoose.models.WeightLog ??
  mongoose.model("WeightLog", WeightLogSchema);
