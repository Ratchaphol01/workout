import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import WorkoutSessionModel from "@/lib/models/WorkoutSession";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "30"), 100);
  const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);

  await connectDB();
  const sessions = await WorkoutSessionModel.find({ userId: user.userId })
    .sort({ date: -1, createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return NextResponse.json({
    sessions: sessions.map((s: any) => ({
      ...s,
      _id: s._id.toString(),
      userId: s.userId.toString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    date,
    startedAt,
    finishedAt,
    duration,
    exercises = [],
    notes,
    totalVolume = 0,
    totalCalories,
  } = body;

  if (!date || !finishedAt) {
    return NextResponse.json({ error: "date and finishedAt required" }, { status: 400 });
  }

  await connectDB();
  const session = await WorkoutSessionModel.create({
    userId: user.userId,
    date,
    startedAt,
    finishedAt,
    duration,
    exercises,
    notes,
    totalVolume,
    totalCalories,
  });

  return NextResponse.json({
    session: { ...session.toObject(), _id: session._id.toString() },
  });
}
