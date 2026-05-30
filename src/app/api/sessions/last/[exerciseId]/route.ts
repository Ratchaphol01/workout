import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import WorkoutSessionModel from "@/lib/models/WorkoutSession";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ exerciseId: string }> }
) {
  const { exerciseId } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  // Find the most recent session that contains this exercise
  const session = await WorkoutSessionModel.findOne({
    userId: user.userId,
    "exercises.exerciseId": exerciseId,
  })
    .sort({ date: -1, createdAt: -1 })
    .lean();

  if (!session) return NextResponse.json({ sets: [] });

  const exerciseData = (session as any).exercises?.find(
    (e: any) => e.exerciseId === exerciseId
  );

  return NextResponse.json({ sets: exerciseData?.sets ?? [] });
}
