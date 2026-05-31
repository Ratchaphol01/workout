import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import FoodEntry from "@/lib/models/FoodEntry";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const doc = await FoodEntry.findById(id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.userId.toString() !== user.userId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await doc.deleteOne();
  return NextResponse.json({ ok: true });
}
