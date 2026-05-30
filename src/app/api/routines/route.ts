import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import RoutineModel from "@/lib/models/Routine";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const routines = await RoutineModel.find({ userId: user.userId })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    routines: routines.map((r: any) => ({
      ...r,
      _id: r._id.toString(),
      userId: r.userId.toString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, exercises = [] } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  await connectDB();
  const routine = await RoutineModel.create({
    userId: user.userId,
    name: name.trim(),
    exercises,
  });

  return NextResponse.json({
    routine: { ...routine.toObject(), _id: routine._id.toString() },
  });
}
