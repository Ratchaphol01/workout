import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { connectDB } from "@/lib/mongodb";
import PushSubscriptionModel from "@/lib/models/PushSubscription";
import FoodEntry from "@/lib/models/FoodEntry";
import { Workout } from "@/lib/models/Workout";
import WorkoutSession from "@/lib/models/WorkoutSession";
import { User } from "@/lib/models/User";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

function thaiDate(d = new Date()) {
  const offset = d.getTime() + 7 * 60 * 60 * 1000;
  const t = new Date(offset);
  return t.toISOString().slice(0, 10); // YYYY-MM-DD
}

function thaiHour(d = new Date()) {
  return (d.getUTCHours() + 7) % 24;
}

async function sendToUser(userId: string, payload: object) {
  const subs = await PushSubscriptionModel.find({ userId }).lean();
  await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: s.keys } as webpush.PushSubscription,
        JSON.stringify(payload)
      )
    )
  );
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const hour = thaiHour();
  const today = thaiDate();

  // ดึงผู้ใช้ที่มี push subscription
  const subscriptions = await PushSubscriptionModel.distinct("userId");
  if (!subscriptions.length) return NextResponse.json({ ok: true, sent: 0 });

  const users = await User.find({ _id: { $in: subscriptions } }).lean();

  let sent = 0;

  for (const user of users) {
    const prefs = (user as { notificationPrefs?: { weighIn?: boolean; foodLog?: boolean; workoutStreak?: boolean } }).notificationPrefs;
    const uid = String(user._id);

    // 7:00 น. — ชั่งน้ำหนักตอนเช้า
    if (hour === 7 && prefs?.weighIn !== false) {
      await sendToUser(uid, {
        title: "⚖️ ชั่งน้ำหนักเช้านี้",
        body: "อย่าลืมบันทึกน้ำหนักวันนี้ เพื่อติดตาม progress ของคุณ",
        icon: "/icon-192.png",
        url: "/",
      });
      sent++;
    }

    // 18:00 น. — รักษา Streak (ถ้าไม่ได้ออกกำลังวันนี้)
    if (hour === 18 && prefs?.workoutStreak !== false) {
      const [hasWorkout, hasSession] = await Promise.all([
        Workout.exists({ userId: user._id, date: today }),
        WorkoutSession.exists({ userId: user._id, date: today }),
      ]);
      if (!hasWorkout && !hasSession) {
        await sendToUser(uid, {
          title: "🔥 รักษา Streak ของคุณ!",
          body: "วันนี้ยังไม่ได้ออกกำลังกาย — ออกสักนิดก็ยังดี!",
          icon: "/icon-192.png",
          url: "/workout",
        });
        sent++;
      }
    }

    // 20:00 น. — บันทึกอาหาร (ถ้ายังไม่บันทึกวันนี้)
    if (hour === 20 && prefs?.foodLog !== false) {
      const hasFood = await FoodEntry.exists({ userId: user._id, date: today });
      if (!hasFood) {
        await sendToUser(uid, {
          title: "🍽 อย่าลืมบันทึกอาหาร",
          body: "วันนี้ยังไม่มีรายการอาหาร — บันทึกเพื่อติดตามแคลอรีของคุณ",
          icon: "/icon-192.png",
          url: "/nutrition",
        });
        sent++;
      }
    }
  }

  return NextResponse.json({ ok: true, sent, hour, today });
}
