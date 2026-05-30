import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

export async function GET() {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(current.userId).select("-password");
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    profile: {
      name: user.name,
      email: user.email,
      weight: user.weight,
      height: user.height,
      age: user.age,
      gender: user.gender,
      profileComplete: user.profileComplete,
      weightUpdatedAt: user.weightUpdatedAt,
    },
  });
}

export async function PUT(request: NextRequest) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  await connectDB();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {};

  if (body.weight !== undefined && body.weight !== "") {
    update.weight = Number(body.weight);
    update.weightUpdatedAt = new Date();
  }
  if (body.height !== undefined && body.height !== "") {
    update.height = Number(body.height);
  }
  if (body.age !== undefined && body.age !== "") {
    update.age = Number(body.age);
  }
  if (body.gender) update.gender = body.gender;
  if (body.profileComplete !== undefined) {
    update.profileComplete = body.profileComplete;
  }

  const user = await User.findByIdAndUpdate(
    current.userId,
    { $set: update },
    { new: true }
  ).select("-password");

  return NextResponse.json({
    profile: {
      name: user?.name,
      email: user?.email,
      weight: user?.weight,
      height: user?.height,
      age: user?.age,
      gender: user?.gender,
      profileComplete: user?.profileComplete,
      weightUpdatedAt: user?.weightUpdatedAt,
    },
  });
}
