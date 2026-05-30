import { WorkoutEntry } from "./types";

const KEY = "workout_entries";

export function getWorkouts(): WorkoutEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WorkoutEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveWorkout(entry: WorkoutEntry): void {
  const list = getWorkouts();
  list.unshift(entry);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function deleteWorkout(id: string): void {
  const list = getWorkouts().filter((w) => w.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}
