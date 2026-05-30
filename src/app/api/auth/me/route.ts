import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

export async function GET() {
  const current = await getCurrentUser();
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(current.userId).select("-password");
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      userId: current.userId,
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
