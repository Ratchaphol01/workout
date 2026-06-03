import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import PushSubscription from "@/lib/models/PushSubscription";
import { getCurrentUser } from "@/lib/auth";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, body, icon, url } = await request.json();

  await connectDB();
  const subs = await PushSubscription.find({ userId: new Types.ObjectId(user.userId) }).lean();

  const payload = JSON.stringify({
    title: title ?? "EXC Tracker",
    body: body ?? "",
    icon: icon ?? "/icon-192.png",
    url: url ?? "/",
  });

  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: s.keys } as webpush.PushSubscription,
        payload
      )
    )
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  return NextResponse.json({ sent: subs.length - failed, failed });
}
