import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import WeightLog from "@/lib/models/WeightLog";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 60);
  await connectDB();

  const logs = await WeightLog.find({ userId: new Types.ObjectId(user.userId) })
    .sort({ date: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({ logs });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, weightKg } = await request.json();
  if (!date || !weightKg) return NextResponse.json({ error: "date and weightKg required" }, { status: 400 });

  await connectDB();

  // Upsert: one entry per day
  const log = await WeightLog.findOneAndUpdate(
    { userId: new Types.ObjectId(user.userId), date },
    { $set: { weightKg: Number(weightKg) } },
    { upsert: true, new: true }
  );

  return NextResponse.json({ log }, { status: 201 });
}
