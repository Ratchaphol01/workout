import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import FoodEntry from "@/lib/models/FoodEntry";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = request.nextUrl.searchParams.get("date");
  const start = request.nextUrl.searchParams.get("start");
  const end = request.nextUrl.searchParams.get("end");

  if (!date && !(start && end))
    return NextResponse.json({ error: "date or start+end required" }, { status: 400 });

  await connectDB();

  const query: Record<string, unknown> = { userId: new Types.ObjectId(user.userId) };
  if (date) query.date = date;
  else query.date = { $gte: start, $lte: end };

  const entries = await FoodEntry.find(query)
    .sort({ date: 1, createdAt: 1 })
    .lean();

  return NextResponse.json({ entries });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  await connectDB();

  const doc = await FoodEntry.create({
    userId: new Types.ObjectId(user.userId),
    date: body.date,
    mealType: body.mealType ?? "snack",
    name: body.name,
    calories: body.calories,
    protein: body.protein,
    carbs: body.carbs,
    fat: body.fat,
    amount: body.amount,
  });

  return NextResponse.json({ entry: doc }, { status: 201 });
}
