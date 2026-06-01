"use client";

import { Clock, Zap, TrendingUp, Flame, Bell, Scale } from "lucide-react";
import { WorkoutEntry, WorkoutType } from "@/lib/types";
import {
  calcStreak,
  getLast7DaysCalories,
  ALL_TYPES,
  WORKOUT_CHART_COLORS,
  localDate,
} from "@/lib/utils";
import CalorieChart from "./CalorieChart";
import StrengthProgress from "./StrengthProgress";
import NutritionSummary from "./NutritionSummary";
import WeightLogCard from "./WeightLogCard";

// --- Weekly reminder banner ---
function WeightReminderBanner({
  weightUpdatedAt,
  weightKg,
  onUpdate,
}: {
  weightUpdatedAt?: string;
  weightKg?: number;
  onUpdate: () => void;
}) {
  const daysSince = weightUpdatedAt
    ? Math.floor(
        (Date.now() - new Date(weightUpdatedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 999;

  if (daysSince < 7) return null;

  const isFirst = !weightKg;

  return (
    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
      <Bell size={17} className="text-amber-500 shrink-0 animate-bounce" />
      <p className="text-sm text-amber-800 flex-1 leading-snug">
        {isFirst ? (
          <>
            <span className="font-semibold">ยังไม่มีน้ำหนักในระบบ</span> —
            การคำนวณแคลอรีใช้ค่าเริ่มต้น 70 kg
          </>
        ) : (
          <>
            <span className="font-semibold">ครบ {daysSince} วันแล้ว!</span>{" "}
            อย่าลืมอัปเดตน้ำหนักประจำสัปดาห์
          </>
        )}
      </p>
      <button
        onClick={onUpdate}
        className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
      >
        <Scale size={13} />
        อัปเดต
      </button>
    </div>
  );
}

// --- Donut chart constants ---
const R = 72;
const SW = 28;
const C = 2 * Math.PI * R;
const SIZE = 200;
const CX = SIZE / 2;
const GAP = 4;

function CalorieDonut({ entries }: { entries: WorkoutEntry[] }) {
  const byType = ALL_TYPES.reduce<Record<WorkoutType, number>>(
    (acc, t) => {
      acc[t] = entries
        .filter((e) => e.type === t)
        .reduce((s, e) => s + e.calories, 0);
      return acc;
    },
    {} as Record<WorkoutType, number>
  );

  const total = ALL_TYPES.reduce((s, t) => s + byType[t], 0);
  const active = ALL_TYPES.filter((t) => byType[t] > 0);

  // stroke-dashoffset formula: C/4 - cumulative
  // This places segment start at `cumulative` units clockwise from 12 o'clock
  let cumulative = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
      {/* Donut SVG */}
      <div className="relative shrink-0">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-44 sm:w-48 drop-shadow-sm"
        >
          {/* Background track */}
          <circle
            cx={CX}
            cy={CX}
            r={R}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={SW}
          />

          {total === 0 ? (
            <>
              <text
                x={CX}
                y={CX - 6}
                textAnchor="middle"
                fontSize="20"
                fill="#cbd5e1"
                fontWeight="700"
              >
                0
              </text>
              <text
                x={CX}
                y={CX + 14}
                textAnchor="middle"
                fontSize="11"
                fill="#94a3b8"
              >
                kcal
              </text>
            </>
          ) : (
            active.map((type) => {
              const arc = (byType[type] / total) * C;
              const visible = Math.max(0, arc - GAP);
              const dashoffset = C / 4 - cumulative;
              cumulative += arc;
              return (
                <circle
                  key={type}
                  cx={CX}
                  cy={CX}
                  r={R}
                  fill="none"
                  stroke={WORKOUT_CHART_COLORS[type]}
                  strokeWidth={SW}
                  strokeDasharray={`${visible} ${C}`}
                  strokeDashoffset={dashoffset}
                />
              );
            })
          )}
        </svg>

        {/* Center label */}
        {total > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-slate-800 leading-none tabular-nums">
              {total >= 10000
                ? `${(total / 1000).toFixed(1)}k`
                : total.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 font-medium">
              kcal
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex-1 w-full min-w-0 space-y-2.5">
        {total === 0 ? (
          <p className="text-sm text-slate-400 text-center sm:text-left">
            ยังไม่มีข้อมูลการออกกำลังกาย
          </p>
        ) : (
          active.map((type) => {
            const cal = byType[type];
            const pct = Math.round((cal / total) * 100);
            const barW = pct;
            return (
              <div key={type} className="space-y-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: WORKOUT_CHART_COLORS[type] }}
                  />
                  <span className="text-sm text-slate-600 flex-1 truncate">
                    {type}
                  </span>
                  <span className="text-sm font-semibold text-slate-800 tabular-nums shrink-0">
                    {cal.toLocaleString()} kcal
                  </span>
                  <span className="text-xs text-slate-400 w-8 text-right tabular-nums shrink-0">
                    {pct}%
                  </span>
                </div>
                {/* Mini progress bar */}
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${barW}%`,
                      backgroundColor: WORKOUT_CHART_COLORS[type],
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// --- Stat cards ---
function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  unit: string;
  color: string;
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}
      >
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
          {label}
        </p>
        <p className="text-2xl font-bold text-slate-800 leading-tight">
          {value}
          {unit && (
            <span className="text-sm font-normal text-slate-500 ml-1">
              {unit}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

// --- Main Dashboard ---
export default function Dashboard({
  entries,
  weightKg,
  weightUpdatedAt,
  onUpdateWeight,
}: {
  entries: WorkoutEntry[];
  weightKg?: number;
  weightUpdatedAt?: string;
  onUpdateWeight: () => void;
}) {
  const todayStr = localDate();
  const todayEntries = entries.filter((e) => e.date === todayStr);

  const totalMinutes = todayEntries.reduce((s, e) => s + e.duration, 0);
  const todayCalories = todayEntries.reduce((s, e) => s + e.calories, 0);
  const streak = calcStreak(entries);
  const chartData = getLast7DaysCalories(entries);

  return (
    <div className="space-y-5">
      <WeightReminderBanner
        weightUpdatedAt={weightUpdatedAt}
        weightKg={weightKg}
        onUpdate={onUpdateWeight}
      />
      {/* Row 1: Donut + Time + Streak */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Donut chart card — spans 2 cols on large screens */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={16} className="text-orange-400" />
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
              แคลอรีวันนี้
            </h2>
          </div>
          <CalorieDonut entries={todayEntries} />
        </div>

        {/* Time + Streak stacked */}
        <div className="flex flex-row lg:flex-col gap-4">
          <StatCard
            icon={Clock}
            label="Workout Time"
            value={
              totalMinutes >= 60
                ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
                : totalMinutes
            }
            unit={totalMinutes >= 60 ? "" : "min"}
            color="bg-sky-500"
          />
          <StatCard
            icon={Zap}
            label="Days Streak"
            value={streak}
            unit={streak === 1 ? "day" : "days"}
            color="bg-violet-500"
          />
        </div>
      </div>

      {/* Row 2: 7-day trend */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={17} className="text-sky-500" />
            <h2 className="font-semibold text-slate-700">
              Calories Trend (7 Days)
            </h2>
          </div>
          {todayCalories > 0 && (
            <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-3 py-1 rounded-full">
              Today: {todayCalories} kcal
            </span>
          )}
        </div>
        <CalorieChart data={chartData} />
      </div>

      {/* Row 3: Daily weight log */}
      <WeightLogCard profileWeight={weightKg} />

      {/* Row 4: Strength progress */}
      <StrengthProgress />

      {/* Row 5: Nutrition summary */}
      <NutritionSummary />
    </div>
  );
}
