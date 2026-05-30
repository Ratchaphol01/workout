import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Workout } from "@/lib/models/Workout";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const docs = await Workout.find({ userId: new Types.ObjectId(user.userId) })
    .sort({ date: -1, createdAt: -1 })
    .lean();

  const workouts = docs.map((w) => ({
    id: (w._id as Types.ObjectId).toString(),
    date: w.date,
    type: w.type,
    duration: w.duration,
    calories: w.calories,
    notes: w.notes,
    details: w.details,
  }));

  return NextResponse.json({ workouts });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  await connectDB();

  const doc = await Workout.create({
    userId: new Types.ObjectId(user.userId),
    date: body.date,
    type: body.type,
    duration: body.duration,
    calories: body.calories,
    notes: body.notes,
    details: body.details,
  });

  return NextResponse.json(
    {
      workout: {
        id: doc._id.toString(),
        date: doc.date,
        type: doc.type,
        duration: doc.duration,
        calories: doc.calories,
        notes: doc.notes,
        details: doc.details,
      },
    },
    { status: 201 }
  );
}
