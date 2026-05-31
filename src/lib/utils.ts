import { WorkoutEntry, WorkoutType } from "./types";

// MET values from ACSM Compendium of Physical Activities
const MET_VALUES: Record<WorkoutType, number> = {
  "Weight Training": 5.0,
  Running: 9.8,
  Cycling: 7.5,
  Swimming: 7.0,
  Yoga: 2.5,
  HIIT: 10.0,
  Football: 7.0,
  Basketball: 6.5,
  Badminton: 5.5,
  Tennis: 7.3,
  Volleyball: 4.0,
  "Muay Thai": 9.5,
  "Jump Rope": 10.0,
  Hiking: 5.3,
  Dancing: 4.5,
  Rowing: 7.0,
  Other: 4.0,
};

export const WORKOUT_COLORS: Record<WorkoutType, string> = {
  "Weight Training": "bg-violet-100 text-violet-700",
  Running: "bg-emerald-100 text-emerald-700",
  Cycling: "bg-orange-100 text-orange-700",
  Swimming: "bg-sky-100 text-sky-700",
  Yoga: "bg-pink-100 text-pink-700",
  HIIT: "bg-red-100 text-red-700",
  Football: "bg-green-100 text-green-700",
  Basketball: "bg-amber-100 text-amber-700",
  Badminton: "bg-teal-100 text-teal-700",
  Tennis: "bg-lime-100 text-lime-700",
  Volleyball: "bg-cyan-100 text-cyan-700",
  "Muay Thai": "bg-rose-100 text-rose-700",
  "Jump Rope": "bg-fuchsia-100 text-fuchsia-700",
  Hiking: "bg-stone-100 text-stone-700",
  Dancing: "bg-purple-100 text-purple-700",
  Rowing: "bg-indigo-100 text-indigo-700",
  Other: "bg-slate-100 text-slate-600",
};

export const WORKOUT_CHART_COLORS: Record<WorkoutType, string> = {
  "Weight Training": "#7c3aed",
  Running: "#10b981",
  Cycling: "#f97316",
  Swimming: "#0ea5e9",
  Yoga: "#ec4899",
  HIIT: "#ef4444",
  Football: "#16a34a",
  Basketball: "#d97706",
  Badminton: "#0d9488",
  Tennis: "#65a30d",
  Volleyball: "#0891b2",
  "Muay Thai": "#e11d48",
  "Jump Rope": "#a21caf",
  Hiking: "#78716c",
  Dancing: "#9333ea",
  Rowing: "#4f46e5",
  Other: "#94a3b8",
};

// kcal = MET × weight(kg) × time(hours)
export function calcCalories(
  type: WorkoutType,
  duration: number,
  weightKg = 70
): number {
  return Math.round(MET_VALUES[type] * weightKg * (duration / 60));
}

export function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function fmtDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function calcStreak(entries: WorkoutEntry[]): number {
  if (!entries.length) return 0;
  const uniqueDates = [
    ...new Set(entries.map((e) => e.date)),
  ].sort().reverse();

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const ds of uniqueDates) {
    const d = new Date(ds + "T00:00:00");
    const diff = Math.round(
      (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff === streak) streak++;
    else break;
  }
  return streak;
}

export function getLast7DaysCalories(
  entries: WorkoutEntry[]
): { label: string; calories: number }[] {
  const result: { label: string; calories: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayCalories = entries
      .filter((e) => e.date === dateStr)
      .reduce((sum, e) => sum + e.calories, 0);
    result.push({
      label: d.toLocaleDateString("th-TH", { weekday: "short" }),
      calories: dayCalories,
    });
  }
  return result;
}

// Mifflin-St Jeor BMR
export function calcBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "male" | "female" | "other"
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === "female" ? base - 161 : base + 5);
}

// Activity multipliers: 1=sedentary, 2=light, 3=moderate, 4=active, 5=very active
const ACTIVITY_FACTORS = [1.2, 1.375, 1.55, 1.725, 1.9];

export function calcTDEE(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: "male" | "female" | "other",
  activityLevel: 1 | 2 | 3 | 4 | 5 = 2
): number {
  const bmr = calcBMR(weightKg, heightCm, age, gender);
  return Math.round(bmr * ACTIVITY_FACTORS[activityLevel - 1]);
}

export const ALL_TYPES: WorkoutType[] = [
  "Weight Training",
  "Running",
  "Cycling",
  "Swimming",
  "Yoga",
  "HIIT",
  "Football",
  "Basketball",
  "Badminton",
  "Tennis",
  "Volleyball",
  "Muay Thai",
  "Jump Rope",
  "Hiking",
  "Dancing",
  "Rowing",
  "Other",
];
