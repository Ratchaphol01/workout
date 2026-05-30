"use client";

import { useState } from "react";
import { Trash2, Filter, Flame, Clock, ChevronDown } from "lucide-react";
import {
  WorkoutEntry,
  WorkoutType,
  isWeightTraining,
  isCardio,
} from "@/lib/types";
import { fmtDate, WORKOUT_COLORS, ALL_TYPES } from "@/lib/utils";

interface Props {
  entries: WorkoutEntry[];
  onDelete: (id: string) => Promise<void>;
}

export default function WorkoutHistory({ entries, onDelete }: Props) {
  const [filter, setFilter] = useState<WorkoutType | "All">("All");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered =
    filter === "All" ? entries : entries.filter((e) => e.type === filter);

  async function handleDelete(id: string) {
    if (confirmId === id) {
      setDeletingId(id);
      await onDelete(id);
      setDeletingId(null);
      setConfirmId(null);
    } else {
      setConfirmId(id);
      setTimeout(
        () => setConfirmId((prev) => (prev === id ? null : prev)),
        3000
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Filter size={15} />
          <span className="text-sm font-medium">กรองตามประเภท:</span>
        </div>
        <div className="relative">
          <select
            className="input py-1.5 pr-8 text-sm w-auto appearance-none cursor-pointer"
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as WorkoutType | "All")
            }
          >
            <option value="All">ทั้งหมด</option>
            {ALL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
        <span className="text-xs text-slate-400 ml-auto">
          {filtered.length} รายการ
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center text-slate-400">
          <p className="font-medium">ไม่พบข้อมูล</p>
          <p className="text-sm mt-1">
            {filter !== "All"
              ? `ยังไม่มีบันทึก "${filter}" ในระบบ`
              : "เริ่มเพิ่มกิจกรรมแรกของคุณ"}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((entry) => (
            <li key={entry.id} className="card p-4 flex gap-4 items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      WORKOUT_COLORS[entry.type as WorkoutType] ??
                      "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {entry.type}
                  </span>
                  <span className="text-xs text-slate-400">
                    {fmtDate(entry.date)}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-600 mt-1.5">
                  <span className="flex items-center gap-1">
                    <Flame size={13} className="text-orange-400" />
                    {entry.calories} kcal
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={13} className="text-sky-400" />
                    {entry.duration} นาที
                  </span>
                </div>

                {entry.details && (
                  <div className="mt-1.5 text-xs text-slate-500">
                    {isWeightTraining(entry.details) && (
                      <div className="space-y-0.5">
                        {entry.details.exerciseName && (
                          <p className="font-semibold text-violet-600">
                            {entry.details.exerciseName}
                          </p>
                        )}
                        {entry.details.sets.length > 0 && (
                          <p>
                            <span className="font-medium">
                              {entry.details.sets.length} sets:
                            </span>{" "}
                            {entry.details.sets.map((s, i) => (
                              <span key={i}>
                                {i > 0 && (
                                  <span className="text-slate-300 mx-1">·</span>
                                )}
                                <span className="font-medium text-slate-600">
                                  {s.reps}×{s.weight}kg
                                </span>
                              </span>
                            ))}
                          </p>
                        )}
                      </div>
                    )}
                    {isCardio(entry.details) && (
                      <span>
                        {entry.details.distance > 0 &&
                          `${entry.details.distance} km`}
                        {entry.details.pace &&
                          ` · ${entry.details.pace} min/km`}
                      </span>
                    )}
                  </div>
                )}

                {entry.notes && (
                  <p className="mt-1 text-xs text-slate-400 italic truncate">
                    {entry.notes}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleDelete(entry.id)}
                disabled={deletingId === entry.id}
                title={confirmId === entry.id ? "กดอีกครั้งเพื่อยืนยัน" : "ลบ"}
                className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                  confirmId === entry.id
                    ? "bg-red-500 text-white"
                    : "text-slate-300 hover:text-red-400 hover:bg-red-50"
                } disabled:opacity-50`}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
