"use client";

import { useState } from "react";
import { PlusCircle, ChevronDown, Plus, Trash2, Dumbbell } from "lucide-react";
import { WorkoutType, WorkoutEntry, SetEntry } from "@/lib/types";
import { calcCalories, genId, ALL_TYPES, localDate } from "@/lib/utils";

interface Props {
  onSave: (entry: WorkoutEntry) => Promise<void>;
  userWeightKg?: number;
}

const DEFAULT_TYPE: WorkoutType = "Running";

export default function WorkoutForm({ onSave, userWeightKg }: Props) {
  const [type, setType] = useState<WorkoutType>(DEFAULT_TYPE);
  const [date, setDate] = useState(localDate());
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState<{ reps: string; weight: string }[]>([
    { reps: "", weight: "" },
  ]);

  const [distance, setDistance] = useState("");
  const [pace, setPace] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isWeightT = type === "Weight Training";
  const isCardio = type === "Running" || type === "Cycling";

  function addSet() {
    setSets((prev) => [...prev, { reps: "", weight: "" }]);
  }

  function updateSet(i: number, field: "reps" | "weight", val: string) {
    setSets((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: val } : s))
    );
  }

  function removeSet(i: number) {
    if (sets.length === 1) return;
    setSets((prev) => prev.filter((_, idx) => idx !== i));
  }

  function resetForm() {
    setDuration("");
    setNotes("");
    setExerciseName("");
    setSets([{ reps: "", weight: "" }]);
    setDistance("");
    setPace("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const dur = Number(duration);
    if (!dur || dur <= 0) return;

    let details: WorkoutEntry["details"];
    if (isWeightT) {
      const parsedSets: SetEntry[] = sets
        .filter((s) => s.reps || s.weight)
        .map((s) => ({
          reps: Number(s.reps) || 0,
          weight: Number(s.weight) || 0,
        }));
      details = {
        exerciseName: exerciseName.trim() || undefined,
        sets: parsedSets,
      };
    } else if (isCardio) {
      details = { distance: Number(distance) || 0, pace: pace.trim() };
    }

    const entry: WorkoutEntry = {
      id: genId(),
      date,
      type,
      duration: dur,
      calories: calcCalories(type, dur, userWeightKg),
      notes: notes.trim() || undefined,
      details,
    };

    setSaving(true);
    try {
      await onSave(entry);
      setSaved(true);
      resetForm();
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6 max-w-xl mx-auto">
      <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
        <PlusCircle size={20} className="text-sky-500" />
        เพิ่มกิจกรรม
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">วันที่</label>
            <input
              type="date"
              className="input"
              value={date}
              max={localDate()}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">ระยะเวลา (นาที)</label>
            <input
              type="number"
              className="input"
              placeholder="30"
              min={1}
              max={600}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="label">ประเภทกิจกรรม</label>
          <div className="relative">
            <select
              className="input appearance-none pr-10 cursor-pointer"
              value={type}
              onChange={(e) => setType(e.target.value as WorkoutType)}
            >
              {ALL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        {duration && (
          <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-2 text-sm text-sky-700 font-medium flex items-center justify-between">
            <span>
              ประมาณการแคลอรี: ~{calcCalories(type, Number(duration), userWeightKg)} kcal
            </span>
            {!userWeightKg && (
              <span className="text-xs text-sky-400 font-normal">(ใช้ค่าเริ่มต้น 70 kg)</span>
            )}
          </div>
        )}

        {isWeightT && (
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Dumbbell size={15} className="text-violet-500" />
              <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide">
                Weight Training Details
              </p>
            </div>

            <div>
              <label className="label">ชื่อท่า / กลุ่มกล้ามเนื้อ (ไม่บังคับ)</label>
              <input
                type="text"
                className="input"
                placeholder="เช่น Bench Press, Squat..."
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
              />
            </div>

            <div>
              <div className="grid grid-cols-[32px_1fr_1fr_32px] gap-2 mb-1.5">
                <span className="text-xs font-medium text-slate-500 text-center">Set</span>
                <span className="text-xs font-medium text-slate-500 text-center">Reps</span>
                <span className="text-xs font-medium text-slate-500 text-center">kg</span>
                <span />
              </div>

              <div className="space-y-2">
                {sets.map((s, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[32px_1fr_1fr_32px] gap-2 items-center"
                  >
                    <span className="text-xs font-bold text-violet-500 text-center">
                      {i + 1}
                    </span>
                    <input
                      type="number"
                      className="input text-center py-2 text-sm"
                      placeholder="10"
                      min={1}
                      value={s.reps}
                      onChange={(e) => updateSet(i, "reps", e.target.value)}
                    />
                    <input
                      type="number"
                      className="input text-center py-2 text-sm"
                      placeholder="60"
                      min={0}
                      step={0.5}
                      value={s.weight}
                      onChange={(e) => updateSet(i, "weight", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeSet(i)}
                      disabled={sets.length === 1}
                      className="text-slate-300 hover:text-red-400 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addSet}
                className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
              >
                <Plus size={14} />
                เพิ่มเซ็ต
              </button>
            </div>
          </div>
        )}

        {isCardio && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
              Cardio Details
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Distance (km)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="5.0"
                  min={0}
                  step={0.1}
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Pace (min/km)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="5:30"
                  value={pace}
                  onChange={(e) => setPace(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="label">หมายเหตุ (ไม่บังคับ)</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="เพิ่มโน้ตสั้นๆ..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className={`btn-primary w-full flex items-center justify-center gap-2 ${
            saved ? "!bg-emerald-500" : ""
          }`}
        >
          {saved ? (
            "บันทึกสำเร็จ!"
          ) : saving ? (
            "กำลังบันทึก..."
          ) : (
            <>
              <PlusCircle size={18} />
              บันทึกกิจกรรม
            </>
          )}
        </button>
      </form>
    </div>
  );
}
