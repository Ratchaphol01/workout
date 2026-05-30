"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Flame, Trophy, ChevronRight, Dumbbell, Activity, ChevronLeft } from "lucide-react";
import { genId, calcCalories } from "@/lib/utils";
import {
  calc1RM,
  getProgressionSuggestion,
  MUSCLE_GROUP_COLORS,
} from "@/lib/exercises";
import type { AnyExercise, MuscleGroup } from "@/lib/exercises";
import {
  ActiveSession,
  ActiveExercise,
  ActiveSet,
  SetType,
  PersonalRecord,
  Routine,
  SavedSet,
  WorkoutType,
} from "@/lib/types";
import ExercisePicker from "@/components/workout/ExercisePicker";
import SetRow from "@/components/workout/SetRow";
import RestTimer from "@/components/workout/RestTimer";
import PRAlert from "@/components/workout/PRAlert";

const SESSION_KEY = "wl_active_session";
const DEFAULT_REST = 90;

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // ignore — user may not have interacted with page yet
  }
}

type GhostMap = Record<string, SavedSet[]>;

export default function WorkoutPage() {
  const router = useRouter();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [restTimer, setRestTimer] = useState<{
    remaining: number;
    total: number;
  } | null>(null);
  const [newPR, setNewPR] = useState<{
    exerciseName: string;
    oneRM: number;
    prevOneRM?: number;
  } | null>(null);
  const [prs, setPrs] = useState<Record<string, PersonalRecord>>({});
  const [ghostData, setGhostData] = useState<GhostMap>({});
  const [customExercises, setCustomExercises] = useState<AnyExercise[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [saving, setSaving] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [workoutMode, setWorkoutMode] = useState<"weights" | "cardio" | null>(null);

  // Load initial data
  useEffect(() => {
    fetch("/api/prs")
      .then((r) => r.json())
      .then((d) => {
        if (!d.prs) return;
        const map: Record<string, PersonalRecord> = {};
        d.prs.forEach((pr: PersonalRecord) => {
          map[pr.exerciseId] = pr;
        });
        setPrs(map);
      })
      .catch(() => {});

    fetch("/api/exercises")
      .then((r) => r.json())
      .then((d) => {
        if (d.exercises) {
          setCustomExercises(
            d.exercises.filter((e: AnyExercise) => e.isCustom)
          );
        }
      })
      .catch(() => {});

    fetch("/api/routines")
      .then((r) => r.json())
      .then((d) => {
        if (d.routines) setRoutines(d.routines);
      })
      .catch(() => {});

    // Restore in-progress session
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) setSession(JSON.parse(saved));
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  // Elapsed timer
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      setElapsed(
        Math.round(
          (Date.now() - new Date(session.startedAt).getTime()) / 1000
        )
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [session?.startedAt]);

  // Rest timer countdown
  useEffect(() => {
    if (!restTimer) return;
    if (restTimer.remaining <= 0) {
      playBeep();
      setRestTimer(null);
      return;
    }
    const t = setTimeout(() => {
      setRestTimer((prev) =>
        prev ? { ...prev, remaining: prev.remaining - 1 } : null
      );
    }, 1000);
    return () => clearTimeout(t);
  }, [restTimer?.remaining]);

  // Persist session to localStorage
  useEffect(() => {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  }, [session]);

  function startEmpty() {
    setSession({ startedAt: new Date().toISOString(), exercises: [] });
  }

  function startFromRoutine(routine: Routine) {
    const exercises: ActiveExercise[] = routine.exercises.map((re) => ({
      id: genId(),
      exerciseId: re.exerciseId,
      exerciseName: re.exerciseName,
      muscleGroup: re.muscleGroup,
      sets: Array.from({ length: re.targetSets }, () => ({
        id: genId(),
        type: "working" as SetType,
        weight: 0,
        reps: re.targetReps,
        completed: false,
      })),
    }));
    setSession({ startedAt: new Date().toISOString(), exercises });
  }

  async function addExercise(exercise: AnyExercise) {
    const newEx: ActiveExercise = {
      id: genId(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets: [
        {
          id: genId(),
          type: "working",
          weight: 0,
          reps: 0,
          completed: false,
        },
      ],
    };

    // Pre-fill with last session data if available
    try {
      const r = await fetch(`/api/sessions/last/${exercise.id}`);
      if (r.ok) {
        const d = await r.json();
        if (d.sets?.length) {
          setGhostData((prev) => ({ ...prev, [exercise.id]: d.sets }));
        }
      }
    } catch {}

    setSession((prev) =>
      prev ? { ...prev, exercises: [...prev.exercises, newEx] } : prev
    );
    setShowPicker(false);
  }

  const updateSet = useCallback(
    (exerciseId: string, setId: string, updates: Partial<ActiveSet>) => {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          exercises: prev.exercises.map((ex) =>
            ex.id !== exerciseId
              ? ex
              : {
                  ...ex,
                  sets: ex.sets.map((s) =>
                    s.id !== setId ? s : { ...s, ...updates }
                  ),
                }
          ),
        };
      });
    },
    []
  );

  const completeSet = useCallback(
    async (exerciseId: string, setId: string) => {
      if (!session) return;
      const ex = session.exercises.find((e) => e.id === exerciseId);
      const set = ex?.sets.find((s) => s.id === setId);
      if (!set || !ex || set.completed) return;

      updateSet(exerciseId, setId, {
        completed: true,
        completedAt: new Date().toISOString(),
      });

      if (set.type !== "warm-up" && set.weight > 0 && set.reps > 0) {
        setRestTimer({ remaining: DEFAULT_REST, total: DEFAULT_REST });
      }

      if (set.weight > 0 && set.reps > 0) {
        const newOneRM = calc1RM(set.weight, set.reps);
        const currentPR = prs[ex.exerciseId];
        if (!currentPR || newOneRM > currentPR.oneRM) {
          setNewPR({
            exerciseName: ex.exerciseName,
            oneRM: newOneRM,
            prevOneRM: currentPR?.oneRM,
          });
          fetch("/api/prs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              exerciseId: ex.exerciseId,
              exerciseName: ex.exerciseName,
              weight: set.weight,
              reps: set.reps,
              oneRM: newOneRM,
            }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (d.pr) {
                setPrs((prev) => ({ ...prev, [ex.exerciseId]: d.pr }));
              }
            })
            .catch(() => {});
        }
      }
    },
    [session, prs, updateSet]
  );

  function addSet(exerciseId: string) {
    setSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((ex) =>
          ex.id !== exerciseId
            ? ex
            : {
                ...ex,
                sets: [
                  ...ex.sets,
                  {
                    id: genId(),
                    type: "working" as SetType,
                    weight: 0,
                    reps: 0,
                    completed: false,
                  },
                ],
              }
        ),
      };
    });
  }

  function removeSet(exerciseId: string, setId: string) {
    setSession((prev) => {
      if (!prev) return prev;
      const ex = prev.exercises.find((e) => e.id === exerciseId);
      if (!ex || ex.sets.length <= 1) return prev;
      return {
        ...prev,
        exercises: prev.exercises.map((e) =>
          e.id !== exerciseId
            ? e
            : { ...e, sets: e.sets.filter((s) => s.id !== setId) }
        ),
      };
    });
  }

  function removeExercise(exerciseId: string) {
    setSession((prev) =>
      prev
        ? {
            ...prev,
            exercises: prev.exercises.filter((e) => e.id !== exerciseId),
          }
        : prev
    );
  }

  async function finishWorkout() {
    if (!session) return;
    setSaving(true);

    const finishedAt = new Date().toISOString();
    const duration = Math.max(
      1,
      Math.round(
        (Date.now() - new Date(session.startedAt).getTime()) / 60000
      )
    );
    const totalVolume = Math.round(
      session.exercises
        .flatMap((ex) => ex.sets)
        .filter((s) => s.completed && s.weight > 0 && s.reps > 0)
        .reduce((sum, s) => sum + s.weight * s.reps, 0)
    );

    const exercises = session.exercises
      .map((ex) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        muscleGroup: ex.muscleGroup,
        notes: ex.notes,
        sets: ex.sets
          .filter((s) => s.completed)
          .map((s) => ({
            type: s.type,
            weight: s.weight,
            reps: s.reps,
            completedAt: s.completedAt,
          })),
      }))
      .filter((ex) => ex.sets.length > 0);

    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: session.startedAt.split("T")[0],
          startedAt: session.startedAt,
          finishedAt,
          duration,
          exercises,
          notes: session.notes,
          totalVolume,
        }),
      });
      localStorage.removeItem(SESSION_KEY);
      router.push("/history");
    } catch {
      setSaving(false);
    }
  }

  function fmtElapsed() {
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    if (h > 0)
      return `${h}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  // ─── Idle state ─────────────────────────────────────────────────────────────
  if (!session) {
    // Cardio mode
    if (workoutMode === "cardio") {
      return (
        <CardioQuickLog
          userWeightKg={undefined}
          onBack={() => setWorkoutMode(null)}
          onDone={() => router.push("/history")}
        />
      );
    }

    // Weight training mode
    if (workoutMode === "weights") {
      return (
        <div className="min-h-screen bg-slate-50 pb-24">
          <div className="max-w-xl mx-auto px-4 pt-6 space-y-5">
            {/* Back */}
            <button
              onClick={() => setWorkoutMode(null)}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 -ml-1"
            >
              <ChevronLeft size={18} />
              กลับ
            </button>

            {/* Start empty */}
            <div className="card p-6 text-center space-y-3">
              <div className="w-14 h-14 bg-violet-500 rounded-2xl flex items-center justify-center mx-auto">
                <Dumbbell size={26} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Weight Training</h2>
              <p className="text-sm text-slate-500">
                บันทึกทุก set แบบ real-time พร้อม Rest Timer และ PR Tracker
              </p>
              <button onClick={startEmpty} className="btn-primary px-8 py-3">
                เริ่ม Workout เปล่า
              </button>
            </div>

            {/* Routines */}
            {routines.length > 0 && (
              <div className="card p-5">
                <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
                  เริ่มจาก Routine
                </h2>
                <div className="space-y-2">
                  {routines.map((r) => (
                    <button
                      key={r._id}
                      onClick={() => startFromRoutine(r)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                        <Trophy size={16} className="text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm">{r.name}</p>
                        <p className="text-xs text-slate-400">{r.exercises.length} exercises</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Mode selector (default)
    return (
      <div className="min-h-screen bg-slate-50 pb-24">
        <div className="max-w-xl mx-auto px-4 pt-10 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Flame size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">เริ่ม Workout</h1>
            <p className="text-sm text-slate-500 mt-1">เลือกประเภทการออกกำลังกาย</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Weight Training card */}
            <button
              onClick={() => setWorkoutMode("weights")}
              className="card p-6 flex flex-col items-center gap-3 hover:shadow-md hover:border-violet-200 active:scale-95 transition-all text-center"
            >
              <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center">
                <Dumbbell size={28} className="text-violet-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800">เวทเทรนนิง</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                  ติดตาม set · Rest Timer · PR
                </p>
              </div>
            </button>

            {/* Cardio card */}
            <button
              onClick={() => setWorkoutMode("cardio")}
              className="card p-6 flex flex-col items-center gap-3 hover:shadow-md hover:border-emerald-200 active:scale-95 transition-all text-center"
            >
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <Activity size={28} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-slate-800">คาร์ดิโอ</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                  วิ่ง · ปั่น · ว่ายน้ำ · HIIT
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Active workout ──────────────────────────────────────────────────────────
  const completedSets = session.exercises
    .flatMap((ex) => ex.sets)
    .filter((s) => s.completed).length;
  const totalSets = session.exercises.flatMap((ex) => ex.sets).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-slate-400 font-medium">กำลัง Workout</p>
            <p className="text-xl font-bold text-slate-800 tabular-nums leading-tight">
              {fmtElapsed()}
            </p>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg font-medium">
            {completedSets}/{totalSets} sets
          </span>
          <button
            onClick={() => setShowFinishConfirm(true)}
            className="btn-primary px-4 py-2 text-sm"
          >
            จบ
          </button>
        </div>
      </div>

      <main className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {session.exercises.map((ex) => {
          const ghost = ghostData[ex.exerciseId] ?? [];
          const pr = prs[ex.exerciseId];
          const completedWorking = ex.sets.filter(
            (s) => s.completed && s.type === "working" && s.weight > 0 && s.reps > 0
          );
          const lastWorking =
            completedWorking[completedWorking.length - 1];
          const suggestion =
            ghost.length > 0 && ghost[0].weight
              ? getProgressionSuggestion(
                  ghost[0].weight,
                  ghost[0].reps,
                  ghost[0].reps
                )
              : null;

          return (
            <div key={ex.id} className="card p-4">
              {/* Exercise header */}
              <div className="flex items-start gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-800">{ex.exerciseName}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        MUSCLE_GROUP_COLORS[ex.muscleGroup as MuscleGroup] ??
                        "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ex.muscleGroup}
                    </span>
                  </div>
                  {pr && (
                    <p className="text-xs text-violet-500 mt-0.5">
                      PR: {pr.weight}kg × {pr.reps} reps = {pr.oneRM} kg 1RM
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeExercise(ex.id)}
                  className="text-slate-300 hover:text-red-400 p-1 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Ghost data hint */}
              {ghost.length > 0 && (
                <div className="mb-2 px-2 py-1.5 bg-slate-50 rounded-lg">
                  <p className="text-[11px] text-slate-400">
                    ครั้งก่อน:{" "}
                    {ghost
                      .filter((s) => s.type !== "warm-up")
                      .slice(0, 4)
                      .map((s) => `${s.weight}×${s.reps}`)
                      .join("  ")}
                  </p>
                </div>
              )}

              {/* Progression suggestion */}
              {suggestion && (
                <div className="mb-2 px-2 py-1.5 bg-sky-50 rounded-lg">
                  <p className="text-[11px] text-sky-600">
                    💡 {suggestion.note} →{" "}
                    <span className="font-semibold">
                      {suggestion.weight}kg × {suggestion.reps} reps
                    </span>
                  </p>
                </div>
              )}

              {/* Sets column header */}
              <div className="grid grid-cols-[24px_34px_1fr_1fr_50px_34px_30px] gap-1.5 px-2 mb-1">
                <span className="text-[10px] text-slate-400 text-center">#</span>
                <span className="text-[10px] text-slate-400 text-center">Type</span>
                <span className="text-[10px] text-slate-400 text-center">kg</span>
                <span className="text-[10px] text-slate-400 text-center">Reps</span>
                <span className="text-[10px] text-slate-400 text-center">1RM</span>
                <span />
                <span />
              </div>

              {/* Set rows */}
              <div className="space-y-0.5">
                {ex.sets.map((set, si) => (
                  <SetRow
                    key={set.id}
                    index={si}
                    set={set}
                    ghostWeight={ghost[si]?.weight}
                    ghostReps={ghost[si]?.reps}
                    onChange={(updates) => updateSet(ex.id, set.id, updates)}
                    onComplete={() => completeSet(ex.id, set.id)}
                    onRemove={() => removeSet(ex.id, set.id)}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => addSet(ex.id)}
                className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 px-2 py-1 transition-colors"
              >
                <Plus size={13} />
                เพิ่มเซ็ต
              </button>
            </div>
          );
        })}

        {/* Add exercise button */}
        <button
          onClick={() => setShowPicker(true)}
          className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-violet-300 hover:text-violet-500 transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          เพิ่มท่าออกกำลังกาย
        </button>
      </main>

      {/* ─── Overlays ─────────────────────────────────────────────────────────── */}

      {showPicker && (
        <ExercisePicker
          customExercises={customExercises}
          onSelect={addExercise}
          onClose={() => setShowPicker(false)}
        />
      )}

      {restTimer && (
        <RestTimer
          remaining={restTimer.remaining}
          total={restTimer.total}
          onSkip={() => setRestTimer(null)}
          onAdd60={() =>
            setRestTimer((prev) =>
              prev
                ? {
                    remaining: prev.remaining + 60,
                    total: prev.total + 60,
                  }
                : null
            )
          }
        />
      )}

      {newPR && (
        <PRAlert
          exerciseName={newPR.exerciseName}
          oneRM={newPR.oneRM}
          prevOneRM={newPR.prevOneRM}
          onClose={() => setNewPR(null)}
        />
      )}

      {/* Finish confirmation */}
      {showFinishConfirm && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) =>
            e.target === e.currentTarget && setShowFinishConfirm(false)
          }
        >
          <div className="card p-6 max-w-xs w-full">
            <h3 className="font-bold text-slate-800 mb-1">จบ Workout?</h3>
            <p className="text-sm text-slate-500 mb-4">
              {completedSets} sets completed ·{" "}
              {session.exercises.filter((ex) =>
                ex.sets.some((s) => s.completed)
              ).length}{" "}
              exercises
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFinishConfirm(false)}
                className="btn-ghost flex-1 text-sm"
              >
                ยกเลิก
              </button>
              <button
                onClick={finishWorkout}
                disabled={saving}
                className="btn-primary flex-1 text-sm"
              >
                {saving ? "กำลังบันทึก..." : "จบและบันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Cardio Quick Log ────────────────────────────────────────────────────────

const CARDIO_TYPES: { type: WorkoutType; label: string; emoji: string; color: string }[] = [
  { type: "Running",  label: "วิ่ง",      emoji: "🏃", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { type: "Cycling",  label: "ปั่นจักรยาน", emoji: "🚴", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { type: "Swimming", label: "ว่ายน้ำ",   emoji: "🏊", color: "bg-sky-100 text-sky-700 border-sky-200" },
  { type: "HIIT",     label: "HIIT",      emoji: "⚡", color: "bg-red-100 text-red-700 border-red-200" },
  { type: "Yoga",     label: "โยคะ",      emoji: "🧘", color: "bg-pink-100 text-pink-700 border-pink-200" },
  { type: "Other",    label: "อื่นๆ",     emoji: "🎯", color: "bg-slate-100 text-slate-600 border-slate-200" },
];

function CardioQuickLog({
  userWeightKg,
  onBack,
  onDone,
}: {
  userWeightKg?: number;
  onBack: () => void;
  onDone: () => void;
}) {
  const [type, setType] = useState<WorkoutType>("Running");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [pace, setPace] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const showDistance = type === "Running" || type === "Cycling";
  const dur = Number(duration);
  const calories = dur > 0 ? calcCalories(type, dur, userWeightKg ?? 70) : 0;

  async function handleSave() {
    if (!dur || dur <= 0) return;
    setSaving(true);
    try {
      const entry = {
        id: genId(),
        date: new Date().toISOString().split("T")[0],
        type,
        duration: dur,
        calories,
        notes: notes.trim() || undefined,
        details: showDistance
          ? { distance: Number(distance) || 0, pace: pace.trim() }
          : undefined,
      };
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(onDone, 1200);
      }
    } finally {
      setSaving(false);
    }
  }

  const selected = CARDIO_TYPES.find((c) => c.type === type)!;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-xl mx-auto px-4 pt-6 space-y-5">
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 -ml-1"
        >
          <ChevronLeft size={18} />
          กลับ
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl">
            {selected.emoji}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">คาร์ดิโอ</h1>
            <p className="text-xs text-slate-400">บันทึกการออกกำลังกายแบบ cardio</p>
          </div>
        </div>

        {/* Type selector */}
        <div className="grid grid-cols-3 gap-2">
          {CARDIO_TYPES.map((c) => (
            <button
              key={c.type}
              onClick={() => setType(c.type)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all ${
                type === c.type
                  ? c.color + " border-current shadow-sm"
                  : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
              }`}
            >
              <span className="text-xl">{c.emoji}</span>
              <span className="text-xs font-semibold">{c.label}</span>
            </button>
          ))}
        </div>

        <div className="card p-5 space-y-4">
          {/* Duration */}
          <div>
            <label className="label">ระยะเวลา (นาที)</label>
            <input
              type="number"
              className="input text-lg font-bold"
              placeholder="30"
              min={1}
              max={600}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          {/* Calorie preview */}
          {dur > 0 && (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5">
              <span className="text-sm text-emerald-700 font-medium">ประมาณแคลอรี</span>
              <span className="text-lg font-bold text-emerald-700">{calories} kcal</span>
            </div>
          )}

          {/* Distance + Pace */}
          {showDistance && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">ระยะทาง (km)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="5.0"
                  min={0}
                  step={0.1}
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Pace (min/km)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="5:30"
                  value={pace}
                  onChange={(e) => setPace(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="label">หมายเหตุ (ไม่บังคับ)</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="เพิ่มโน้ต..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving || !dur || saved}
            className={`btn-primary w-full py-3 text-base transition-colors ${
              saved ? "!bg-emerald-500" : ""
            }`}
          >
            {saved ? "✓ บันทึกสำเร็จ!" : saving ? "กำลังบันทึก..." : "บันทึก Cardio"}
          </button>
        </div>
      </div>
    </div>
  );
}
