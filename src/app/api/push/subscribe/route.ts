import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import PushSubscription from "@/lib/models/PushSubscription";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { endpoint, keys } = body;
  if (!endpoint || !keys?.p256dh || !keys?.auth)
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });

  await connectDB();

  await PushSubscription.findOneAndUpdate(
    { userId: new Types.ObjectId(user.userId), endpoint },
    { userId: new Types.ObjectId(user.userId), endpoint, keys },
    { upsert: true, new: true }
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint } = await request.json();
  await connectDB();
  await PushSubscription.deleteOne({ userId: new Types.ObjectId(user.userId), endpoint });

  return NextResponse.json({ ok: true });
}
