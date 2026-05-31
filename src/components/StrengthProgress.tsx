"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus, Dumbbell } from "lucide-react";
import { calc1RM } from "@/lib/exercises";
import type { WorkoutSession, SavedSet } from "@/lib/types";

interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  current: { date: string; maxWeight: number; bestReps: number; oneRM: number };
  previous: { date: string; maxWeight: number } | null;
  trend: number; // kg difference vs previous session
}

function bestSet(sets: SavedSet[]): { weight: number; reps: number } | null {
  const working = sets.filter((s) => s.type !== "warm-up" && s.weight > 0 && s.reps > 0);
  if (!working.length) return null;
  return working.reduce(
    (best, s) =>
      calc1RM(s.weight, s.reps) > calc1RM(best.weight, best.reps) ? s : best,
    working[0]
  );
}

export default function StrengthProgress() {
  const [data, setData] = useState<ExerciseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions?limit=30")
      .then((r) => (r.ok ? r.json() : { sessions: [] }))
      .then((d: { sessions: WorkoutSession[] }) => {
        const sessions: WorkoutSession[] = d.sessions ?? [];

        // Build per-exercise history: exerciseId → [{date, maxWeight, bestReps}]
        const byExercise: Record<
          string,
          {
            name: string;
            muscleGroup: string;
            history: { date: string; maxWeight: number; bestReps: number }[];
          }
        > = {};

        // Sessions come sorted newest-first from the API
        sessions.forEach((session) => {
          session.exercises.forEach((ex) => {
            const best = bestSet(ex.sets);
            if (!best) return;
            if (!byExercise[ex.exerciseId]) {
              byExercise[ex.exerciseId] = {
                name: ex.exerciseName,
                muscleGroup: ex.muscleGroup,
                history: [],
              };
            }
            byExercise[ex.exerciseId].history.push({
              date: session.date,
              maxWeight: best.weight,
              bestReps: best.reps,
            });
          });
        });

        const result: ExerciseProgress[] = Object.entries(byExercise)
          .map(([id, info]) => {
            const [curr, prev] = info.history;
            const oneRM = calc1RM(curr.maxWeight, curr.bestReps);
            return {
              exerciseId: id,
              exerciseName: info.name,
              muscleGroup: info.muscleGroup,
              current: {
                date: curr.date,
                maxWeight: curr.maxWeight,
                bestReps: curr.bestReps,
                oneRM,
              },
              previous: prev
                ? { date: prev.date, maxWeight: prev.maxWeight }
                : null,
              trend: prev ? curr.maxWeight - prev.maxWeight : 0,
            };
          })
          // Sort: improved first, then unchanged, then decreased
          .sort((a, b) => b.trend - a.trend)
          .slice(0, 6);

        setData(result);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (data.length === 0) return null;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Dumbbell size={17} className="text-violet-500" />
        <h2 className="font-semibold text-slate-700">Strength Progress</h2>
      </div>

      <div className="space-y-1">
        {data.map((ex) => {
          const isUp = ex.trend > 0;
          const isDown = ex.trend < 0;
          return (
            <div
              key={ex.exerciseId}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              {/* Trend icon */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isUp
                    ? "bg-emerald-100"
                    : isDown
                    ? "bg-red-100"
                    : "bg-slate-100"
                }`}
              >
                {isUp ? (
                  <TrendingUp size={15} className="text-emerald-600" />
                ) : isDown ? (
                  <TrendingDown size={15} className="text-red-500" />
                ) : (
                  <Minus size={15} className="text-slate-400" />
                )}
              </div>

              {/* Exercise name + muscle */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {ex.exerciseName}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {ex.current.maxWeight} kg × {ex.current.bestReps} reps
                  {ex.previous && (
                    <span
                      className={`ml-1.5 font-medium ${
                        isUp
                          ? "text-emerald-600"
                          : isDown
                          ? "text-red-500"
                          : "text-slate-400"
                      }`}
                    >
                      {isUp ? `↑ +${ex.trend}` : isDown ? `↓ ${ex.trend}` : "= "}
                      {ex.trend !== 0 ? " kg" : "เท่าเดิม"}
                    </span>
                  )}
                </p>
              </div>

              {/* Est. 1RM */}
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-violet-600">
                  {ex.current.oneRM}
                </p>
                <p className="text-[10px] text-slate-400">1RM kg</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
