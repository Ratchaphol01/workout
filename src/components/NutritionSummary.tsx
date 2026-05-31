"use client";

import { useState, useEffect } from "react";
import { UtensilsCrossed, ArrowRight } from "lucide-react";
import Link from "next/link";
import { calcTDEE, localDate } from "@/lib/utils";
import { DIET_PLANS, type DietPlan } from "@/lib/nutrition";

interface FoodEntry {
  calories: number;
}

interface Profile {
  weight?: number;
  height?: number;
  age?: number;
  gender?: "male" | "female" | "other";
}

export default function NutritionSummary() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [profile, setProfile] = useState<Profile>({});
  const [burned, setBurned] = useState(0);
  const [activityLevel, setActivityLevel] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [dietPlan, setDietPlan] = useState<DietPlan>("maintenance");
  const [avgWeight, setAvgWeight] = useState<number | null>(null);

  const todayStr = localDate();

  useEffect(() => {
    const savedActivity = localStorage.getItem("nutrition_activity");
    if (savedActivity) setActivityLevel(Number(savedActivity) as 1 | 2 | 3 | 4 | 5);
    const savedPlan = localStorage.getItem("nutrition_plan") as DietPlan | null;
    if (savedPlan && savedPlan in DIET_PLANS) setDietPlan(savedPlan);

    fetch(`/api/food?date=${todayStr}`)
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((d) => setEntries(d.entries ?? []));

    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.profile) setProfile(d.profile); });

    fetch("/api/workouts")
      .then((r) => (r.ok ? r.json() : { workouts: [] }))
      .then((d) => {
        const b = (d.workouts ?? [])
          .filter((w: { date: string; calories: number }) => w.date === todayStr)
          .reduce((s: number, w: { calories: number }) => s + (w.calories ?? 0), 0);
        setBurned(b);
      });

    fetch("/api/weight?limit=7")
      .then((r) => (r.ok ? r.json() : { logs: [] }))
      .then((d) => {
        const logs: { weightKg: number }[] = d.logs ?? [];
        if (logs.length > 0) {
          setAvgWeight(logs.reduce((s, l) => s + l.weightKg, 0) / logs.length);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eaten = entries.reduce((s, e) => s + e.calories, 0);

  const weightForTDEE = avgWeight ?? profile.weight;
  const tdee =
    weightForTDEE && profile.height && profile.age && profile.gender
      ? calcTDEE(weightForTDEE, profile.height, profile.age, profile.gender, activityLevel)
      : 2000;

  const planCfg = DIET_PLANS[dietPlan];
  const calorieTarget = tdee + planCfg.calAdj;
  const remaining = Math.max(0, calorieTarget - eaten + burned);
  const pct = Math.min(1, (eaten - burned) / calorieTarget);
  const overEaten = eaten - burned > calorieTarget;

  const R = 28;
  const C = 2 * Math.PI * R;

  if (eaten === 0 && burned === 0) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <UtensilsCrossed size={16} className="text-orange-400" />
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
            โภชนาการวันนี้
          </h2>
        </div>
        <p className="text-sm text-slate-400 text-center py-3">ยังไม่มีบันทึกอาหารวันนี้</p>
        <Link
          href="/nutrition"
          className="flex items-center justify-center gap-1.5 text-sm text-orange-500 font-medium hover:text-orange-600 transition-colors"
        >
          บันทึกอาหาร <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UtensilsCrossed size={16} className="text-orange-400" />
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
            โภชนาการวันนี้
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Plan badge */}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${planCfg.bg} ${planCfg.color}`}>
            {planCfg.label}
          </span>
          <Link
            href="/nutrition"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-orange-500 transition-colors"
          >
            ดูทั้งหมด <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Mini ring */}
        <div className="relative shrink-0">
          <svg viewBox="0 0 80 80" className="w-16 h-16">
            <circle cx="40" cy="40" r={R} fill="none" stroke="#f1f5f9" strokeWidth={10} />
            <circle
              cx="40"
              cy="40"
              r={R}
              fill="none"
              stroke={overEaten ? "#ef4444" : planCfg.dot}
              strokeWidth={10}
              strokeDasharray={`${pct * C} ${C}`}
              strokeDashoffset={C / 4}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs font-bold text-slate-800 leading-none tabular-nums">
              {remaining}
            </span>
            <span className="text-[8px] text-slate-400">เหลือ</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-slate-400">เป้า</p>
            <p className="text-base font-bold text-slate-700 tabular-nums">{calorieTarget.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-orange-400">กิน</p>
            <p className="text-base font-bold text-orange-500 tabular-nums">{eaten.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] text-sky-400">เผา</p>
            <p className="text-base font-bold text-sky-500 tabular-nums">{burned.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
