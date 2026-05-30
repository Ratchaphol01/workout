import mongoose, { Schema, Model, Document, Types } from "mongoose";

export interface IWorkout extends Document {
  userId: Types.ObjectId;
  date: string;
  type: string;
  duration: number;
  calories: number;
  notes?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

const workoutSchema = new Schema<IWorkout>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  date: { type: String, required: true },
  type: { type: String, required: true },
  duration: { type: Number, required: true },
  calories: { type: Number, required: true },
  notes: String,
  details: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

workoutSchema.index({ userId: 1, date: -1 });

export const Workout: Model<IWorkout> =
  mongoose.models.Workout ??
  mongoose.model<IWorkout>("Workout", workoutSchema);
