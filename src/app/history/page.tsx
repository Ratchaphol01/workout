"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Clock,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { WorkoutSession } from "@/lib/types";

function fmtDuration(mins: number) {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function CalendarGrid({
  year,
  month,
  sessionDates,
  selected,
  onSelect,
}: {
  year: number;
  month: number; // 0-indexed
  sessionDates: Set<string>;
  selected: string | null;
  onSelect: (d: string) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  const days: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const pad = (n: number) => String(n).padStart(2, "0");
  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <span
            key={d}
            className="text-center text-[11px] text-slate-400 font-medium py-1"
          >
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          const hasSession = sessionDates.has(dateStr);
          const isToday = dateStr === today;
          const isSel = dateStr === selected;
          return (
            <button
              key={dateStr}
              onClick={() => onSelect(isSel ? "" : dateStr)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all ${
                isSel
                  ? "bg-sky-500 text-white shadow-sm"
                  : isToday
                  ? "ring-2 ring-sky-300 text-sky-600"
                  : hasSession
                  ? "bg-violet-50 text-violet-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {day}
              {hasSession && !isSel && (
                <span className="w-1 h-1 rounded-full bg-violet-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>("");
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  useEffect(() => {
    fetch("/api/sessions?limit=100")
      .then((r) => {
        if (!r.ok) {
          router.push("/login");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d?.sessions) setSessions(d.sessions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  async function deleteSession(id: string) {
    const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    if (res.ok) setSessions((prev) => prev.filter((s) => s._id !== id));
  }

  const sessionDates = new Set(sessions.map((s) => s.date));

  const displayed = selected
    ? sessions.filter((s) => s.date === selected)
    : sessions;

  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  function prevMonth() {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
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
      <div className="max-w-xl mx-auto px-4 py-6 space-y-5">
        <h1 className="text-xl font-bold text-slate-800">Workout History</h1>

        {/* Calendar */}
        <div className="card p-5">
          {/* Month navigation */}
          <div className="flex items-center gap-3 mb-4">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100">
              <ChevronLeft size={16} />
            </button>
            <span className="flex-1 text-center text-sm font-semibold text-slate-700">
              {MONTH_NAMES[calMonth]} {calYear}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100">
              <ChevronRight size={16} />
            </button>
          </div>
          <CalendarGrid
            year={calYear}
            month={calMonth}
            sessionDates={sessionDates}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        {/* Session list */}
        {sessions.length === 0 ? (
          <div className="text-center py-10">
            <Dumbbell size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">ยังไม่มี workout session</p>
            <button
              onClick={() => router.push("/workout")}
              className="btn-primary mt-4 text-sm px-6"
            >
              เริ่ม Workout แรก
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {selected && (
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-600 font-medium">
                  {new Date(selected + "T00:00:00").toLocaleDateString("th-TH", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <button
                  onClick={() => setSelected("")}
                  className="text-xs text-sky-500 hover:text-sky-700"
                >
                  ล้างตัวกรอง
                </button>
              </div>
            )}

            {displayed.length === 0 && selected && (
              <p className="text-sm text-slate-400 text-center py-6">
                ไม่มี workout วันนี้
              </p>
            )}

            {displayed.map((s) => (
              <SessionCard
                key={s._id}
                session={s}
                onDelete={() => s._id && deleteSession(s._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionCard({
  session,
  onDelete,
}: {
  session: WorkoutSession;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const dateLabel = new Date(session.date + "T00:00:00").toLocaleDateString(
    "th-TH",
    { month: "short", day: "numeric" }
  );
  const completedSets = session.exercises.flatMap((e) => e.sets).length;

  return (
    <div className="card overflow-hidden">
      <button
        className="w-full text-left px-4 py-4"
        onClick={() => setExpanded((p) => !p)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
            <Dumbbell size={18} className="text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800">
              {session.exercises.map((e) => e.exerciseName).slice(0, 2).join(", ")}
              {session.exercises.length > 2 && ` +${session.exercises.length - 2}`}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {dateLabel} · {completedSets} sets
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock size={12} />
              <span>{fmtDuration(session.duration)}</span>
            </div>
            {session.totalVolume > 0 && (
              <div className="flex items-center gap-1 text-xs text-violet-500 mt-0.5">
                <TrendingUp size={12} />
                <span>{session.totalVolume.toLocaleString()} kg</span>
              </div>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-50 px-4 pb-4 pt-3">
          {session.exercises.map((ex, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <p className="text-xs font-semibold text-slate-600 mb-1">
                {ex.exerciseName}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ex.sets.map((s, si) => (
                  <span
                    key={si}
                    className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                  >
                    {s.weight} × {s.reps}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={onDelete}
            className="mt-3 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={13} />
            ลบ session นี้
          </button>
        </div>
      )}
    </div>
  );
}
