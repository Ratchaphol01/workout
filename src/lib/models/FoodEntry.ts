import mongoose, { Schema } from "mongoose";

const FoodEntrySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: { type: String, required: true },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snack"],
      default: "snack",
    },
    name: { type: String, required: true },
    calories: { type: Number, required: true },
    protein: Number,
    carbs: Number,
    fat: Number,
    amount: String, // e.g. "1 จาน", "200g"
  },
  { timestamps: true }
);

FoodEntrySchema.index({ userId: 1, date: -1 });

export default mongoose.models.FoodEntry ??
  mongoose.model("FoodEntry", FoodEntrySchema);
