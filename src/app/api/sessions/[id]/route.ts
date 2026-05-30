import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import WorkoutSessionModel from "@/lib/models/WorkoutSession";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const session = await WorkoutSessionModel.findOne({
    _id: id,
    userId: user.userId,
  }).lean();

  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    session: { ...(session as any), _id: (session as any)._id.toString() },
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const result = await WorkoutSessionModel.deleteOne({
    _id: id,
    userId: user.userId,
  });

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
