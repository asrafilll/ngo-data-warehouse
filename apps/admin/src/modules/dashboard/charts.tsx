// Dependency-free SVG chart primitives for the dashboard (no recharts).
import { cn } from "@repo/ui/lib/utils";

export function Sparkline({
  data,
  className,
  stroke = "currentColor",
  fill,
  width = 120,
  height = 34,
}: {
  data: number[];
  className?: string;
  stroke?: string;
  fill?: string;
  width?: number;
  height?: number;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => [i * step, height - ((v - min) / span) * (height - 4) - 2]);
  const line = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${width} ${height} L0 ${height} Z`;
  return (
    <svg
      className={cn("overflow-visible", className)}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
    >
      <title>Tren data</title>
      {fill ? <path d={area} fill={fill} opacity={0.18} /> : null}
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
      />
    </svg>
  );
}

// Horizontal labeled bar list — the workhorse for count/value distributions.
export function BarList({
  items,
  format,
  color = "var(--color-primary)",
  track = "var(--color-muted)",
}: {
  items: Array<{ label: string; value: number; hint?: string }>;
  format?: (n: number) => string;
  color?: string;
  track?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="grid gap-2.5">
      {items.map((it) => (
        <div className="grid gap-1" key={it.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium">{it.label}</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">
              {format ? format(it.value) : it.value}
              {it.hint ? (
                <span className="ml-1 text-muted-foreground/70 text-xs">{it.hint}</span>
              ) : null}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full" style={{ background: track }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.max(4, (it.value / max) * 100)}%`, background: color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Donut({
  segments,
  size = 132,
  thickness = 16,
  children,
}: {
  segments: Array<{ value: number; color: string }>;
  size?: number;
  thickness?: number;
  children?: React.ReactNode;
}) {
  const total = segments.reduce((t, s) => t + s.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="relative grid place-items-center" style={{ height: size, width: size }}>
      <svg className="-rotate-90" height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
        <title>Komposisi data</title>
        {segments.map((s) => {
          const len = (s.value / total) * c;
          const segmentKey = `${s.color}-${s.value}-${offset}`;
          const el = (
            <circle
              cx={size / 2}
              cy={size / 2}
              fill="none"
              key={segmentKey}
              r={r}
              stroke={s.color}
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
              strokeWidth={thickness}
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      {children ? (
        <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
      ) : null}
    </div>
  );
}
