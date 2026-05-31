export type DietPlan = "cutting" | "maintenance" | "bulking";

export const DIET_PLANS: Record<
  DietPlan,
  {
    label: string;
    labelTh: string;
    desc: string;
    calAdj: number;
    macros: { protein: number; carbs: number; fat: number };
    color: string;
    bg: string;
    border: string;
    dot: string;
  }
> = {
  cutting: {
    label: "Cutting",
    labelTh: "ลดไขมัน",
    desc: "ขาดดุล −400 kcal · โปรตีนสูงรักษากล้ามเนื้อ",
    calAdj: -400,
    macros: { protein: 0.4, carbs: 0.35, fat: 0.25 },
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-200",
    dot: "#0ea5e9",
  },
  maintenance: {
    label: "Maintenance",
    labelTh: "คงน้ำหนัก",
    desc: "เท่ากับ TDEE · สมดุลสารอาหาร",
    calAdj: 0,
    macros: { protein: 0.3, carbs: 0.4, fat: 0.3 },
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "#10b981",
  },
  bulking: {
    label: "Bulking",
    labelTh: "เพิ่มกล้ามเนื้อ",
    desc: "เกินดุล +400 kcal · คาร์บสูงพลังงานสร้างกล้าม",
    calAdj: 400,
    macros: { protein: 0.25, carbs: 0.5, fat: 0.25 },
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "#f59e0b",
  },
};
