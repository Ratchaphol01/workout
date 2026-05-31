"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Scale, Check, TrendingDown, TrendingUp, Minus } from "lucide-react";

interface WeightLog {
  _id: string;
  date: string;
  weightKg: number;
}

interface Props {
  profileWeight?: number;   // fallback from profile
  onAvgWeightChange?: (avg: number) => void;
}

export default function WeightLogCard({ profileWeight, onAvgWeightChange }: Props) {
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const fetchLogs = useCallback(async () => {
    const res = await fetch("/api/weight?limit=14");
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs ?? []);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const todayLog = logs.find((l) => l.date === todayStr);
  const recent7 = logs.slice(0, 7);
  const avg7 = recent7.length > 0
    ? recent7.reduce((s, l) => s + l.weightKg, 0) / recent7.length
    : profileWeight;

  // Notify parent of average
  useEffect(() => {
    if (avg7 != null && onAvgWeightChange) onAvgWeightChange(avg7);
  }, [avg7, onAvgWeightChange]);

  const lastWeight = logs[1]?.weightKg ?? profileWeight;
  const todayWeight = todayLog?.weightKg;
  const diff = todayWeight != null && lastWeight != null ? todayWeight - lastWeight : null;

  // Sparkline data (last 7 days filled)
  const sparkData: (number | null)[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    sparkData.push(logs.find((l) => l.date === ds)?.weightKg ?? null);
  }
  const sparkMin = Math.min(...sparkData.filter((v): v is number => v !== null));
  const sparkMax = Math.max(...sparkData.filter((v): v is number => v !== null));
  const sparkRange = (sparkMax - sparkMin) || 1;

  async function handleSave() {
    const w = Number(inputVal);
    if (!w || w < 20 || w > 300) return;
    setSaving(true);
    const res = await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayStr, weightKg: w }),
    });
    if (res.ok) {
      setSaved(true);
      setInputVal("");
      await fetchLogs();
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Scale size={16} className="text-violet-500" />
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
          น้ำหนักวันนี้
        </h2>
        {avg7 != null && (
          <span className="ml-auto text-[10px] text-slate-400">
            เฉลี่ย 7 วัน:{" "}
            <span className="font-semibold text-slate-600">{avg7.toFixed(1)} kg</span>
          </span>
        )}
      </div>

      <div className="flex items-stretch gap-4">
        {/* Left: log input or today's value */}
        <div className="flex-1">
          {todayLog ? (
            <div className="flex items-end gap-3">
              <div>
                <p className="text-3xl font-bold text-violet-700 tabular-nums leading-none">
                  {todayLog.weightKg}
                </p>
                <p className="text-xs text-slate-400 mt-1">kg · บันทึกแล้ววันนี้</p>
              </div>
              {diff !== null && (
                <div className={`flex items-center gap-1 pb-1 text-sm font-semibold ${diff < 0 ? "text-emerald-500" : diff > 0 ? "text-orange-500" : "text-slate-400"}`}>
                  {diff < 0 ? <TrendingDown size={15} /> : diff > 0 ? <TrendingUp size={15} /> : <Minus size={15} />}
                  {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)} kg
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-amber-600 font-medium">
                ⏰ ยังไม่ได้บันทึกน้ำหนักวันนี้
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="input flex-1 text-lg font-bold"
                  placeholder={profileWeight ? String(profileWeight) : "70.0"}
                  step="0.1"
                  min={20}
                  max={300}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
                <button
                  onClick={handleSave}
                  disabled={!inputVal || saving || saved}
                  className={`px-3 rounded-xl font-semibold text-sm transition-colors shrink-0 ${
                    saved
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-violet-500 hover:bg-violet-600 text-white disabled:opacity-40"
                  }`}
                >
                  {saved ? <Check size={16} /> : saving ? "..." : "บันทึก"}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">หน่วย: กิโลกรัม</p>
            </div>
          )}
        </div>

        {/* Right: sparkline (last 7 days) */}
        {sparkData.some((v) => v !== null) && (
          <div className="shrink-0 w-28">
            <svg viewBox="0 0 112 44" className="w-full">
              {/* Connect recorded points */}
              {(() => {
                const pts = sparkData
                  .map((v, i) => v !== null ? { x: i * (112 / 6), y: 40 - ((v - sparkMin) / sparkRange) * 34 } : null);
                const lines: React.ReactElement[] = [];
                for (let i = 0; i < pts.length - 1; i++) {
                  if (pts[i] && pts[i + 1]) {
                    lines.push(
                      <line
                        key={i}
                        x1={pts[i]!.x} y1={pts[i]!.y}
                        x2={pts[i + 1]!.x} y2={pts[i + 1]!.y}
                        stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"
                      />
                    );
                  }
                }
                return lines;
              })()}
              {sparkData.map((v, i) =>
                v !== null ? (
                  <circle
                    key={i}
                    cx={i * (112 / 6)}
                    cy={40 - ((v - sparkMin) / sparkRange) * 34}
                    r={i === 6 ? 4 : 2.5}
                    fill={i === 6 ? "#7c3aed" : "#8b5cf6"}
                    stroke="white" strokeWidth="1"
                  />
                ) : null
              )}
            </svg>
            <p className="text-[9px] text-slate-400 text-center mt-0.5">7 วันที่ผ่านมา</p>
          </div>
        )}
      </div>
    </div>
  );
}
