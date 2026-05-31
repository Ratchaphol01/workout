"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Flame,
  Beef,
  Wheat,
  Droplets,
} from "lucide-react";
import { calcTDEE } from "@/lib/utils";
import { DIET_PLANS, type DietPlan } from "@/lib/nutrition";

// ---- Types ----
interface FoodEntry {
  _id: string;
  date: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  amount?: string;
}

interface Profile {
  weight?: number;
  height?: number;
  age?: number;
  gender?: "male" | "female" | "other";
  activityLevel?: 1 | 2 | 3 | 4 | 5;
}

// ---- Thai food presets ----
const FOOD_PRESETS = [
  { name: "ข้าวสวย (1 ทัพพี)", calories: 120, protein: 2, carbs: 27, fat: 0, amount: "1 ทัพพี" },
  { name: "ข้าวมันไก่", calories: 420, protein: 28, carbs: 48, fat: 12, amount: "1 จาน" },
  { name: "ผัดกะเพราหมู + ไข่ดาว", calories: 480, protein: 30, carbs: 38, fat: 18, amount: "1 จาน" },
  { name: "ส้มตำไทย", calories: 150, protein: 4, carbs: 28, fat: 3, amount: "1 จาน" },
  { name: "ต้มยำกุ้ง", calories: 120, protein: 14, carbs: 8, fat: 4, amount: "1 ถ้วย" },
  { name: "ไก่ย่าง", calories: 200, protein: 32, carbs: 2, fat: 7, amount: "1 ชิ้น" },
  { name: "ข้าวผัดหมู", calories: 400, protein: 18, carbs: 52, fat: 14, amount: "1 จาน" },
  { name: "ก๋วยเตี๋ยวน้ำ", calories: 280, protein: 16, carbs: 42, fat: 5, amount: "1 ชาม" },
  { name: "แกงเขียวหวานไก่", calories: 320, protein: 22, carbs: 18, fat: 16, amount: "1 ถ้วย" },
  { name: "ไข่ดาว", calories: 90, protein: 6, carbs: 0, fat: 7, amount: "1 ฟอง" },
  { name: "นมกล่อง", calories: 120, protein: 6, carbs: 12, fat: 5, amount: "200 ml" },
  { name: "กล้วยหอม", calories: 90, protein: 1, carbs: 23, fat: 0, amount: "1 ลูก" },
  { name: "โปรตีนเชค", calories: 130, protein: 25, carbs: 5, fat: 2, amount: "1 แก้ว" },
];

const MEAL_LABELS: Record<string, string> = {
  breakfast: "เช้า",
  lunch: "กลางวัน",
  dinner: "เย็น",
  snack: "ของว่าง",
};

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snack"] as const;

const ACTIVITY_LABELS = [
  "นั่งทำงาน (ไม่ค่อยขยับ)",
  "ออกกำลังเบา 1-3 วัน/สัปดาห์",
  "ออกกำลังปานกลาง 3-5 วัน/สัปดาห์",
  "ออกกำลังหนัก 6-7 วัน/สัปดาห์",
  "นักกีฬา / ออกหนักมาก",
];

// ---- Add food modal ----
function AddFoodModal({
  date,
  onClose,
  onAdded,
}: {
  date: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("snack");
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"search" | "custom">("search");
  const [query, setQuery] = useState("");

  const filtered = FOOD_PRESETS.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );

  function fillPreset(p: (typeof FOOD_PRESETS)[0]) {
    setName(p.name);
    setCalories(String(p.calories));
    setProtein(String(p.protein));
    setCarbs(String(p.carbs));
    setFat(String(p.fat));
    setAmount(p.amount);
    setTab("custom");
  }

  async function save() {
    if (!name.trim() || !calories) return;
    setSaving(true);
    await fetch("/api/food", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        mealType,
        name: name.trim(),
        calories: Number(calories),
        protein: protein ? Number(protein) : undefined,
        carbs: carbs ? Number(carbs) : undefined,
        fat: fat ? Number(fat) : undefined,
        amount: amount.trim() || undefined,
      }),
    });
    setSaving(false);
    onAdded();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <h2 className="font-bold text-slate-800">เพิ่มอาหาร</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 shrink-0">
          {(["search", "custom"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === t
                  ? "text-sky-600 border-b-2 border-sky-500"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {t === "search" ? "เลือกจากรายการ" : "กรอกเอง"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === "search" ? (
            <div className="p-4 space-y-3">
              <input
                className="input w-full"
                placeholder="ค้นหาอาหาร..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="space-y-1">
                {filtered.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => fillPreset(f)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 text-left transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">{f.name}</p>
                      <p className="text-xs text-slate-400">{f.amount}</p>
                    </div>
                    <span className="text-sm font-bold text-orange-500 shrink-0 ml-3">
                      {f.calories} kcal
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Meal type */}
              <div className="grid grid-cols-4 gap-2">
                {MEAL_ORDER.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMealType(m)}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      mealType === m
                        ? "bg-sky-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {MEAL_LABELS[m]}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500">ชื่ออาหาร *</label>
                <input
                  className="input w-full mt-1"
                  placeholder="เช่น ข้าวมันไก่"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500">แคลอรี (kcal) *</label>
                  <input
                    className="input w-full mt-1"
                    type="number"
                    placeholder="420"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">ปริมาณ</label>
                  <input
                    className="input w-full mt-1"
                    placeholder="1 จาน"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500">โปรตีน (g)</label>
                  <input
                    className="input w-full mt-1"
                    type="number"
                    placeholder="0"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">คาร์บ (g)</label>
                  <input
                    className="input w-full mt-1"
                    type="number"
                    placeholder="0"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">ไขมัน (g)</label>
                  <input
                    className="input w-full mt-1"
                    type="number"
                    placeholder="0"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {tab === "custom" && (
          <div className="p-4 border-t border-slate-100 shrink-0">
            <button
              onClick={save}
              disabled={!name.trim() || !calories || saving}
              className="btn-primary w-full"
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Calorie ring ----
function CalorieRing({
  eaten,
  burned,
  target,
}: {
  eaten: number;
  burned: number;
  target: number;
}) {
  const remaining = Math.max(0, target - eaten + burned);
  const net = eaten - burned;
  const pct = Math.min(1, net / target);
  const R = 60;
  const C = 2 * Math.PI * R;
  const filled = pct * C;
  const overEaten = net > target;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Ring */}
      <div className="relative shrink-0">
        <svg viewBox="0 0 160 160" className="w-36 h-36">
          <circle cx="80" cy="80" r={R} fill="none" stroke="#f1f5f9" strokeWidth={20} />
          <circle
            cx="80"
            cy="80"
            r={R}
            fill="none"
            stroke={overEaten ? "#ef4444" : "#f97316"}
            strokeWidth={20}
            strokeDasharray={`${filled} ${C}`}
            strokeDashoffset={C / 4}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-800 leading-none tabular-nums">
            {remaining.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 font-medium">kcal เหลือ</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 flex-1 w-full">
        <div className="text-center">
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">เป้าหมาย</p>
          <p className="text-xl font-bold text-slate-800 tabular-nums">{target.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400">kcal</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-orange-400 font-medium uppercase tracking-wide">กิน</p>
          <p className="text-xl font-bold text-orange-500 tabular-nums">{eaten.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400">kcal</p>
        </div>
        <div className="text-center">
          <p className="text-[11px] text-sky-400 font-medium uppercase tracking-wide">เผาผลาญ</p>
          <p className="text-xl font-bold text-sky-500 tabular-nums">{burned.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400">kcal</p>
        </div>
      </div>
    </div>
  );
}

// ---- Macro bars ----
function MacroBars({
  protein,
  carbs,
  fat,
  targetProtein,
  targetCarbs,
  targetFat,
}: {
  protein: number;
  carbs: number;
  fat: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}) {
  const bars = [
    { label: "โปรตีน", value: protein, target: targetProtein, color: "#3b82f6", Icon: Beef },
    { label: "คาร์บ", value: carbs, target: targetCarbs, color: "#f59e0b", Icon: Wheat },
    { label: "ไขมัน", value: fat, target: targetFat, color: "#10b981", Icon: Droplets },
  ];

  return (
    <div className="space-y-3">
      {bars.map(({ label, value, target, color, Icon }) => {
        const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
        return (
          <div key={label}>
            <div className="flex items-center gap-2 mb-1">
              <Icon size={13} style={{ color }} />
              <span className="text-xs font-medium text-slate-600 flex-1">{label}</span>
              <span className="text-xs text-slate-500 tabular-nums">
                {value}g / {target}g
              </span>
              <span className="text-xs font-semibold tabular-nums" style={{ color }}>
                {pct}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Plan selector card ----
function PlanSelector({
  value,
  onChange,
}: {
  value: DietPlan;
  onChange: (p: DietPlan) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {(Object.keys(DIET_PLANS) as DietPlan[]).map((plan) => {
        const cfg = DIET_PLANS[plan];
        const active = value === plan;
        return (
          <button
            key={plan}
            onClick={() => onChange(plan)}
            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border-2 transition-all ${
              active
                ? `${cfg.bg} ${cfg.border} shadow-sm`
                : "bg-white border-slate-100 hover:border-slate-200"
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full`}
              style={{ backgroundColor: cfg.dot }}
            />
            <span
              className={`text-sm font-bold ${active ? cfg.color : "text-slate-600"}`}
            >
              {cfg.label}
            </span>
            <span className={`text-[10px] font-medium ${active ? cfg.color : "text-slate-400"}`}>
              {cfg.labelTh}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---- Activity level picker inside settings ----
function ActivityPicker({
  value,
  onChange,
}: {
  value: 1 | 2 | 3 | 4 | 5;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
}) {
  return (
    <div className="space-y-1.5">
      {ACTIVITY_LABELS.map((label, i) => {
        const v = (i + 1) as 1 | 2 | 3 | 4 | 5;
        return (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
              value === v
                ? "bg-sky-50 text-sky-700 font-medium border border-sky-200"
                : "hover:bg-slate-50 text-slate-600"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ---- Main page ----
export default function NutritionPage() {
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().split("T")[0]);
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [profile, setProfile] = useState<Profile>({});
  const [activityLevel, setActivityLevel] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [dietPlan, setDietPlan] = useState<DietPlan>("maintenance");
  const [burnedToday, setBurnedToday] = useState(0);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/food?date=${dateStr}`);
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries ?? []);
    }
    setLoading(false);
  }, [dateStr]);

  // Load profile for TDEE
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.profile) setProfile(d.profile);
      });
  }, []);

  // Load burned calories from workouts today
  useEffect(() => {
    fetch("/api/workouts")
      .then((r) => (r.ok ? r.json() : { workouts: [] }))
      .then((d) => {
        const todayBurned = (d.workouts ?? [])
          .filter((w: { date: string; calories: number }) => w.date === dateStr)
          .reduce((s: number, w: { calories: number }) => s + (w.calories ?? 0), 0);
        setBurnedToday(todayBurned);
      });
  }, [dateStr]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Restore settings from localStorage
  useEffect(() => {
    const savedActivity = localStorage.getItem("nutrition_activity");
    if (savedActivity) setActivityLevel(Number(savedActivity) as 1 | 2 | 3 | 4 | 5);
    const savedPlan = localStorage.getItem("nutrition_plan") as DietPlan | null;
    if (savedPlan && savedPlan in DIET_PLANS) setDietPlan(savedPlan);
  }, []);

  const saveActivityLevel = (v: 1 | 2 | 3 | 4 | 5) => {
    setActivityLevel(v);
    localStorage.setItem("nutrition_activity", String(v));
  };

  const saveDietPlan = (p: DietPlan) => {
    setDietPlan(p);
    localStorage.setItem("nutrition_plan", p);
  };

  // Totals
  const totalCalories = entries.reduce((s, e) => s + e.calories, 0);
  const totalProtein = entries.reduce((s, e) => s + (e.protein ?? 0), 0);
  const totalCarbs = entries.reduce((s, e) => s + (e.carbs ?? 0), 0);
  const totalFat = entries.reduce((s, e) => s + (e.fat ?? 0), 0);

  // TDEE
  const tdee =
    profile.weight && profile.height && profile.age && profile.gender
      ? calcTDEE(profile.weight, profile.height, profile.age, profile.gender, activityLevel)
      : 2000;

  // Diet plan target
  const planCfg = DIET_PLANS[dietPlan];
  const calorieTarget = tdee + planCfg.calAdj;

  // Macro targets based on plan ratios
  const targetProtein = Math.round((calorieTarget * planCfg.macros.protein) / 4);
  const targetCarbs = Math.round((calorieTarget * planCfg.macros.carbs) / 4);
  const targetFat = Math.round((calorieTarget * planCfg.macros.fat) / 9);

  function shiftDate(days: number) {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + days);
    setDateStr(d.toISOString().split("T")[0]);
  }

  const isToday = dateStr === new Date().toISOString().split("T")[0];

  async function deleteEntry(id: string) {
    await fetch(`/api/food/${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e._id !== id));
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
    <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UtensilsCrossed size={20} className="text-orange-500" />
          <h1 className="text-xl font-bold text-slate-800">โภชนาการ</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ตั้งค่า TDEE
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors"
          >
            <Plus size={15} />
            เพิ่มอาหาร
          </button>
        </div>
      </div>

      {/* Diet plan selector */}
      <div className="card p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          เป้าหมายอาหาร
        </p>
        <PlanSelector value={dietPlan} onChange={saveDietPlan} />
        <p className="text-[11px] text-slate-400 text-center mt-3">
          {planCfg.desc}
        </p>
      </div>

      {/* Date picker */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => shiftDate(-1)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
          <ChevronLeft size={18} className="text-slate-500" />
        </button>
        <div className="text-center">
          <p className="font-semibold text-slate-800">
            {isToday
              ? "วันนี้"
              : new Date(dateStr + "T00:00:00").toLocaleDateString("th-TH", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
          </p>
          <p className="text-xs text-slate-400">{dateStr}</p>
        </div>
        <button
          onClick={() => shiftDate(1)}
          disabled={isToday}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-30"
        >
          <ChevronRight size={18} className="text-slate-500" />
        </button>
      </div>

      {/* Calorie balance card */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Flame size={16} className="text-orange-400" />
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">สมดุลแคลอรี</h2>
        </div>
        <CalorieRing eaten={totalCalories} burned={burnedToday} target={calorieTarget} />
      </div>

      {/* Macro breakdown */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
          สัดส่วนสารอาหาร
        </h2>
        <MacroBars
          protein={totalProtein}
          carbs={totalCarbs}
          fat={totalFat}
          targetProtein={targetProtein}
          targetCarbs={targetCarbs}
          targetFat={targetFat}
        />
        <p className="text-[10px] text-slate-400 mt-3 text-center">
          เป้าหมาย {planCfg.label}: {calorieTarget.toLocaleString()} kcal/วัน
          {planCfg.calAdj !== 0 && (
            <span className={planCfg.calAdj < 0 ? "text-sky-400" : "text-amber-400"}>
              {" "}(TDEE {planCfg.calAdj > 0 ? "+" : ""}{planCfg.calAdj})
            </span>
          )}
          {!profile.weight && " · ค่าเริ่มต้น — กรอกใน Profile"}
        </p>
      </div>

      {/* Meal sections */}
      {loading ? (
        <div className="text-center text-slate-400 py-8">กำลังโหลด...</div>
      ) : (
        MEAL_ORDER.map((meal) => {
          const mealEntries = entries.filter((e) => e.mealType === meal);
          const mealCal = mealEntries.reduce((s, e) => s + e.calories, 0);
          return (
            <div key={meal} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-700 text-sm">
                  {MEAL_LABELS[meal]}
                </h3>
                {mealCal > 0 && (
                  <span className="text-xs font-bold text-orange-500 tabular-nums">
                    {mealCal} kcal
                  </span>
                )}
              </div>
              {mealEntries.length === 0 ? (
                <p className="text-xs text-slate-300 text-center py-2">ยังไม่มีรายการ</p>
              ) : (
                <div className="space-y-1">
                  {mealEntries.map((e) => (
                    <div
                      key={e._id}
                      className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{e.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {e.amount && `${e.amount} · `}
                          {e.protein != null && `P${e.protein}g `}
                          {e.carbs != null && `C${e.carbs}g `}
                          {e.fat != null && `F${e.fat}g`}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-orange-500 shrink-0 tabular-nums">
                        {e.calories}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">kcal</span>
                      <button
                        onClick={() => deleteEntry(e._id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Total row */}
      {entries.length > 0 && (
        <div className="card p-4 flex items-center justify-between bg-orange-50 border-orange-100">
          <span className="font-semibold text-slate-700">รวมทั้งวัน</span>
          <span className="text-xl font-bold text-orange-600 tabular-nums">
            {totalCalories.toLocaleString()} kcal
          </span>
        </div>
      )}

      {/* Add food modal */}
      {showAdd && (
        <AddFoodModal
          date={dateStr}
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false);
            fetchEntries();
          }}
        />
      )}

      {/* TDEE settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">ระดับกิจกรรม</h2>
              <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-500 mb-3">
                ใช้คำนวณ TDEE (แคลอรีที่ต้องการต่อวัน) ร่วมกับน้ำหนัก/ส่วนสูง/อายุใน Profile
              </p>
              <ActivityPicker value={activityLevel} onChange={saveActivityLevel} />
              <div className="mt-4 p-3 bg-slate-50 rounded-xl text-center">
                <p className="text-xs text-slate-500">TDEE ของคุณ</p>
                <p className="text-2xl font-bold text-slate-800">{tdee.toLocaleString()}</p>
                <p className="text-xs text-slate-400">kcal/วัน</p>
                {planCfg.calAdj !== 0 && (
                  <p className={`text-xs font-semibold mt-1 ${planCfg.color}`}>
                    เป้า {planCfg.label}: {calorieTarget.toLocaleString()} kcal
                  </p>
                )}
              </div>
            </div>
            <div className="px-4 pb-4">
              <button onClick={() => setShowSettings(false)} className="btn-primary w-full">
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
