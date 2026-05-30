"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Scale, Ruler, Calendar, ChevronDown, ArrowRight, SkipForward } from "lucide-react";

interface UserInfo {
  name: string;
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) { router.push("/login"); return; }
        if (d.user.profileComplete) { router.push("/"); return; }
        setUser({ name: d.user.name });
      })
      .catch(() => router.push("/login"));
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weight) { setError("กรุณากรอกน้ำหนักตัว"); return; }
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: weight || undefined,
          height: height || undefined,
          age: age || undefined,
          gender: gender || undefined,
          profileComplete: true,
        }),
      });

      if (!res.ok) { setError("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง"); return; }
      router.push("/");
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileComplete: true }),
    }).catch(() => {});
    router.push("/");
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-sm text-slate-400">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-violet-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 bg-sky-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-sky-200">
            <Dumbbell size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            สวัสดี {user.name}!
          </h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            กรอกข้อมูลร่างกายเพื่อให้การคำนวณแคลอรีแม่นยำขึ้น
            <br />
            <span className="text-sky-500 font-medium">
              สูตร MET × น้ำหนัก × เวลา
            </span>{" "}
            แม่นกว่าค่าตายตัวถึง 2-3 เท่า
          </p>
        </div>

        {/* Info box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-xs text-amber-700">
          <strong>ทำไมต้องกรอกน้ำหนัก?</strong> คน 60kg และ 90kg
          วิ่งเหมือนกัน 30 นาที เผาผลาญต่างกัน ~40% —
          น้ำหนักคือตัวแปรสำคัญที่สุด
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Weight — required */}
          <div>
            <label className="label flex items-center gap-1.5">
              <Scale size={13} className="text-sky-500" />
              น้ำหนัก (kg){" "}
              <span className="text-red-400 font-bold">*</span>
            </label>
            <input
              type="number"
              className="input"
              placeholder="70"
              min={20}
              max={300}
              step={0.1}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              autoFocus
            />
          </div>

          {/* Height — optional */}
          <div>
            <label className="label flex items-center gap-1.5">
              <Ruler size={13} className="text-emerald-500" />
              ส่วนสูง (cm){" "}
              <span className="text-xs text-slate-400 font-normal">
                (ไม่บังคับ)
              </span>
            </label>
            <input
              type="number"
              className="input"
              placeholder="170"
              min={50}
              max={250}
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Age */}
            <div>
              <label className="label flex items-center gap-1.5">
                <Calendar size={13} className="text-violet-500" />
                อายุ (ปี){" "}
                <span className="text-xs text-slate-400 font-normal">
                  (ไม่บังคับ)
                </span>
              </label>
              <input
                type="number"
                className="input"
                placeholder="25"
                min={5}
                max={120}
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>

            {/* Gender */}
            <div>
              <label className="label">
                เพศ{" "}
                <span className="text-xs text-slate-400 font-normal">
                  (ไม่บังคับ)
                </span>
              </label>
              <div className="relative">
                <select
                  className="input appearance-none pr-8 cursor-pointer"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">เลือก...</option>
                  <option value="male">ชาย</option>
                  <option value="female">หญิง</option>
                  <option value="other">อื่นๆ</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {saving ? (
              "กำลังบันทึก..."
            ) : (
              <>
                เริ่มใช้งาน <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        <button
          onClick={handleSkip}
          className="w-full mt-3 flex items-center justify-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 py-2 transition-colors"
        >
          <SkipForward size={14} />
          ข้ามขั้นตอนนี้ (ใช้ค่าเริ่มต้น 70 kg)
        </button>
      </div>
    </div>
  );
}
