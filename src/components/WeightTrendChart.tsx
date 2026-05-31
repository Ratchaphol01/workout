"use client";

interface WeightPoint {
  date: string;   // "YYYY-MM-DD"
  weightKg: number;
}

interface Props {
  logs: WeightPoint[];
  days?: number; // how many days to show (default 28)
}

export default function WeightTrendChart({ logs, days = 28 }: Props) {
  // Build a map date→weight from logs
  const byDate: Record<string, number> = {};
  logs.forEach((l) => { byDate[l.date] = l.weightKg; });

  // Build series: last `days` dates, fill missing with null
  const series: { date: string; label: string; w: number | null }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split("T")[0];
    const label = i === 0 ? "วันนี้" : d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
    series.push({ date, label, w: byDate[date] ?? null });
  }

  const recorded = series.filter((s) => s.w !== null) as { date: string; label: string; w: number }[];
  if (recorded.length < 2) return null;

  const weights = recorded.map((p) => p.w);
  const minW = Math.floor(Math.min(...weights) - 1);
  const maxW = Math.ceil(Math.max(...weights) + 1);
  const range = maxW - minW || 1;

  const W = 600;
  const H = 200;
  const PAD = { top: 24, right: 20, bottom: 40, left: 48 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // X position: spread across full width using actual date index
  const totalDays = days - 1;
  function xPos(date: string) {
    const idx = series.findIndex((s) => s.date === date);
    return PAD.left + (idx / totalDays) * chartW;
  }
  function yPos(w: number) {
    return PAD.top + chartH - ((w - minW) / range) * chartH;
  }

  const pathD = recorded.map((p, i) => `${i === 0 ? "M" : "L"} ${xPos(p.date)} ${yPos(p.w)}`).join(" ");
  const areaD = pathD +
    ` L ${xPos(recorded[recorded.length - 1].date)} ${PAD.top + chartH}` +
    ` L ${xPos(recorded[0].date)} ${PAD.top + chartH} Z`;

  // X-axis tick labels: show every 7th day + today
  const tickDates = series.filter((_, i) => i % 7 === 0 || i === series.length - 1);

  // Y axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    val: (minW + t * range).toFixed(1),
    y: PAD.top + chartH - t * chartH,
  }));

  // Weekly average lines
  const weekAvgs: { x: number; avg: number }[] = [];
  for (let w = 0; w < Math.ceil(days / 7); w++) {
    const start = w * 7;
    const slice = series.slice(start, start + 7).filter((s) => s.w !== null) as { date: string; w: number }[];
    if (slice.length === 0) continue;
    const avg = slice.reduce((s, p) => s + p.w, 0) / slice.length;
    const midIdx = start + Math.floor(slice.length / 2);
    const midDate = series[Math.min(midIdx, series.length - 1)].date;
    weekAvgs.push({ x: xPos(midDate), avg });
  }

  const trend = recorded.length >= 2
    ? recorded[recorded.length - 1].w - recorded[0].w
    : 0;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 300 }}>
        <defs>
          <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid + Y labels */}
        {yTicks.map((t) => (
          <g key={t.val}>
            <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PAD.left - 6} y={t.y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{t.val}</text>
          </g>
        ))}

        {/* Area + Line */}
        <path d={areaD} fill="url(#weightGrad)" />
        <path d={pathD} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points (only recorded days) */}
        {recorded.map((p) => {
          const isToday = p.date === new Date().toISOString().split("T")[0];
          return (
            <g key={p.date}>
              <circle
                cx={xPos(p.date)} cy={yPos(p.w)} r={isToday ? 5 : 3.5}
                fill={isToday ? "#7c3aed" : "#8b5cf6"}
                stroke="white" strokeWidth="1.5"
              />
              {isToday && (
                <text x={xPos(p.date)} y={yPos(p.w) - 9} textAnchor="middle" fontSize="10" fill="#7c3aed" fontWeight="700">
                  {p.w}
                </text>
              )}
            </g>
          );
        })}

        {/* Weekly avg dots */}
        {weekAvgs.map((wa, i) => (
          <g key={i}>
            <circle cx={wa.x} cy={yPos(wa.avg)} r={5} fill="none" stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="3 2" />
            <text x={wa.x} y={yPos(wa.avg) - 8} textAnchor="middle" fontSize="9" fill="#a78bfa">
              ~{wa.avg.toFixed(1)}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {tickDates.map((s) => (
          <text key={s.date} x={xPos(s.date)} y={PAD.top + chartH + 20} textAnchor="middle" fontSize="10" fill="#64748b">
            {s.label}
          </text>
        ))}

        {/* Trend arrow label */}
        <text x={W - PAD.right} y={PAD.top - 6} textAnchor="end" fontSize="11" fill={trend < 0 ? "#10b981" : trend > 0 ? "#f97316" : "#94a3b8"} fontWeight="700">
          {trend > 0 ? `▲ +${trend.toFixed(1)} kg` : trend < 0 ? `▼ ${trend.toFixed(1)} kg` : "— ไม่เปลี่ยน"}
        </text>
      </svg>
    </div>
  );
}
