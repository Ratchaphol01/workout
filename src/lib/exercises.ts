export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Biceps"
  | "Triceps"
  | "Legs"
  | "Core"
  | "Full Body";

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "cable"
  | "machine"
  | "bodyweight"
  | "other";

export type ExerciseCategory = "compound" | "isolation";

export interface DefaultExercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  category: ExerciseCategory;
  equipment: Equipment;
  isCustom: false;
}

export interface CustomExercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  category: ExerciseCategory;
  equipment: Equipment;
  isCustom: true;
  userId: string;
}

export type AnyExercise = DefaultExercise | CustomExercise;

export const MUSCLE_GROUP_COLORS: Record<MuscleGroup, string> = {
  Chest:      "bg-rose-100 text-rose-700",
  Back:       "bg-sky-100 text-sky-700",
  Shoulders:  "bg-amber-100 text-amber-700",
  Biceps:     "bg-violet-100 text-violet-700",
  Triceps:    "bg-purple-100 text-purple-700",
  Legs:       "bg-emerald-100 text-emerald-700",
  Core:       "bg-orange-100 text-orange-700",
  "Full Body":"bg-slate-100 text-slate-700",
};

export const MUSCLE_GROUPS: MuscleGroup[] = [
  "Chest","Back","Shoulders","Biceps","Triceps","Legs","Core","Full Body",
];

export const DEFAULT_EXERCISES: DefaultExercise[] = [
  // CHEST
  { id:"e_bp",   name:"Bench Press",           muscleGroup:"Chest",   category:"compound",  equipment:"barbell",    isCustom:false },
  { id:"e_ibp",  name:"Incline Bench Press",   muscleGroup:"Chest",   category:"compound",  equipment:"barbell",    isCustom:false },
  { id:"e_dbp",  name:"Decline Bench Press",   muscleGroup:"Chest",   category:"compound",  equipment:"barbell",    isCustom:false },
  { id:"e_dbfly",name:"Dumbbell Flyes",        muscleGroup:"Chest",   category:"isolation", equipment:"dumbbell",   isCustom:false },
  { id:"e_cc",   name:"Cable Crossover",       muscleGroup:"Chest",   category:"isolation", equipment:"cable",      isCustom:false },
  { id:"e_pu",   name:"Push Up",               muscleGroup:"Chest",   category:"compound",  equipment:"bodyweight", isCustom:false },
  { id:"e_cpm",  name:"Chest Press Machine",   muscleGroup:"Chest",   category:"compound",  equipment:"machine",    isCustom:false },
  { id:"e_idbp", name:"Incline Dumbbell Press",muscleGroup:"Chest",   category:"compound",  equipment:"dumbbell",   isCustom:false },
  // BACK
  { id:"e_dl",   name:"Deadlift",              muscleGroup:"Back",    category:"compound",  equipment:"barbell",    isCustom:false },
  { id:"e_pup",  name:"Pull Up",               muscleGroup:"Back",    category:"compound",  equipment:"bodyweight", isCustom:false },
  { id:"e_lpd",  name:"Lat Pulldown",          muscleGroup:"Back",    category:"compound",  equipment:"cable",      isCustom:false },
  { id:"e_bbr",  name:"Barbell Row",           muscleGroup:"Back",    category:"compound",  equipment:"barbell",    isCustom:false },
  { id:"e_dbr",  name:"Dumbbell Row",          muscleGroup:"Back",    category:"compound",  equipment:"dumbbell",   isCustom:false },
  { id:"e_scr",  name:"Seated Cable Row",      muscleGroup:"Back",    category:"compound",  equipment:"cable",      isCustom:false },
  { id:"e_tbr",  name:"T-Bar Row",             muscleGroup:"Back",    category:"compound",  equipment:"barbell",    isCustom:false },
  { id:"e_fwr",  name:"Face Pull",             muscleGroup:"Back",    category:"isolation", equipment:"cable",      isCustom:false },
  // SHOULDERS
  { id:"e_ohp",  name:"Overhead Press",        muscleGroup:"Shoulders",category:"compound", equipment:"barbell",    isCustom:false },
  { id:"e_dbsp", name:"Dumbbell Shoulder Press",muscleGroup:"Shoulders",category:"compound",equipment:"dumbbell",   isCustom:false },
  { id:"e_lr",   name:"Lateral Raise",         muscleGroup:"Shoulders",category:"isolation",equipment:"dumbbell",   isCustom:false },
  { id:"e_fr",   name:"Front Raise",           muscleGroup:"Shoulders",category:"isolation",equipment:"dumbbell",   isCustom:false },
  { id:"e_rdf",  name:"Rear Delt Fly",         muscleGroup:"Shoulders",category:"isolation",equipment:"dumbbell",   isCustom:false },
  { id:"e_ap",   name:"Arnold Press",          muscleGroup:"Shoulders",category:"compound", equipment:"dumbbell",   isCustom:false },
  // BICEPS
  { id:"e_bbc",  name:"Barbell Curl",          muscleGroup:"Biceps",  category:"isolation", equipment:"barbell",    isCustom:false },
  { id:"e_dbc",  name:"Dumbbell Curl",         muscleGroup:"Biceps",  category:"isolation", equipment:"dumbbell",   isCustom:false },
  { id:"e_hc",   name:"Hammer Curl",           muscleGroup:"Biceps",  category:"isolation", equipment:"dumbbell",   isCustom:false },
  { id:"e_pc",   name:"Preacher Curl",         muscleGroup:"Biceps",  category:"isolation", equipment:"machine",    isCustom:false },
  { id:"e_cbc",  name:"Cable Curl",            muscleGroup:"Biceps",  category:"isolation", equipment:"cable",      isCustom:false },
  { id:"e_conc", name:"Concentration Curl",    muscleGroup:"Biceps",  category:"isolation", equipment:"dumbbell",   isCustom:false },
  // TRICEPS
  { id:"e_cgbp", name:"Close Grip Bench Press",muscleGroup:"Triceps", category:"compound",  equipment:"barbell",    isCustom:false },
  { id:"e_tdip", name:"Tricep Dip",            muscleGroup:"Triceps", category:"compound",  equipment:"bodyweight", isCustom:false },
  { id:"e_sc",   name:"Skull Crusher",         muscleGroup:"Triceps", category:"isolation", equipment:"barbell",    isCustom:false },
  { id:"e_tpd",  name:"Tricep Pushdown",       muscleGroup:"Triceps", category:"isolation", equipment:"cable",      isCustom:false },
  { id:"e_ote",  name:"Overhead Tricep Ext.",  muscleGroup:"Triceps", category:"isolation", equipment:"dumbbell",   isCustom:false },
  { id:"e_kbk",  name:"Kickback",              muscleGroup:"Triceps", category:"isolation", equipment:"dumbbell",   isCustom:false },
  // LEGS
  { id:"e_sq",   name:"Squat",                 muscleGroup:"Legs",    category:"compound",  equipment:"barbell",    isCustom:false },
  { id:"e_fsq",  name:"Front Squat",           muscleGroup:"Legs",    category:"compound",  equipment:"barbell",    isCustom:false },
  { id:"e_rdl",  name:"Romanian Deadlift",     muscleGroup:"Legs",    category:"compound",  equipment:"barbell",    isCustom:false },
  { id:"e_lp",   name:"Leg Press",             muscleGroup:"Legs",    category:"compound",  equipment:"machine",    isCustom:false },
  { id:"e_lc",   name:"Leg Curl",              muscleGroup:"Legs",    category:"isolation", equipment:"machine",    isCustom:false },
  { id:"e_le",   name:"Leg Extension",         muscleGroup:"Legs",    category:"isolation", equipment:"machine",    isCustom:false },
  { id:"e_cr",   name:"Calf Raise",            muscleGroup:"Legs",    category:"isolation", equipment:"machine",    isCustom:false },
  { id:"e_lu",   name:"Lunges",                muscleGroup:"Legs",    category:"compound",  equipment:"dumbbell",   isCustom:false },
  { id:"e_ht",   name:"Hip Thrust",            muscleGroup:"Legs",    category:"compound",  equipment:"barbell",    isCustom:false },
  { id:"e_bss",  name:"Bulgarian Split Squat", muscleGroup:"Legs",    category:"compound",  equipment:"dumbbell",   isCustom:false },
  { id:"e_sldl", name:"Stiff Leg Deadlift",    muscleGroup:"Legs",    category:"compound",  equipment:"barbell",    isCustom:false },
  // CORE
  { id:"e_pl",   name:"Plank",                 muscleGroup:"Core",    category:"isolation", equipment:"bodyweight", isCustom:false },
  { id:"e_crch", name:"Crunch",                muscleGroup:"Core",    category:"isolation", equipment:"bodyweight", isCustom:false },
  { id:"e_lgr",  name:"Leg Raise",             muscleGroup:"Core",    category:"isolation", equipment:"bodyweight", isCustom:false },
  { id:"e_ccr",  name:"Cable Crunch",          muscleGroup:"Core",    category:"isolation", equipment:"cable",      isCustom:false },
  { id:"e_rtwt", name:"Russian Twist",         muscleGroup:"Core",    category:"isolation", equipment:"bodyweight", isCustom:false },
  { id:"e_abwh", name:"Ab Wheel",              muscleGroup:"Core",    category:"isolation", equipment:"other",      isCustom:false },
  // FULL BODY
  { id:"e_cap",  name:"Clean and Press",       muscleGroup:"Full Body",category:"compound", equipment:"barbell",    isCustom:false },
  { id:"e_brp",  name:"Burpee",                muscleGroup:"Full Body",category:"compound", equipment:"bodyweight", isCustom:false },
  { id:"e_fw",   name:"Farmer's Walk",         muscleGroup:"Full Body",category:"compound", equipment:"dumbbell",   isCustom:false },
  { id:"e_ks",   name:"Kettlebell Swing",      muscleGroup:"Full Body",category:"compound", equipment:"other",      isCustom:false },
];

export function findExercise(
  id: string,
  customs: CustomExercise[] = []
): AnyExercise | undefined {
  return (
    DEFAULT_EXERCISES.find((e) => e.id === id) ??
    customs.find((e) => e.id === id)
  );
}

// 1RM formula: Epley
export function calc1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

// Smart progression suggestion
export function getProgressionSuggestion(
  lastWeight: number,
  lastReps: number,
  targetReps: number
): { weight: number; reps: number; note: string } | null {
  if (!lastWeight || !lastReps) return null;

  if (lastReps >= targetReps) {
    // Hit target — increase weight
    const bump = lastWeight >= 100 ? 5 : lastWeight >= 60 ? 2.5 : 1.25;
    return {
      weight: lastWeight + bump,
      reps: targetReps,
      note: `ครั้งที่แล้วทำได้ครบ — เพิ่มน้ำหนัก +${bump}kg`,
    };
  } else {
    // Didn't hit target — same weight, try more reps
    return {
      weight: lastWeight,
      reps: lastReps + 1,
      note: `เพิ่ม 1 rep ก่อนขึ้นน้ำหนัก`,
    };
  }
}
