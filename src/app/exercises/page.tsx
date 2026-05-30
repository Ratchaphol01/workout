"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, X, BookOpen } from "lucide-react";
import {
  DEFAULT_EXERCISES,
  MUSCLE_GROUPS,
  MUSCLE_GROUP_COLORS,
} from "@/lib/exercises";
import type { AnyExercise, MuscleGroup, Equipment } from "@/lib/exercises";

const EQUIPMENT_LIST: Equipment[] = [
  "barbell", "dumbbell", "cable", "machine", "bodyweight", "other",
];

export default function ExercisesPage() {
  const router = useRouter();
  const [customExercises, setCustomExercises] = useState<AnyExercise[]>([]);
  const [search, setSearch] = useState("");
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | "All">("All");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch("/api/exercises")
      .then((r) => {
        if (!r.ok) { router.push("/login"); return null; }
        return r.json();
      })
      .then((d) => {
        if (d?.exercises) {
          setCustomExercises(d.exercises.filter((e: AnyExercise) => e.isCustom));
        }
      })
      .catch(() => {});
  }, [router]);

  const allExercises = useMemo(
    () => [...DEFAULT_EXERCISES, ...customExercises],
    [customExercises]
  );

  const filtered = useMemo(() => {
    let list = allExercises;
    if (muscleFilter !== "All")
      list = list.filter((e) => e.muscleGroup === muscleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }
    return list;
  }, [allExercises, muscleFilter, search]);

  async function deleteCustom(id: string) {
    await fetch(`/api/exercises/${id}`, { method: "DELETE" });
    setCustomExercises((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3">
          <BookOpen size={20} className="text-sky-500" />
          <h1 className="text-xl font-bold text-slate-800">Exercise Library</h1>
          <span className="ml-auto text-xs text-slate-400">
            {filtered.length} exercises
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            className="input pl-9"
            placeholder="ค้นหาท่า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Muscle group filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {(["All", ...MUSCLE_GROUPS] as (MuscleGroup | "All")[]).map((g) => (
            <button
              key={g}
              onClick={() => setMuscleFilter(g)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                muscleFilter === g
                  ? "bg-sky-500 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Create custom */}
        <button
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 hover:border-sky-300 hover:text-sky-600 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          สร้าง Exercise ใหม่
        </button>

        {/* List */}
        <div className="space-y-1">
          {filtered.map((ex) => (
            <div
              key={ex.id}
              className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 border border-slate-100"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {ex.name}
                  </p>
                  {ex.isCustom && (
                    <span className="text-[10px] text-violet-500 font-medium shrink-0">
                      custom
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 capitalize">
                  {ex.equipment} · {ex.category}
                </p>
              </div>
              <span
                className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                  MUSCLE_GROUP_COLORS[ex.muscleGroup]
                }`}
              >
                {ex.muscleGroup}
              </span>
              {ex.isCustom && (
                <button
                  onClick={() => deleteCustom(ex.id)}
                  className="text-slate-300 hover:text-red-400 p-1 transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <CreateExerciseModal
          onClose={() => setShowCreate(false)}
          onCreated={(ex) => {
            setCustomExercises((prev) => [...prev, ex]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

function CreateExerciseModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (ex: AnyExercise) => void;
}) {
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>("Chest");
  const [category, setCategory] = useState<"compound" | "isolation">("isolation");
  const [equipment, setEquipment] = useState<Equipment>("dumbbell");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, muscleGroup, category, equipment }),
      });
      if (res.ok) {
        const d = await res.json();
        onCreated(d.exercise);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800">สร้าง Exercise ใหม่</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label">ชื่อท่า</label>
            <input
              type="text"
              className="input"
              placeholder="เช่น Cable Fly"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div>
            <label className="label">กลุ่มกล้ามเนื้อ</label>
            <select
              className="input"
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value as MuscleGroup)}
            >
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as "compound" | "isolation")
                }
              >
                <option value="compound">Compound</option>
                <option value="isolation">Isolation</option>
              </select>
            </div>
            <div>
              <label className="label">Equipment</label>
              <select
                className="input"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value as Equipment)}
              >
                {EQUIPMENT_LIST.map((eq) => (
                  <option key={eq} value={eq}>
                    {eq}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 text-sm"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 text-sm"
            >
              {saving ? "กำลังสร้าง..." : "สร้าง"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
