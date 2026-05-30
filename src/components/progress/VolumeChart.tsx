"use client";

const MUSCLE_COLORS: Record<string, string> = {
  Chest: "#f43f5e",
  Back: "#0ea5e9",
  Shoulders: "#f59e0b",
  Biceps: "#8b5cf6",
  Triceps: "#a855f7",
  Legs: "#10b981",
  Core: "#f97316",
  "Full Body": "#64748b",
};

export interface WeekVolume {
  label: string;
  volumes: Record<string, number>;
}

interface Props {
  data: WeekVolume[];
}

export default function VolumeChart({ data }: Props) {
  const allMuscles = [
    ...new Set(data.flatMap((w) => Object.keys(w.volumes))),
  ];
  const totals = data.map((w) =>
    Object.values(w.volumes).reduce((s, v) => s + v, 0)
  );
  const maxVol = Math.max(...totals, 1);

  if (data.every((w) => Object.keys(w.volumes).length === 0)) {
    return (
      <p className="text-sm text-slate-400 text-center py-6">
        ยังไม่มีข้อมูล volume
      </p>
    );
  }

  return (
    <div>
      {/* Bar chart */}
      <div className="flex items-end gap-2 h-32">
        {data.map((week, i) => {
          const total = totals[i];
          const barH = total > 0 ? (total / maxVol) * 100 : 0;
          const muscles = allMuscles.filter((m) => week.volumes[m] > 0);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full relative" style={{ height: 112 }}>
                {total > 0 && (
                  <div
                    className="absolute bottom-0 w-full rounded-t-md overflow-hidden flex flex-col-reverse"
                    style={{ height: `${barH}%`, minHeight: 4 }}
                  >
                    {muscles.map((muscle) => {
                      const segPct = (week.volumes[muscle] / total) * 100;
                      return (
                        <div
                          key={muscle}
                          style={{
                            height: `${segPct}%`,
                            backgroundColor:
                              MUSCLE_COLORS[muscle] ?? "#94a3b8",
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                {week.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {allMuscles.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4">
          {allMuscles.map((muscle) => (
            <div key={muscle} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: MUSCLE_COLORS[muscle] ?? "#94a3b8",
                }}
              />
              <span className="text-xs text-slate-600">{muscle}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
