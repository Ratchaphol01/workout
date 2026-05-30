"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { DEFAULT_EXERCISES, MUSCLE_GROUPS, MUSCLE_GROUP_COLORS } from "@/lib/exercises";
import type { AnyExercise, MuscleGroup } from "@/lib/exercises";

interface Props {
  customExercises: AnyExercise[];
  onSelect: (exercise: AnyExercise) => void;
  onClose: () => void;
}

export default function ExercisePicker({ customExercises, onSelect, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<MuscleGroup | "All">("All");

  const allExercises = useMemo(
    () => [...DEFAULT_EXERCISES, ...customExercises],
    [customExercises]
  );

  const filtered = useMemo(() => {
    let list = allExercises;
    if (filter !== "All") list = list.filter((e) => e.muscleGroup === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }
    return list;
  }, [allExercises, filter, search]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col">
      <div className="bg-white flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-safe pt-4 pb-3 border-b border-slate-100">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X size={20} />
          </button>
          <h2 className="text-base font-bold text-slate-800 flex-1">
            เลือกท่าออกกำลังกาย
          </h2>
          <span className="text-xs text-slate-400">{filtered.length} ท่า</span>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
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
              autoFocus
            />
          </div>
        </div>

        {/* Muscle group filter chips */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {(["All", ...MUSCLE_GROUPS] as (MuscleGroup | "All")[]).map((g) => (
            <button
              key={g}
              onClick={() => setFilter(g)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filter === g
                  ? "bg-sky-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto px-4 pb-safe pb-6 space-y-0.5">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {ex.name}
                  {ex.isCustom && (
                    <span className="ml-1.5 text-[10px] text-violet-500 font-medium">
                      custom
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400 capitalize mt-0.5">
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
            </button>
          ))}

          {filtered.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-10">
              ไม่พบท่าที่ค้นหา
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
