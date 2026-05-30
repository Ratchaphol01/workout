"use client";

import { useState } from "react";
import { X, Scale } from "lucide-react";

interface Props {
  currentWeight?: number;
  onClose: () => void;
  onSave: (weight: number) => Promise<void>;
}

export default function WeightUpdateModal({
  currentWeight,
  onClose,
  onSave,
}: Props) {
  const [weight, setWeight] = useState(currentWeight?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const w = Number(weight);
    if (!w || w < 20 || w > 300) return;
    setSaving(true);
    try {
      await onSave(w);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card w-full max-w-xs p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Scale size={18} className="text-sky-500" />
            <h2 className="text-base font-bold text-slate-800">
              อัปเดตน้ำหนัก
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">น้ำหนักปัจจุบัน (kg)</label>
            <input
              type="number"
              className="input text-xl font-bold text-center py-3"
              placeholder="70.0"
              min={20}
              max={300}
              step={0.1}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              autoFocus
              required
            />
            {currentWeight && (
              <p className="text-xs text-slate-400 mt-1.5 text-center">
                น้ำหนักเดิม: {currentWeight} kg
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 text-sm"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 text-sm"
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
