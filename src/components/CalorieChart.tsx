"use client";

interface DataPoint {
  label: string;
  calories: number;
}

export default function CalorieChart({ data }: { data: DataPoint[] }) {
  const W = 600;
  const H = 180;
  const PAD = { top: 20, right: 20, bottom: 36, left: 44 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxCal = Math.max(...data.map((d) => d.calories), 100);
  const step = chartW / (data.length - 1);

  const points = data.map((d, i) => ({
    x: PAD.left + i * step,
    y: PAD.top + chartH - (d.calories / maxCal) * chartH,
    ...d,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaD =
    pathD +
    ` L ${points[points.length - 1].x} ${PAD.top + chartH}` +
    ` L ${points[0].x} ${PAD.top + chartH} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    val: Math.round(maxCal * t),
    y: PAD.top + chartH - t * chartH,
  }));

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: 320 }}
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((t) => (
          <g key={t.val}>
            <line
              x1={PAD.left}
              y1={t.y}
              x2={W - PAD.right}
              y2={t.y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 6}
              y={t.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="#94a3b8"
            >
              {t.val}
            </text>
          </g>
        ))}

        <path d={areaD} fill="url(#areaGrad)" />
        <path
          d={pathD}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p) => (
          <g key={p.label}>
            <circle cx={p.x} cy={p.y} r={4} fill="#0ea5e9" />
            {p.calories > 0 && (
              <text
                x={p.x}
                y={p.y - 9}
                textAnchor="middle"
                fontSize="10"
                fill="#0284c7"
                fontWeight="600"
              >
                {p.calories}
              </text>
            )}
            <text
              x={p.x}
              y={PAD.top + chartH + 18}
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
