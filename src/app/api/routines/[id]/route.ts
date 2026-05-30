import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/auth";
import RoutineModel from "@/lib/models/Routine";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const routine = await RoutineModel.findOne({ _id: id, userId: user.userId }).lean();
  if (!routine) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    routine: { ...(routine as any), _id: (routine as any)._id.toString() },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, exercises } = await req.json();

  await connectDB();
  const routine = await RoutineModel.findOneAndUpdate(
    { _id: id, userId: user.userId },
    { ...(name && { name: name.trim() }), ...(exercises && { exercises }) },
    { new: true }
  );

  if (!routine) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    routine: { ...routine.toObject(), _id: routine._id.toString() },
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
  const result = await RoutineModel.deleteOne({ _id: id, userId: user.userId });

  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
