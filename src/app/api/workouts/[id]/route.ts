import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Workout } from "@/lib/models/Workout";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await connectDB();

  const result = await Workout.deleteOne({
    _id: new Types.ObjectId(id),
    userId: new Types.ObjectId(user.userId),
  });

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
  }

  return NextResponse.json({ message: "ลบสำเร็จ" });
}
