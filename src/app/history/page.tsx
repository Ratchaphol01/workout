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
  Activity,
  Flame,
} from "lucide-react";
import { WorkoutSession, WorkoutEntry } from "@/lib/types";
import { localDate, WORKOUT_CHART_COLORS } from "@/lib/utils";

// ─── Unified item for display ────────────────────────────────────────────────
type HistoryItem =
  | { kind: "session"; data: WorkoutSession }
  | { kind: "cardio"; data: WorkoutEntry & { _id?: string } };

function fmtDuration(mins: number) {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

// ─── Calendar ─────────────────────────────────────────────────────────────────
function CalendarGrid({
  year, month, activeDates, selected, onSelect,
}: {
  year: number; month: number;
  activeDates: Set<string>; selected: string | null;
  onSelect: (d: string) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = localDate();
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
          <span key={d} className="text-center text-[11px] text-slate-400 font-medium py-1">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
          const hasActivity = activeDates.has(dateStr);
          const isToday = dateStr === today;
          const isSel = dateStr === selected;
          return (
            <button
              key={dateStr}
              onClick={() => onSelect(isSel ? "" : dateStr)}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all ${
                isSel ? "bg-sky-500 text-white shadow-sm"
                : isToday ? "ring-2 ring-sky-300 text-sky-600"
                : hasActivity ? "bg-violet-50 text-violet-700"
                : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {day}
              {hasActivity && !isSel && (
                <span className="w-1 h-1 rounded-full bg-violet-400 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Session card (weight training) ──────────────────────────────────────────
function SessionCard({ session, onDelete }: { session: WorkoutSession; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const dateLabel = new Date(session.date + "T00:00:00").toLocaleDateString("th-TH", {
    month: "short", day: "numeric",
  });
  const completedSets = session.exercises.flatMap((e) => e.sets).length;

  return (
    <div className="card overflow-hidden">
      <button className="w-full text-left px-4 py-4" onClick={() => setExpanded((p) => !p)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
            <Dumbbell size={18} className="text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800">
              {session.exercises.length === 0
                ? "Weight Training"
                : session.exercises.map((e) => e.exerciseName).slice(0, 2).join(", ")}
              {session.exercises.length > 2 && ` +${session.exercises.length - 2}`}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {dateLabel} · {completedSets} sets
              {session.totalCalories ? ` · ${session.totalCalories} kcal` : ""}
            </p>
          </div>
          <div className="text-right shrink-0 space-y-0.5">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock size={12} />
              <span>{fmtDuration(session.duration ?? 0)}</span>
            </div>
            {(session.totalVolume ?? 0) > 0 && (
              <div className="flex items-center gap-1 text-xs text-violet-500">
                <TrendingUp size={12} />
                <span>{session.totalVolume!.toLocaleString()} kg</span>
              </div>
            )}
          </div>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-slate-50 px-4 pb-4 pt-3">
          {session.exercises.length > 0 ? session.exercises.map((ex, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <p className="text-xs font-semibold text-slate-600 mb-1">{ex.exerciseName}</p>
              <div className="flex flex-wrap gap-1.5">
                {ex.sets.map((s, si) => (
                  <span key={si} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {s.weight} × {s.reps}
                  </span>
                ))}
              </div>
            </div>
          )) : (
            <p className="text-xs text-slate-400">ไม่มีข้อมูล exercise</p>
          )}
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

// ─── Cardio card ──────────────────────────────────────────────────────────────
function CardioCard({
  entry,
  onDelete,
}: {
  entry: WorkoutEntry & { _id?: string };
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const dateLabel = new Date(entry.date + "T00:00:00").toLocaleDateString("th-TH", {
    month: "short", day: "numeric",
  });
  const color = WORKOUT_CHART_COLORS[entry.type] ?? "#0ea5e9";
  const details = entry.details as { distance?: number; pace?: string } | undefined;

  return (
    <div className="card overflow-hidden">
      <button className="w-full text-left px-4 py-4" onClick={() => setExpanded((p) => !p)}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <Activity size={18} style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800">{entry.type}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {dateLabel}
              {details?.distance ? ` · ${details.distance} km` : ""}
              {details?.pace ? ` · ${details.pace} min/km` : ""}
            </p>
          </div>
          <div className="text-right shrink-0 space-y-0.5">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock size={12} />
              <span>{fmtDuration(entry.duration)}</span>
            </div>
            {entry.calories > 0 && (
              <div className="flex items-center gap-1 text-xs" style={{ color }}>
                <Flame size={12} />
                <span>{entry.calories} kcal</span>
              </div>
            )}
          </div>
        </div>
      </button>
      {expanded && (
        <div className="border-t border-slate-50 px-4 pb-4 pt-3 space-y-1.5">
          {entry.notes && (
            <p className="text-sm text-slate-600">{entry.notes}</p>
          )}
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={13} />
            ลบ activity นี้
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [cardios, setCardios] = useState<(WorkoutEntry & { _id?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  useEffect(() => {
    Promise.all([
      fetch("/api/sessions?limit=100").then((r) => {
        if (!r.ok) { router.push("/login"); return null; }
        return r.json();
      }),
      fetch("/api/workouts").then((r) => r.ok ? r.json() : { workouts: [] }),
    ])
      .then(([sessionData, workoutData]) => {
        if (sessionData?.sessions) setSessions(sessionData.sessions);
        if (workoutData?.workouts) setCardios(workoutData.workouts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  async function deleteSession(id: string) {
    const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    if (res.ok) setSessions((prev) => prev.filter((s) => s._id !== id));
  }

  async function deleteCardio(id: string) {
    const res = await fetch(`/api/workouts/${id}`, { method: "DELETE" });
    if (res.ok) setCardios((prev) => prev.filter((c) => c._id !== id));
  }

  // Merge and sort all items by date descending
  const items: HistoryItem[] = [
    ...sessions.map((s): HistoryItem => ({ kind: "session", data: s })),
    ...cardios.map((c): HistoryItem => ({ kind: "cardio", data: c })),
  ].sort((a, b) => {
    const da = a.kind === "session" ? a.data.date : a.data.date;
    const db = b.kind === "session" ? b.data.date : b.data.date;
    return db.localeCompare(da);
  });

  const activeDates = new Set(items.map((item) =>
    item.kind === "session" ? item.data.date : item.data.date
  ));

  const displayed = selected
    ? items.filter((item) =>
        item.kind === "session" ? item.data.date === selected : item.data.date === selected
      )
    : items;

  const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
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
            activeDates={activeDates}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        {/* List */}
        {items.length === 0 ? (
          <div className="text-center py-10">
            <Dumbbell size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">ยังไม่มีประวัติ workout</p>
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
                    weekday: "long", year: "numeric", month: "long", day: "numeric",
                  })}
                </p>
                <button onClick={() => setSelected("")} className="text-xs text-sky-500 hover:text-sky-700">
                  ล้างตัวกรอง
                </button>
              </div>
            )}

            {displayed.length === 0 && selected && (
              <p className="text-sm text-slate-400 text-center py-6">ไม่มี workout วันนี้</p>
            )}

            {displayed.map((item, i) =>
              item.kind === "session" ? (
                <SessionCard
                  key={`s-${item.data._id ?? i}`}
                  session={item.data}
                  onDelete={() => item.data._id && deleteSession(item.data._id)}
                />
              ) : (
                <CardioCard
                  key={`c-${(item.data as WorkoutEntry & { _id?: string })._id ?? item.data.id ?? i}`}
                  entry={item.data}
                  onDelete={() => {
                    const id = (item.data as WorkoutEntry & { _id?: string })._id ?? item.data.id;
                    if (id) deleteCardio(id);
                  }}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
