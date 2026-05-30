"use client";

import { Trash2, Check } from "lucide-react";
import { ActiveSet, SetType } from "@/lib/types";
import { calc1RM } from "@/lib/exercises";

const SET_TYPE_CONFIG: Record<SetType, { label: string; cls: string }> = {
  "warm-up": { label: "W",  cls: "bg-amber-100 text-amber-700" },
  "working":  { label: "S",  cls: "bg-sky-100 text-sky-700" },
  "drop":     { label: "D",  cls: "bg-orange-100 text-orange-700" },
  "failure":  { label: "F",  cls: "bg-red-100 text-red-700" },
};

const CYCLE: SetType[] = ["warm-up", "working", "drop", "failure"];

interface Props {
  index: number;
  set: ActiveSet;
  ghostWeight?: number;
  ghostReps?: number;
  onChange: (updates: Partial<ActiveSet>) => void;
  onComplete: () => void;
  onRemove: () => void;
}

export default function SetRow({
  index,
  set,
  ghostWeight,
  ghostReps,
  onChange,
  onComplete,
  onRemove,
}: Props) {
  const oneRM = calc1RM(set.weight, set.reps);
  const cfg = SET_TYPE_CONFIG[set.type];

  function cycleType() {
    if (set.completed) return;
    const i = CYCLE.indexOf(set.type);
    onChange({ type: CYCLE[(i + 1) % CYCLE.length] });
  }

  return (
    <div
      className={`grid grid-cols-[24px_34px_1fr_1fr_50px_34px_30px] gap-1.5 items-center px-2 py-1.5 rounded-lg transition-colors ${
        set.completed ? "bg-emerald-50" : "hover:bg-slate-50"
      }`}
    >
      <span className="text-xs font-bold text-slate-400 text-center select-none">
        {index + 1}
      </span>

      <button
        type="button"
        onClick={cycleType}
        title={set.type}
        className={`text-[10px] font-bold px-1 py-1 rounded-md w-full transition-colors ${cfg.cls}`}
      >
        {cfg.label}
      </button>

      <input
        type="number"
        className="input text-center py-1.5 text-sm disabled:bg-emerald-50 disabled:text-emerald-700 disabled:border-emerald-200"
        placeholder={ghostWeight ? String(ghostWeight) : "kg"}
        min={0}
        step={0.5}
        value={set.weight || ""}
        disabled={set.completed}
        onChange={(e) => onChange({ weight: Number(e.target.value) || 0 })}
      />

      <input
        type="number"
        className="input text-center py-1.5 text-sm disabled:bg-emerald-50 disabled:text-emerald-700 disabled:border-emerald-200"
        placeholder={ghostReps ? String(ghostReps) : "reps"}
        min={1}
        value={set.reps || ""}
        disabled={set.completed}
        onChange={(e) => onChange({ reps: Number(e.target.value) || 0 })}
      />

      <span
        className={`text-xs text-center tabular-nums font-medium ${
          oneRM > 0 ? "text-violet-500" : "text-slate-300"
        }`}
      >
        {oneRM > 0 ? oneRM : "—"}
      </span>

      <button
        type="button"
        onClick={onComplete}
        disabled={set.completed}
        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
          set.completed
            ? "bg-emerald-500 text-white"
            : "border-2 border-slate-200 text-transparent hover:border-emerald-400 hover:text-emerald-400"
        }`}
      >
        <Check size={14} />
      </button>

      <button
        type="button"
        onClick={onRemove}
        disabled={set.completed}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-400 disabled:opacity-30 transition-colors"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
