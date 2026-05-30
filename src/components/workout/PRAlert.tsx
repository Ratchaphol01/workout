"use client";

import { useEffect } from "react";
import { Trophy } from "lucide-react";

interface Props {
  exerciseName: string;
  oneRM: number;
  prevOneRM?: number;
  onClose: () => void;
}

export default function PRAlert({
  exerciseName,
  oneRM,
  prevOneRM,
  onClose,
}: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const improvement =
    prevOneRM && oneRM > prevOneRM
      ? `+${Math.round((oneRM - prevOneRM) * 10) / 10} kg`
      : null;

  return (
    <div
      className="fixed inset-x-4 top-4 z-50 flex justify-center"
      style={{
        animation: "prSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      <style>{`
        @keyframes prSlideDown {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div
        className="bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-2xl px-5 py-4 shadow-2xl max-w-xs w-full cursor-pointer"
        onClick={onClose}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Trophy size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">
              🎉 Personal Record!
            </p>
            <p className="font-bold text-sm truncate mt-0.5">{exerciseName}</p>
            <p className="text-sm opacity-90 mt-0.5">
              1RM:{" "}
              <span className="font-bold">{oneRM} kg</span>
              {improvement && (
                <span className="opacity-75 ml-1.5">({improvement})</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
