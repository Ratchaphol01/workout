import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPushSubscription extends Document {
  userId: Types.ObjectId;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  createdAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>({
  userId:   { type: Schema.Types.ObjectId, required: true, ref: "User" },
  endpoint: { type: String, required: true },
  keys:     {
    p256dh: { type: String, required: true },
    auth:   { type: String, required: true },
  },
}, { timestamps: true });

PushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

export default mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);
