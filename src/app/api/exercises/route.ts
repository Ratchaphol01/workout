import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import CustomExerciseModel from "@/lib/models/CustomExercise";
import { DEFAULT_EXERCISES } from "@/lib/exercises";
import { genId } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const customDocs = await CustomExerciseModel.find({ userId: user.userId }).lean();

  const customs = customDocs.map((c: any) => ({
    id: c._id.toString(),
    name: c.name,
    muscleGroup: c.muscleGroup,
    category: c.category,
    equipment: c.equipment,
    isCustom: true as const,
    userId: user.userId,
  }));

  return NextResponse.json({ exercises: [...DEFAULT_EXERCISES, ...customs] });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, muscleGroup, category = "isolation", equipment = "other" } = body;

  if (!name?.trim() || !muscleGroup) {
    return NextResponse.json({ error: "name and muscleGroup required" }, { status: 400 });
  }

  await connectDB();
  const doc = await CustomExerciseModel.create({
    userId: user.userId,
    name: name.trim(),
    muscleGroup,
    category,
    equipment,
  });

  return NextResponse.json({
    exercise: {
      id: doc._id.toString(),
      name: doc.name,
      muscleGroup: doc.muscleGroup,
      category: doc.category,
      equipment: doc.equipment,
      isCustom: true,
      userId: user.userId,
    },
  });
}
