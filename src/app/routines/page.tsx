"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  BookMarked,
} from "lucide-react";
import { Routine, RoutineExercise } from "@/lib/types";
import {
  DEFAULT_EXERCISES,
  MUSCLE_GROUPS,
  MUSCLE_GROUP_COLORS,
} from "@/lib/exercises";
import type { MuscleGroup } from "@/lib/exercises";

export default function RoutinesPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch("/api/routines")
      .then((r) => {
        if (!r.ok) { router.push("/login"); return null; }
        return r.json();
      })
      .then((d) => {
        if (d?.routines) setRoutines(d.routines);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  async function deleteRoutine(id: string) {
    const res = await fetch(`/api/routines/${id}`, { method: "DELETE" });
    if (res.ok) setRoutines((prev) => prev.filter((r) => r._id !== id));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pb-20">
        <p className="text-sm text-slate-400">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <BookMarked size={20} className="text-violet-500" />
          <h1 className="text-xl font-bold text-slate-800">Routines</h1>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 hover:border-violet-300 hover:text-violet-600 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          สร้าง Routine ใหม่
        </button>

        {routines.length === 0 && !showCreate && (
          <div className="text-center py-10">
            <BookMarked size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">ยังไม่มี Routine</p>
          </div>
        )}

        <div className="space-y-3">
          {routines.map((r) => (
            <RoutineCard
              key={r._id}
              routine={r}
              onDelete={() => r._id && deleteRoutine(r._id)}
              onStart={() => router.push("/workout")}
            />
          ))}
        </div>
      </div>

      {showCreate && (
        <CreateRoutineModal
          onClose={() => setShowCreate(false)}
          onCreated={(r) => {
            setRoutines((prev) => [r, ...prev]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

function RoutineCard({
  routine,
  onDelete,
  onStart,
}: {
  routine: Routine;
  onDelete: () => void;
  onStart: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button
        className="w-full text-left px-4 py-4 flex items-center gap-3"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
          <BookMarked size={18} className="text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800">{routine.name}</p>
          <p className="text-xs text-slate-400">
            {routine.exercises.length} exercises
          </p>
        </div>
        {expanded ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-50 px-4 pb-4 pt-3 space-y-3">
          <div className="space-y-1.5">
            {routine.exercises.map((ex, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    MUSCLE_GROUP_COLORS[ex.muscleGroup as MuscleGroup] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {ex.muscleGroup}
                </span>
                <span className="text-sm text-slate-700">{ex.exerciseName}</span>
                <span className="text-xs text-slate-400 ml-auto">
                  {ex.targetSets}×{ex.targetReps}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={onStart}
              className="btn-primary flex-1 text-sm py-2"
            >
              เริ่ม Workout
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateRoutineModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (r: Routine) => void;
}) {
  const [name, setName] = useState("");
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | "All">("All");
  const [saving, setSaving] = useState(false);

  const filtered = DEFAULT_EXERCISES.filter(
    (e) => muscleFilter === "All" || e.muscleGroup === muscleFilter
  );

  function toggleExercise(ex: (typeof DEFAULT_EXERCISES)[0]) {
    setExercises((prev) => {
      const existing = prev.findIndex((e) => e.exerciseId === ex.id);
      if (existing !== -1) return prev.filter((_, i) => i !== existing);
      return [
        ...prev,
        {
          exerciseId: ex.id,
          exerciseName: ex.name,
          muscleGroup: ex.muscleGroup,
          targetSets: 3,
          targetReps: 10,
        },
      ];
    });
  }

  function updateSetsReps(
    exerciseId: string,
    field: "targetSets" | "targetReps",
    val: number
  ) {
    setExercises((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId ? { ...e, [field]: val } : e
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || exercises.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, exercises }),
      });
      if (res.ok) {
        const d = await res.json();
        onCreated(d.routine);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white flex-1 flex flex-col overflow-hidden mt-8 rounded-t-3xl sm:m-4 sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-slate-100">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={20} />
          </button>
          <h2 className="text-base font-bold text-slate-800 flex-1">
            สร้าง Routine ใหม่
          </h2>
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim() || exercises.length === 0}
            className="btn-primary text-sm px-4 py-1.5 disabled:opacity-50"
          >
            {saving ? "..." : "บันทึก"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4 pt-4">
          {/* Name */}
          <div>
            <label className="label">ชื่อ Routine</label>
            <input
              type="text"
              className="input"
              placeholder="เช่น Push Day, Leg Day..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Selected exercises */}
          {exercises.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                เลือกแล้ว ({exercises.length})
              </p>
              {exercises.map((ex) => (
                <div
                  key={ex.exerciseId}
                  className="flex items-center gap-2 bg-violet-50 rounded-xl px-3 py-2"
                >
                  <span className="text-sm font-medium text-violet-800 flex-1 truncate">
                    {ex.exerciseName}
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      className="w-10 text-center text-sm bg-white border border-violet-200 rounded-lg py-1"
                      value={ex.targetSets}
                      min={1}
                      max={10}
                      onChange={(e) =>
                        updateSetsReps(
                          ex.exerciseId,
                          "targetSets",
                          Number(e.target.value)
                        )
                      }
                    />
                    <span className="text-xs text-violet-500">×</span>
                    <input
                      type="number"
                      className="w-10 text-center text-sm bg-white border border-violet-200 rounded-lg py-1"
                      value={ex.targetReps}
                      min={1}
                      max={100}
                      onChange={(e) =>
                        updateSetsReps(
                          ex.exerciseId,
                          "targetReps",
                          Number(e.target.value)
                        )
                      }
                    />
                  </div>
                  <button
                    onClick={() => toggleExercise({ id: ex.exerciseId } as any)}
                    className="text-violet-400 hover:text-red-400 p-0.5"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Muscle group filter */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {(["All", ...MUSCLE_GROUPS] as (MuscleGroup | "All")[]).map((g) => (
              <button
                key={g}
                onClick={() => setMuscleFilter(g)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  muscleFilter === g
                    ? "bg-sky-500 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Exercise picker */}
          <div className="space-y-1">
            {filtered.map((ex) => {
              const selected = exercises.some((e) => e.exerciseId === ex.id);
              return (
                <button
                  key={ex.id}
                  onClick={() => toggleExercise(ex)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${
                    selected ? "bg-violet-50" : "hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      selected
                        ? "border-violet-500 bg-violet-500"
                        : "border-slate-300"
                    }`}
                  >
                    {selected && (
                      <svg
                        viewBox="0 0 10 8"
                        fill="none"
                        className="w-3 h-3"
                      >
                        <path
                          d="M1 4l3 3 5-6"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-slate-700 flex-1 truncate">
                    {ex.name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      MUSCLE_GROUP_COLORS[ex.muscleGroup]
                    }`}
                  >
                    {ex.muscleGroup}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
