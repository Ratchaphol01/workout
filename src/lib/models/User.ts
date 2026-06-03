import mongoose, { Schema, Model, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface INotificationPrefs {
  weighIn: boolean;       // 7:00 ชั่งน้ำหนักตอนเช้า
  foodLog: boolean;       // 20:00 บันทึกอาหาร (ถ้ายังไม่ได้บันทึก)
  workoutStreak: boolean; // 18:00 รักษา streak (ถ้ายังไม่ได้ออกกำลัง)
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  weight?: number;
  height?: number;
  age?: number;
  gender?: "male" | "female" | "other";
  profileComplete: boolean;
  weightUpdatedAt?: Date;
  notificationPrefs?: INotificationPrefs;
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true, minlength: 6 },
  weight: { type: Number, min: 20, max: 300 },
  height: { type: Number, min: 50, max: 250 },
  age: { type: Number, min: 5, max: 120 },
  gender: { type: String, enum: ["male", "female", "other"] },
  profileComplete: { type: Boolean, default: false },
  weightUpdatedAt: { type: Date },
  notificationPrefs: {
    weighIn:       { type: Boolean, default: true },
    foodLog:       { type: Boolean, default: true },
    workoutStreak: { type: Boolean, default: true },
  },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", userSchema);
