"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, Scale, Ruler, Calendar, ChevronDown,
  LogOut, Save, Dumbbell, Flame, Bell, BellOff,
} from "lucide-react";

interface NotificationPrefs {
  weighIn: boolean;
  foodLog: boolean;
  workoutStreak: boolean;
}

interface Profile {
  name: string;
  email: string;
  weight?: number;
  height?: number;
  age?: number;
  gender?: string;
  notificationPrefs?: NotificationPrefs;
}

function calcTDEE(weight?: number, height?: number, age?: number, gender?: string): number | null {
  if (!weight || !height || !age || !gender) return null;
  const bmr =
    gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;
  return Math.round(bmr * 1.55);
}

function StatBadge({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color: string }) {
  return (
    <div className={`rounded-2xl p-4 text-center ${color}`}>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {unit && <p className="text-xs opacity-70 mt-0.5">{unit}</p>}
      <p className="text-xs font-medium mt-1 opacity-80">{label}</p>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
        checked ? "bg-violet-500" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ---- Push subscription helper ----
function urlBase64ToUint8Array(b64: string) {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ name: "", weight: "", height: "", age: "", gender: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // push state
  const [pushStatus, setPushStatus] = useState<"loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed">("loading");
  const [prefs, setPrefs] = useState<NotificationPrefs>({ weighIn: true, foodLog: true, workoutStreak: true });
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d) { router.push("/login"); return; }
        const p: Profile = d.profile;
        setProfile(p);
        setForm({
          name: p.name ?? "",
          weight: p.weight ? String(p.weight) : "",
          height: p.height ? String(p.height) : "",
          age: p.age ? String(p.age) : "",
          gender: p.gender ?? "",
        });
        if (p.notificationPrefs) {
          setPrefs({
            weighIn: p.notificationPrefs.weighIn ?? true,
            foodLog: p.notificationPrefs.foodLog ?? true,
            workoutStreak: p.notificationPrefs.workoutStreak ?? true,
          });
        }
      })
      .catch(() => router.push("/login"));

    // check push subscription status
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushStatus("unsupported"); return;
    }
    if (Notification.permission === "denied") { setPushStatus("denied"); return; }
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setPushStatus(sub ? "subscribed" : "unsubscribed"))
      .catch(() => setPushStatus("unsubscribed"));
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || undefined,
          weight: form.weight || undefined,
          height: form.height || undefined,
          age: form.age || undefined,
          gender: form.gender || undefined,
        }),
      });
      if (!res.ok) { setError("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง"); return; }
      const d = await res.json();
      setProfile(d.profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSaving(false);
    }
  }

  async function subscribePush() {
    setPushStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setPushStatus("denied"); return; }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setPushStatus("subscribed");
    } catch {
      setPushStatus("unsubscribed");
    }
  }

  async function unsubscribePush() {
    setPushStatus("loading");
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setPushStatus("unsubscribed");
    } catch {
      setPushStatus("unsubscribed");
    }
  }

  async function savePref(key: keyof NotificationPrefs, value: boolean) {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSavingPrefs(true);
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationPrefs: updated }),
    }).finally(() => setSavingPrefs(false));
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-400">กำลังโหลด...</div>
      </div>
    );
  }

  const tdee = calcTDEE(
    form.weight ? Number(form.weight) : profile.weight,
    form.height ? Number(form.height) : profile.height,
    form.age ? Number(form.age) : profile.age,
    form.gender || profile.gender,
  );
  const bmi = (form.weight && form.height)
    ? (Number(form.weight) / Math.pow(Number(form.height) / 100, 2)).toFixed(1)
    : (profile.weight && profile.height)
    ? (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)
    : null;

  const NOTIF_ITEMS: { key: keyof NotificationPrefs; emoji: string; label: string; desc: string }[] = [
    { key: "weighIn",       emoji: "⚖️", label: "ชั่งน้ำหนักตอนเช้า",     desc: "แจ้งเตือนเวลา 07:00 น. ทุกวัน" },
    { key: "workoutStreak", emoji: "🔥", label: "รักษา Streak การออกกำลัง", desc: "แจ้งเตือนเวลา 18:00 น. หากยังไม่ออกกำลัง" },
    { key: "foodLog",       emoji: "🍽", label: "บันทึกอาหารประจำวัน",      desc: "แจ้งเตือนเวลา 20:00 น. หากยังไม่บันทึก" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <ChevronDown size={20} className="rotate-90" />
          </button>
          <h1 className="font-bold text-slate-800 text-lg flex-1">โปรไฟล์ & ตั้งค่า</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={15} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">

        {/* Avatar */}
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-violet-500 rounded-full flex items-center justify-center mb-3 shadow-lg">
            <User size={36} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">{profile.name}</h2>
          <p className="text-sm text-slate-400 mt-0.5">{profile.email}</p>
        </div>

        {/* Stats */}
        {(bmi || tdee) && (
          <div className="grid grid-cols-2 gap-3">
            {bmi && (
              <StatBadge
                label="BMI"
                value={bmi}
                unit={Number(bmi) < 18.5 ? "น้อยเกินไป" : Number(bmi) < 25 ? "ปกติ ✓" : Number(bmi) < 30 ? "น้ำหนักเกิน" : "อ้วน"}
                color={Number(bmi) < 18.5 ? "bg-sky-50 text-sky-700" : Number(bmi) < 25 ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}
              />
            )}
            {tdee && (
              <StatBadge
                label="TDEE ประมาณ"
                value={tdee.toLocaleString()}
                unit="kcal/วัน"
                color="bg-violet-50 text-violet-700"
              />
            )}
          </div>
        )}

        {/* Edit form */}
        <form onSubmit={handleSave} className="card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Dumbbell size={15} className="text-sky-500" />
            <h3 className="font-semibold text-slate-700">ข้อมูลส่วนตัว</h3>
          </div>

          <div>
            <label className="label flex items-center gap-1.5">
              <User size={12} className="text-slate-400" /> ชื่อ
            </label>
            <input type="text" className="input" placeholder="ชื่อของคุณ"
              value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1.5">
                <Scale size={12} className="text-sky-500" /> น้ำหนัก (kg)
              </label>
              <input type="number" className="input" placeholder="70" min={20} max={300} step={0.1}
                value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} />
            </div>
            <div>
              <label className="label flex items-center gap-1.5">
                <Ruler size={12} className="text-emerald-500" /> ส่วนสูง (cm)
              </label>
              <input type="number" className="input" placeholder="170" min={50} max={250}
                value={form.height} onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label flex items-center gap-1.5">
                <Calendar size={12} className="text-violet-500" /> อายุ (ปี)
              </label>
              <input type="number" className="input" placeholder="25" min={5} max={120}
                value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} />
            </div>
            <div>
              <label className="label">เพศ</label>
              <div className="relative">
                <select className="input appearance-none pr-8 cursor-pointer"
                  value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}>
                  <option value="">เลือก...</option>
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                  <option value="other">อื่นๆ</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <button type="submit" disabled={saving}
            className={`btn-primary w-full flex items-center justify-center gap-2 transition-colors ${saved ? "!bg-emerald-500" : ""}`}>
            {saving
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Save size={16} />}
            {saving ? "กำลังบันทึก..." : saved ? "บันทึกสำเร็จ ✓" : "บันทึก"}
          </button>
        </form>

        {/* Notification settings */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Bell size={15} className="text-violet-500" />
            <h3 className="font-semibold text-slate-700">การแจ้งเตือน</h3>
          </div>

          {pushStatus === "unsupported" && (
            <p className="text-sm text-slate-400">อุปกรณ์นี้ไม่รองรับ Push Notification</p>
          )}

          {pushStatus === "denied" && (
            <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-2.5 rounded-xl">
              <BellOff size={15} className="shrink-0" />
              <span>การแจ้งเตือนถูกบล็อก — ไปเปิดใน Settings ของ browser</span>
            </div>
          )}

          {(pushStatus === "subscribed" || pushStatus === "unsubscribed" || pushStatus === "loading") && (
            <>
              {/* Master toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">เปิดรับการแจ้งเตือน</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {pushStatus === "subscribed" ? "เปิดอยู่" : "ปิดอยู่"}
                  </p>
                </div>
                {pushStatus === "loading" ? (
                  <span className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Toggle
                    checked={pushStatus === "subscribed"}
                    onChange={(v) => v ? subscribePush() : unsubscribePush()}
                  />
                )}
              </div>

              {/* Individual toggles — shown only when subscribed */}
              {pushStatus === "subscribed" && (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                    เลือกประเภทการแจ้งเตือน {savingPrefs && <span className="normal-case text-violet-400">· กำลังบันทึก...</span>}
                  </p>

                  {NOTIF_ITEMS.map(({ key, emoji, label, desc }) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl shrink-0">{emoji}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 leading-tight">{label}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                        </div>
                      </div>
                      <Toggle checked={prefs[key]} onChange={(v) => savePref(key, v)} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* TDEE info */}
        {tdee && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Flame size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">TDEE ≈ {tdee.toLocaleString()} kcal/วัน</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  คำนวณจาก Mifflin-St Jeor × 1.55 (ออกกำลังกายปานกลาง) — ใช้เป็นเป้าหมายแคลอรีใน Nutrition
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
