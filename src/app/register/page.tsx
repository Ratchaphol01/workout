"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dumbbell, Eye, EyeOff, Check, X } from "lucide-react";

const RULES = [
  { label: "อย่างน้อย 8 ตัวอักษร",             test: (p: string) => p.length >= 8 },
  { label: "มีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "มีตัวเลขอย่างน้อย 1 ตัว (0-9)",      test: (p: string) => /[0-9]/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const allPassed = RULES.every((r) => r.test(password));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!allPassed) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "เกิดข้อผิดพลาด"); return; }
      router.push("/profile/setup");
      router.refresh();
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm p-8">
        <div className="flex flex-col items-center mb-7">
          <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-sky-200">
            <Dumbbell size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">WorkoutLog</h1>
          <p className="text-sm text-slate-500 mt-1">สร้างบัญชีเพื่อเริ่มติดตามการออกกำลังกาย</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">ชื่อ</label>
            <input type="text" className="input" placeholder="ชื่อของคุณ"
              value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </div>

          <div>
            <label className="label">อีเมล</label>
            <input type="email" className="input" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>

          <div>
            <label className="label">รหัสผ่าน</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                className={`input pr-11 ${touched && !allPassed ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setTouched(true); }}
                required
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password rules checklist */}
            {(touched || password.length > 0) && (
              <div className="mt-2.5 space-y-1.5 bg-slate-50 rounded-xl px-3 py-2.5">
                {RULES.map((rule) => {
                  const ok = rule.test(password);
                  return (
                    <div key={rule.label} className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        ok ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"
                      }`}>
                        {ok ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
                      </span>
                      <span className={`text-xs ${ok ? "text-emerald-600" : "text-slate-400"}`}>
                        {rule.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          มีบัญชีแล้ว?{" "}
          <Link href="/login" className="text-sky-500 font-semibold hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
