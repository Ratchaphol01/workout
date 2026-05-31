"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Trophy, TrendingUp, Dumbbell, Scale } from "lucide-react";
import { PersonalRecord, WorkoutSession } from "@/lib/types";
import VolumeChart, { WeekVolume } from "@/components/progress/VolumeChart";
import WeightTrendChart from "@/components/WeightTrendChart";

function getLastNWeeks(n: number): WeekVolume[] {
  const weeks: WeekVolume[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(now.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    const label = `W${n - i}`;
    weeks.push({ label, volumes: {}, _start: start.toISOString().split("T")[0], _end: end.toISOString().split("T")[0] } as any);
  }
  return weeks;
}

export default function ProgressPage() {
  const router = useRouter();
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [weightLogs, setWeightLogs] = useState<{ _id: string; date: string; weightKg: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/prs").then((r) => { if (!r.ok) throw new Error("auth"); return r.json(); }),
      fetch("/api/sessions?limit=100").then((r) => r.json()),
      fetch("/api/weight?limit=60").then((r) => r.ok ? r.json() : { logs: [] }),
    ])
      .then(([prData, sessionData, weightData]) => {
        if (prData.prs) setPrs(prData.prs);
        if (sessionData.sessions) setSessions(sessionData.sessions);
        if (weightData.logs) setWeightLogs(weightData.logs);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  // Build volume chart data (last 8 weeks)
  const volumeData = useMemo<WeekVolume[]>(() => {
    const weeks = getLastNWeeks(8);
    sessions.forEach((s) => {
      const weekIdx = weeks.findIndex(
        (w: any) => s.date >= w._start && s.date <= w._end
      );
      if (weekIdx === -1) return;
      s.exercises.forEach((ex) => {
        const vol = ex.sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
        if (vol > 0) {
          weeks[weekIdx].volumes[ex.muscleGroup] =
            (weeks[weekIdx].volumes[ex.muscleGroup] ?? 0) + vol;
        }
      });
    });
    return weeks;
  }, [sessions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pb-20">
        <p className="text-sm text-slate-400">กำลังโหลด...</p>
      </div>
    );
  }

  const totalVolume = sessions.reduce((s, sess) => s + (sess.totalVolume ?? 0), 0);
  const totalSessions = sessions.length;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        <h1 className="text-xl font-bold text-slate-800">Progress</h1>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Sessions</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{totalSessions}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Volume</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {totalVolume >= 1000
                ? `${(totalVolume / 1000).toFixed(1)}t`
                : `${totalVolume.toLocaleString()} kg`}
            </p>
          </div>
        </div>

        {/* Volume chart */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={17} className="text-sky-500" />
            <h2 className="font-semibold text-slate-700">Volume by Muscle (8 Weeks)</h2>
          </div>
          <VolumeChart data={volumeData} />
        </div>

        {/* Weight trend chart */}
        {weightLogs.length >= 2 && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Scale size={17} className="text-violet-500" />
                <h2 className="font-semibold text-slate-700">น้ำหนักย้อนหลัง</h2>
              </div>
              {(() => {
                const recent7 = weightLogs.slice(0, 7);
                const avg = recent7.reduce((s, l) => s + l.weightKg, 0) / recent7.length;
                return (
                  <span className="text-xs text-slate-400">
                    เฉลี่ย 7 วัน: <span className="font-semibold text-violet-600">{avg.toFixed(1)} kg</span>
                  </span>
                );
              })()}
            </div>
            <WeightTrendChart logs={weightLogs} days={28} />
            {/* Weekly summary table */}
            {weightLogs.length >= 7 && (
              <div className="mt-4 space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">สรุปรายสัปดาห์</p>
                {Array.from({ length: Math.ceil(Math.min(weightLogs.length, 28) / 7) }, (_, wi) => {
                  const weekLogs = weightLogs.slice(wi * 7, wi * 7 + 7);
                  if (weekLogs.length === 0) return null;
                  const avg = weekLogs.reduce((s, l) => s + l.weightKg, 0) / weekLogs.length;
                  const prevWeek = weightLogs.slice((wi + 1) * 7, (wi + 1) * 7 + 7);
                  const prevAvg = prevWeek.length > 0
                    ? prevWeek.reduce((s, l) => s + l.weightKg, 0) / prevWeek.length
                    : null;
                  const diff = prevAvg != null ? avg - prevAvg : null;
                  const weekLabel = wi === 0 ? "สัปดาห์นี้" : wi === 1 ? "สัปดาห์ที่แล้ว" : `${wi + 1} สัปดาห์ก่อน`;
                  return (
                    <div key={wi} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50">
                      <span className="text-sm text-slate-600">{weekLabel}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-violet-600 tabular-nums">{avg.toFixed(1)} kg</span>
                        {diff !== null && (
                          <span className={`text-xs font-semibold tabular-nums ${diff < 0 ? "text-emerald-500" : diff > 0 ? "text-orange-500" : "text-slate-400"}`}>
                            {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)} kg
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Personal Records */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={17} className="text-amber-500" />
            <h2 className="font-semibold text-slate-700">Personal Records</h2>
          </div>

          {prs.length === 0 ? (
            <div className="text-center py-6">
              <Dumbbell size={28} className="text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">
                ยังไม่มี PR — เริ่ม workout และทำให้สุดแรง!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {[...prs]
                .sort((a, b) => b.oneRM - a.oneRM)
                .map((pr) => (
                  <div
                    key={pr._id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50"
                  >
                    <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                      <Trophy size={14} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {pr.exerciseName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {pr.weight} kg × {pr.reps} reps
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-violet-600">
                        {pr.oneRM} kg
                      </p>
                      <p className="text-[10px] text-slate-400">1RM</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
