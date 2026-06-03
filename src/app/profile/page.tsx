"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User, Scale, Ruler, Calendar, ChevronDown,
  LogOut, Save, Dumbbell, Flame, Activity,
} from "lucide-react";
import PushNotificationToggle from "@/components/PushNotificationToggle";

interface Profile {
  name: string;
  email: string;
  weight?: number;
  height?: number;
  age?: number;
  gender?: string;
}

function calcTDEE(weight?: number, height?: number, age?: number, gender?: string): number | null {
  if (!weight || !height || !age || !gender) return null;
  // Mifflin-St Jeor BMR
  const bmr =
    gender === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;
  return Math.round(bmr * 1.55); // moderate activity
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

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ name: "", weight: "", height: "", age: "", gender: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

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
      })
      .catch(() => router.push("/login"));
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

        {/* Avatar + name */}
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-violet-500 rounded-full flex items-center justify-center mb-3 shadow-lg">
            <User size={36} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">{profile.name}</h2>
          <p className="text-sm text-slate-400 mt-0.5">{profile.email}</p>
        </div>

        {/* Stats preview */}
        {(bmi || tdee) && (
          <div className="grid grid-cols-2 gap-3">
            {bmi && (
              <StatBadge
                label="BMI"
                value={bmi}
                unit={Number(bmi) < 18.5 ? "น้อยเกินไป" : Number(bmi) < 25 ? "ปกติ" : Number(bmi) < 30 ? "น้ำหนักเกิน" : "อ้วน"}
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

          {/* Name */}
          <div>
            <label className="label flex items-center gap-1.5">
              <User size={12} className="text-slate-400" /> ชื่อ
            </label>
            <input
              type="text"
              className="input"
              placeholder="ชื่อของคุณ"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Weight */}
            <div>
              <label className="label flex items-center gap-1.5">
                <Scale size={12} className="text-sky-500" /> น้ำหนัก (kg)
              </label>
              <input
                type="number"
                className="input"
                placeholder="70"
                min={20} max={300} step={0.1}
                value={form.weight}
                onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
              />
            </div>

            {/* Height */}
            <div>
              <label className="label flex items-center gap-1.5">
                <Ruler size={12} className="text-emerald-500" /> ส่วนสูง (cm)
              </label>
              <input
                type="number"
                className="input"
                placeholder="170"
                min={50} max={250}
                value={form.height}
                onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Age */}
            <div>
              <label className="label flex items-center gap-1.5">
                <Calendar size={12} className="text-violet-500" /> อายุ (ปี)
              </label>
              <input
                type="number"
                className="input"
                placeholder="25"
                min={5} max={120}
                value={form.age}
                onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
              />
            </div>

            {/* Gender */}
            <div>
              <label className="label">เพศ</label>
              <div className="relative">
                <select
                  className="input appearance-none pr-8 cursor-pointer"
                  value={form.gender}
                  onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                >
                  <option value="">เลือก...</option>
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                  <option value="other">อื่นๆ</option>
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className={`btn-primary w-full flex items-center justify-center gap-2 transition-colors ${
              saved ? "!bg-emerald-500" : ""
            }`}
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {saving ? "กำลังบันทึก..." : saved ? "บันทึกสำเร็จ ✓" : "บันทึก"}
          </button>
        </form>

        {/* Notification settings */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} className="text-violet-500" />
            <h3 className="font-semibold text-slate-700">การแจ้งเตือน</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Push Notification</p>
              <p className="text-xs text-slate-400 mt-0.5">แจ้งเตือนน้ำหนัก, อาหาร, streak</p>
            </div>
            <PushNotificationToggle showLabel />
          </div>
        </div>

        {/* Calorie info box */}
        {tdee && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Flame size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">ค่า TDEE ของคุณ ≈ {tdee.toLocaleString()} kcal/วัน</p>
                <p className="text-xs leading-relaxed text-amber-700">
                  คำนวณจากสูตร Mifflin-St Jeor × Activity Factor 1.55 (ออกกำลังกายปานกลาง)
                  ค่านี้ใช้เป็นเป้าหมายแคลอรีใน Nutrition
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
