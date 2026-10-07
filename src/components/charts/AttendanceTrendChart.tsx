import { useId, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AttendanceTrendPoint } from "@/types";
import "./chart-theme.css";

const WIDTH = 640;
const HEIGHT = 220;
const MARGIN = { top: 8, right: 8, bottom: 24, left: 28 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;

const SEGMENTS = [
  { key: "present" as const, label: "Present", color: "var(--viz-good)" },
  { key: "late" as const, label: "Late", color: "var(--viz-warning)" },
  { key: "absent" as const, label: "Absent", color: "var(--viz-critical)" },
];

function shortDayLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function niceMax(value: number): number {
  if (value <= 0) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const candidates = [1, 2, 2.5, 5, 10].map((m) => m * pow);
  return candidates.find((c) => c >= value) ?? value;
}

interface AttendanceTrendChartProps {
  data: AttendanceTrendPoint[] | null | undefined;
  loading?: boolean;
  title?: string;
  description?: string;
}

export function AttendanceTrendChart({
  data,
  loading,
  title = "Attendance Trend",
  description,
}: AttendanceTrendChartProps) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const points = data ?? [];
  const hasData = points.some((p) => p.present + p.late + p.absent + p.onLeave + p.halfDay > 0);

  const maxTotal = useMemo(() => {
    const totals = points.map((p) => p.present + p.late + p.absent);
    return niceMax(Math.max(0, ...totals));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const barSlot = points.length > 0 ? PLOT_W / points.length : 0;
  const barWidth = Math.max(4, Math.min(28, barSlot * 0.55));

  const gridTicks = 4;
  const yTicks = Array.from({ length: gridTicks + 1 }, (_, i) => Math.round((maxTotal / gridTicks) * i));

  const hovered = hoverIndex != null ? points[hoverIndex] : null;

  return (
    <Card className="viz-root">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div className="min-w-0 flex-1 basis-56">
          <CardTitle>{title}</CardTitle>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowTable((v) => !v)}
        >
          {showTable ? "Chart" : "Table"}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !hasData ? (
          <p className="text-sm text-muted-foreground">No attendance data for this period yet.</p>
        ) : showTable ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-1.5 pr-4 font-medium">Date</th>
                  <th className="py-1.5 pr-4 font-medium">Present</th>
                  <th className="py-1.5 pr-4 font-medium">Late</th>
                  <th className="py-1.5 pr-4 font-medium">Absent</th>
                  <th className="py-1.5 pr-4 font-medium">On leave</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.date} className="border-b last:border-0">
                    <td className="py-1.5 pr-4">{shortDayLabel(p.date)}</td>
                    <td className="py-1.5 pr-4">{p.present}</td>
                    <td className="py-1.5 pr-4">{p.late}</td>
                    <td className="py-1.5 pr-4">{p.absent}</td>
                    <td className="py-1.5 pr-4">{p.onLeave}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-4">
              {SEGMENTS.map((s) => (
                <div key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: s.color }}
                    aria-hidden
                  />
                  {s.label}
                </div>
              ))}
            </div>

            <div className="relative">
              <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className="w-full"
                role="img"
                aria-label={`${title} — stacked bar chart of present, late, and absent counts per day`}
              >
                <defs>
                  <clipPath id={gradientId}>
                    <rect x={0} y={0} width={WIDTH} height={HEIGHT} />
                  </clipPath>
                </defs>
                <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                  {yTicks.map((tick) => {
                    const y = PLOT_H - (tick / maxTotal) * PLOT_H;
                    return (
                      <g key={tick}>
                        <line
                          x1={0}
                          x2={PLOT_W}
                          y1={y}
                          y2={y}
                          stroke="var(--viz-grid)"
                          strokeWidth={1}
                        />
                        <text
                          x={-6}
                          y={y}
                          textAnchor="end"
                          dominantBaseline="middle"
                          fontSize={10}
                          fill="var(--viz-text-secondary)"
                        >
                          {tick}
                        </text>
                      </g>
                    );
                  })}
                  <line
                    x1={0}
                    x2={PLOT_W}
                    y1={PLOT_H}
                    y2={PLOT_H}
                    stroke="var(--viz-baseline)"
                    strokeWidth={1}
                  />

                  {points.map((p, i) => {
                    const slotX = i * barSlot + (barSlot - barWidth) / 2;
                    let cursorY = PLOT_H;
                    const isHovered = hoverIndex === i;

                    return (
                      <g
                        key={p.date}
                        onMouseEnter={() => setHoverIndex(i)}
                        onMouseLeave={() => setHoverIndex((cur) => (cur === i ? null : cur))}
                        style={{ cursor: "pointer" }}
                      >
                        <rect
                          x={slotX - 3}
                          y={0}
                          width={barWidth + 6}
                          height={PLOT_H}
                          fill="transparent"
                        />
                        {SEGMENTS.map((s) => {
                          const value = p[s.key];
                          if (value <= 0) return null;
                          const segHeight = (value / maxTotal) * PLOT_H;
                          const y = cursorY - segHeight;
                          cursorY = y - 2; // 2px surface gap between stacked segments
                          return (
                            <motion.rect
                              key={s.key}
                              x={slotX}
                              y={y}
                              width={barWidth}
                              height={Math.max(0, segHeight)}
                              rx={2}
                              fill={s.color}
                              className="transition-opacity duration-150"
                              opacity={isHovered || hoverIndex === null ? 1 : 0.45}
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              transition={{ duration: 0.5, delay: i * 0.035, ease: [0.16, 1, 0.3, 1] }}
                              style={{ transformOrigin: "bottom", transformBox: "fill-box" }}
                            />
                          );
                        })}
                        {i % Math.ceil(points.length / 8 || 1) === 0 && (
                          <text
                            x={slotX + barWidth / 2}
                            y={PLOT_H + 16}
                            textAnchor="middle"
                            fontSize={10}
                            fill="var(--viz-text-secondary)"
                          >
                            {shortDayLabel(p.date)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>

              {hovered && (
                <div
                  className="pointer-events-none absolute top-0 rounded-md border px-2.5 py-1.5 text-xs shadow-sm"
                  style={{
                    left: `${((hoverIndex! + 0.5) / points.length) * 100}%`,
                    transform: "translate(-50%, -4px)",
                    backgroundColor: "var(--viz-tooltip-bg)",
                    borderColor: "var(--viz-tooltip-border)",
                    color: "var(--viz-text-primary)",
                  }}
                >
                  <div className="mb-1 font-medium">{shortDayLabel(hovered.date)}</div>
                  <div className="flex flex-col gap-0.5">
                    {SEGMENTS.map((s) => (
                      <div key={s.key} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: s.color }}
                            aria-hidden
                          />
                          {s.label}
                        </span>
                        <span className="font-medium">{hovered[s.key]}</span>
                      </div>
                    ))}
                    {hovered.onLeave > 0 && (
                      <div className="flex items-center justify-between gap-3 text-muted-foreground">
                        <span>On leave</span>
                        <span className="font-medium">{hovered.onLeave}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
