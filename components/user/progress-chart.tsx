"use client";

import { useMemo, useState } from "react";

// Item 9: filterable SVG progress charts (metric + range filter, no dependency).
export type MeasurePoint = { at: string; weightKg?: number | null; bodyFatPercent?: number | null; waistCm?: number | null; chestCm?: number | null };

const METRICS = [
  { key: "weightKg", label: "وزن (kg)", color: "#9e8cf6" },
  { key: "bodyFatPercent", label: "چربی بدن (٪)", color: "#ff7247" },
  { key: "waistCm", label: "کمر (cm)", color: "#72b7f2" },
  { key: "chestCm", label: "سینه (cm)", color: "#8ab741" },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

export function ProgressChart({ points }: { points: MeasurePoint[] }) {
  const [metric, setMetric] = useState<MetricKey>("weightKg");
  const [range, setRange] = useState<7 | 30 | 90 | 0>(0);
  // Snapshot "now" once per mount so the memoized filter stays a pure render computation.
  const [now] = useState(() => Date.now());
  const data = useMemo(() => {
    const cutoff = range ? now - range * 86_400_000 : 0;
    return points
      .filter((p) => Date.parse(p.at) >= cutoff && p[metric] !== null && p[metric] !== undefined)
      .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  }, [points, metric, range, now]);
  const color = METRICS.find((m) => m.key === metric)?.color || "#9e8cf6";
  const values = data.map((d) => Number(d[metric]));
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const span = max - min || 1;
  const W = 560, H = 180, PAD = 28;
  const path = values.map((v, i) => {
    const x = PAD + (i / Math.max(1, values.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((v - min) / span) * (H - PAD * 2);
    return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <section className="progress-chart" aria-label="نمودار پیشرفت">
      <div className="progress-chart__filters">
        <div role="tablist" aria-label="شاخص">
          {METRICS.map((m) => (
            <button key={m.key} role="tab" aria-selected={metric === m.key} className={metric === m.key ? "active" : ""} onClick={() => setMetric(m.key)}>{m.label}</button>
          ))}
        </div>
        <div role="tablist" aria-label="بازه زمانی">
          {[[0, "همه"], [7, "۷ روز"], [30, "۳۰ روز"], [90, "۹۰ روز"]].map(([v, label]) => (
            <button key={label} role="tab" aria-selected={range === v} className={range === v ? "active" : ""} onClick={() => setRange(v as 7 | 30 | 90 | 0)}>{label}</button>
          ))}
        </div>
      </div>
      {data.length < 2 ? (
        <p className="member-empty-line">برای رسم نمودار حداقل دو رکورد ثبت کنید.</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`نمودار ${metric}`}>
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={PAD} x2={W - PAD} y1={H * f} y2={H * f} stroke="currentColor" strokeOpacity="0.12" />
          ))}
          <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
          {values.map((v, i) => {
            const x = PAD + (i / Math.max(1, values.length - 1)) * (W - PAD * 2);
            const y = H - PAD - ((v - min) / span) * (H - PAD * 2);
            return <circle key={i} cx={x} cy={y} r="3.5" fill={color}><title>{`${v} — ${new Date(data[i].at).toLocaleDateString("fa-IR")}`}</title></circle>;
          })}
          <text x={PAD} y={H - 8} fontSize="11" fill="currentColor" opacity="0.7">{new Date(data[0].at).toLocaleDateString("fa-IR")}</text>
          <text x={W - PAD} y={H - 8} fontSize="11" fill="currentColor" opacity="0.7" textAnchor="end">{new Date(data[data.length - 1].at).toLocaleDateString("fa-IR")}</text>
        </svg>
      )}
    </section>
  );
}
