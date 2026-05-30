import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import PRModel from "@/lib/models/PersonalRecord";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const prs = await PRModel.find({ userId: user.userId })
    .sort({ oneRM: -1 })
    .lean();

  return NextResponse.json({
    prs: prs.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
      userId: p.userId.toString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { exerciseId, exerciseName, weight, reps, oneRM } = await req.json();
  if (!exerciseId || !oneRM) {
    return NextResponse.json({ error: "exerciseId and oneRM required" }, { status: 400 });
  }

  await connectDB();

  // Only save if it's actually a new PR
  const existing = await PRModel.findOne({ userId: user.userId, exerciseId });
  if (existing && existing.oneRM >= oneRM) {
    return NextResponse.json({ pr: null, isNew: false });
  }

  const pr = await PRModel.findOneAndUpdate(
    { userId: user.userId, exerciseId },
    {
      userId: user.userId,
      exerciseId,
      exerciseName,
      weight,
      reps,
      oneRM,
      date: new Date().toISOString().split("T")[0],
    },
    { upsert: true, new: true }
  );

  return NextResponse.json({
    pr: { ...pr.toObject(), _id: pr._id.toString() },
    isNew: true,
  });
}
