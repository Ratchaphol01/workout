"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Trophy, TrendingUp, Dumbbell } from "lucide-react";
import { PersonalRecord, WorkoutSession } from "@/lib/types";
import VolumeChart, { WeekVolume } from "@/components/progress/VolumeChart";
import { MUSCLE_GROUP_COLORS } from "@/lib/exercises";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/prs").then((r) => {
        if (!r.ok) throw new Error("auth");
        return r.json();
      }),
      fetch("/api/sessions?limit=100").then((r) => r.json()),
    ])
      .then(([prData, sessionData]) => {
        if (prData.prs) setPrs(prData.prs);
        if (sessionData.sessions) setSessions(sessionData.sessions);
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

  // Group PRs by muscle group
  const prsByMuscle = useMemo(() => {
    const groups: Record<string, PersonalRecord[]> = {};
    prs.forEach((pr) => {
      // Try to find muscle group from exerciseId prefix or just group by name
      const key = "All";
      if (!groups[key]) groups[key] = [];
      groups[key].push(pr);
    });
    return groups;
  }, [prs]);

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
