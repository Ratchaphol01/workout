"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Flame, UtensilsCrossed, Scale, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { localDate } from "@/lib/utils";

interface WeekStats {
  activeDays: number;           // unique dates with any workout
  burnedCal: number;            // total kcal burned from workouts
  avgFoodCal: number | null;    // avg kcal/day (only days with food logged)
  foodDays: number;             // days food was logged
  weightChange: number | null;  // kg change (latest - earliest this week)
  startWeight: number | null;
  endWeight: number | null;
  totalVolume: number;          // kg volume from strength sessions
}

function getWeekRange(): { start: string; end: string; label: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  return {
    start: localDate(monday),
    end: localDate(sunday),
    label: `${fmt(monday)} – ${fmt(sunday)}`,
  };
}

export default function WeeklySummary() {
  const [stats, setStats] = useState<WeekStats | null>(null);
  const { start, end, label } = getWeekRange();

  useEffect(() => {
    Promise.all([
      fetch("/api/workouts").then((r) => r.ok ? r.json() : { workouts: [] }),
      fetch("/api/sessions?limit=50").then((r) => r.ok ? r.json() : { sessions: [] }),
      fetch(`/api/food?start=${start}&end=${end}`).then((r) => r.ok ? r.json() : { entries: [] }),
      fetch("/api/weight?limit=14").then((r) => r.ok ? r.json() : { logs: [] }),
    ]).then(([workoutData, sessionData, foodData, weightData]) => {
      // Active days (unique dates in the week)
      const activeDates = new Set<string>();
      let burnedCal = 0;
      let totalVolume = 0;

      for (const w of workoutData.workouts ?? []) {
        if (w.date >= start && w.date <= end) {
          activeDates.add(w.date);
          burnedCal += w.calories ?? 0;
        }
      }
      for (const s of sessionData.sessions ?? []) {
        if (s.date >= start && s.date <= end) {
          activeDates.add(s.date);
          burnedCal += s.totalCalories ?? 0;
          totalVolume += s.totalVolume ?? 0;
        }
      }

      // Food: group by date, sum calories
      const foodByDate: Record<string, number> = {};
      for (const e of foodData.entries ?? []) {
        if (e.date >= start && e.date <= end) {
          foodByDate[e.date] = (foodByDate[e.date] ?? 0) + (e.calories ?? 0);
        }
      }
      const foodDays = Object.keys(foodByDate).length;
      const avgFoodCal = foodDays > 0
        ? Math.round(Object.values(foodByDate).reduce((a, b) => a + b, 0) / foodDays)
        : null;

      // Weight change this week
      const weekLogs = (weightData.logs ?? [])
        .filter((l: { date: string }) => l.date >= start && l.date <= end)
        .sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date));
      const startWeight = weekLogs.length > 0 ? weekLogs[0].weightKg : null;
      const endWeight = weekLogs.length > 1 ? weekLogs[weekLogs.length - 1].weightKg : null;
      const weightChange = startWeight && endWeight ? +(endWeight - startWeight).toFixed(1) : null;

      setStats({
        activeDays: activeDates.size,
        burnedCal: Math.round(burnedCal),
        avgFoodCal,
        foodDays,
        weightChange,
        startWeight,
        endWeight,
        totalVolume: Math.round(totalVolume),
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!stats) return null;
  if (stats.activeDays === 0 && stats.avgFoodCal === null && stats.weightChange === null) return null;

  const wChange = stats.weightChange;
  const WIcon = wChange === null ? null : wChange < 0 ? TrendingDown : wChange > 0 ? TrendingUp : Minus;
  const wColor = wChange === null ? "" : wChange < 0 ? "text-emerald-500" : wChange > 0 ? "text-orange-500" : "text-slate-400";

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-violet-500" />
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
            สรุปสัปดาห์นี้
          </h2>
        </div>
        <span className="text-xs text-slate-400">{label}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Active days */}
        <div className="bg-violet-50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-violet-600 tabular-nums">{stats.activeDays}</p>
          <p className="text-[11px] text-violet-500 font-medium mt-0.5">วันออกกำลัง</p>
          <p className="text-[10px] text-slate-400">จาก 7 วัน</p>
        </div>

        {/* Burned */}
        <div className="bg-orange-50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-bold text-orange-500 tabular-nums">
            {stats.burnedCal >= 1000
              ? `${(stats.burnedCal / 1000).toFixed(1)}k`
              : stats.burnedCal}
          </p>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <Flame size={10} className="text-orange-400" />
            <p className="text-[11px] text-orange-500 font-medium">เผาผลาญ</p>
          </div>
          <p className="text-[10px] text-slate-400">kcal รวม</p>
        </div>

        {/* Avg food */}
        <div className="bg-sky-50 rounded-2xl p-3 text-center">
          {stats.avgFoodCal !== null ? (
            <>
              <p className="text-2xl font-bold text-sky-600 tabular-nums">{stats.avgFoodCal.toLocaleString()}</p>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <UtensilsCrossed size={10} className="text-sky-400" />
                <p className="text-[11px] text-sky-500 font-medium">เฉลี่ย/วัน</p>
              </div>
              <p className="text-[10px] text-slate-400">{stats.foodDays} วันที่บันทึก</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-slate-200">—</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">ยังไม่บันทึก</p>
              <p className="text-[10px] text-slate-300">อาหาร</p>
            </>
          )}
        </div>

        {/* Weight change */}
        <div className="bg-slate-50 rounded-2xl p-3 text-center">
          {wChange !== null ? (
            <>
              <div className="flex items-center justify-center gap-1">
                {WIcon && <WIcon size={14} className={wColor} />}
                <p className={`text-2xl font-bold tabular-nums ${wColor}`}>
                  {wChange > 0 ? `+${wChange}` : wChange === 0 ? "0" : wChange}
                </p>
              </div>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <Scale size={10} className="text-slate-400" />
                <p className="text-[11px] text-slate-500 font-medium">น้ำหนัก</p>
              </div>
              <p className="text-[10px] text-slate-400">kg สัปดาห์นี้</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-slate-200">—</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">ยังไม่มีข้อมูล</p>
              <p className="text-[10px] text-slate-300">น้ำหนัก</p>
            </>
          )}
        </div>
      </div>

      {/* Volume highlight */}
      {stats.totalVolume > 0 && (
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-violet-500 bg-violet-50 rounded-xl px-3 py-1.5">
          <TrendingUp size={12} />
          <span className="font-semibold">
            Volume รวม {stats.totalVolume >= 1000
              ? `${(stats.totalVolume / 1000).toFixed(1)}t`
              : `${stats.totalVolume.toLocaleString()} kg`}
          </span>
          <span className="text-violet-400">จากเวทสัปดาห์นี้</span>
        </div>
      )}
    </div>
  );
}
