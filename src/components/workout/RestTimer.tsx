"use client";

import { SkipForward } from "lucide-react";

interface Props {
  remaining: number;
  total: number;
  onSkip: () => void;
  onAdd60: () => void;
}

export default function RestTimer({ remaining, total, onSkip, onAdd60 }: Props) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? remaining / total : 0;
  const offset = circ * (1 - pct);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const timeStr =
    mins > 0
      ? `${mins}:${secs.toString().padStart(2, "0")}`
      : `${secs}s`;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-white rounded-2xl shadow-xl border border-slate-100 px-5 py-3 flex items-center gap-4 w-72">
      {/* Progress ring */}
      <div className="relative w-12 h-12 shrink-0">
        <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
          <circle
            cx="24" cy="24" r={r}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="4"
          />
          <circle
            cx="24" cy="24" r={r}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-slate-700">
          {timeStr}
        </span>
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium">พักระหว่างเซ็ต</p>
        <p className="text-xl font-bold text-slate-800 tabular-nums leading-none">
          {timeStr}
        </p>
      </div>

      {/* Controls */}
      <button
        onClick={onAdd60}
        className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1.5 rounded-lg transition-colors"
      >
        +60
      </button>
      <button
        onClick={onSkip}
        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        title="ข้ามการพัก"
      >
        <SkipForward size={16} />
      </button>
    </div>
  );
}
