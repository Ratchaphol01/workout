export type WorkoutType =
  | "Weight Training"
  | "Running"
  | "Cycling"
  | "Swimming"
  | "Yoga"
  | "HIIT"
  | "Football"
  | "Basketball"
  | "Badminton"
  | "Tennis"
  | "Volleyball"
  | "Muay Thai"
  | "Jump Rope"
  | "Hiking"
  | "Dancing"
  | "Rowing"
  | "Other";

export type SetType = "warm-up" | "working" | "drop" | "failure";

export interface SetEntry {
  reps: number;
  weight: number;
}

export interface WeightTrainingDetails {
  exerciseName?: string;
  sets: SetEntry[];
}

export interface CardioDetails {
  distance: number;
  pace: string;
}

export interface WorkoutEntry {
  id: string;
  date: string;
  type: WorkoutType;
  duration: number;
  calories: number;
  notes?: string;
  details?: WeightTrainingDetails | CardioDetails;
}

export function isWeightTraining(
  details: WorkoutEntry["details"]
): details is WeightTrainingDetails {
  return (
    !!details &&
    "sets" in details &&
    Array.isArray((details as WeightTrainingDetails).sets)
  );
}

export function isCardio(
  details: WorkoutEntry["details"]
): details is CardioDetails {
  return !!details && "distance" in details;
}

// ─── Active Workout Session (client-side state) ──────────────────────────────

export interface ActiveSet {
  id: string;
  type: SetType;
  weight: number;
  reps: number;
  completed: boolean;
  completedAt?: string;
}

export interface ActiveExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: ActiveSet[];
  notes?: string;
}

export interface ActiveSession {
  startedAt: string;
  exercises: ActiveExercise[];
  notes?: string;
}

// ─── Saved Workout Session (DB) ──────────────────────────────────────────────

export interface SavedSet {
  type: SetType;
  weight: number;
  reps: number;
  completedAt?: string;
}

export interface SavedExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: SavedSet[];
  notes?: string;
}

export interface WorkoutSession {
  _id?: string;
  userId?: string;
  date: string;
  startedAt: string;
  finishedAt: string;
  duration: number;
  exercises: SavedExercise[];
  notes?: string;
  totalVolume: number;
  totalCalories?: number;
  createdAt?: string;
}

// ─── Personal Record ─────────────────────────────────────────────────────────

export interface PersonalRecord {
  _id?: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  oneRM: number;
  date: string;
}

// ─── Routine ─────────────────────────────────────────────────────────────────

export interface RoutineExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  targetSets: number;
  targetReps: number;
}

export interface Routine {
  _id?: string;
  name: string;
  exercises: RoutineExercise[];
  createdAt?: string;
}
