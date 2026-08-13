import { useId, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScreenshotActivityPoint } from "@/types";
import "./chart-theme.css";

const WIDTH = 640;
const HEIGHT = 200;
const MARGIN = { top: 8, right: 8, bottom: 24, left: 28 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;

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

interface ScreenshotActivityChartProps {
  data: ScreenshotActivityPoint[] | null | undefined;
  loading?: boolean;
}

export function ScreenshotActivityChart({ data, loading }: ScreenshotActivityChartProps) {
  const gradientId = useId();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const points = data ?? [];
  const hasData = points.some((p) => p.count > 0);
  const maxCount = useMemo(
    () => niceMax(Math.max(0, ...points.map((p) => p.count))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );

  const stepX = points.length > 1 ? PLOT_W / (points.length - 1) : 0;
  const xFor = (i: number) => (points.length > 1 ? i * stepX : PLOT_W / 2);
  const yFor = (v: number) => PLOT_H - (v / maxCount) * PLOT_H;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${xFor(i)},${yFor(p.count)}`).join(" ");
  const areaPath = `${linePath} L${xFor(points.length - 1)},${PLOT_H} L${xFor(0)},${PLOT_H} Z`;

  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((maxCount / 4) * i));

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH - MARGIN.left;
    const idx = Math.round(relX / (stepX || 1));
    setHoverIndex(Math.max(0, Math.min(points.length - 1, idx)));
  }

  const hovered = hoverIndex != null ? points[hoverIndex] : null;

  return (
    <Card className="viz-root">
      <CardHeader>
        <CardTitle>Screenshot Activity</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">Screenshots captured per day, all employees.</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !hasData ? (
          <p className="text-sm text-muted-foreground">No screenshots captured in this period yet.</p>
        ) : (
          <div className="relative">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="w-full"
              role="img"
              aria-label="Screenshot activity — line chart of screenshots captured per day"
              onMouseMove={handleMove}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--viz-series-1)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--viz-series-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
                {yTicks.map((tick) => {
                  const y = yFor(tick);
                  return (
                    <g key={tick}>
                      <line x1={0} x2={PLOT_W} y1={y} y2={y} stroke="var(--viz-grid)" strokeWidth={1} />
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
                <line x1={0} x2={PLOT_W} y1={PLOT_H} y2={PLOT_H} stroke="var(--viz-baseline)" strokeWidth={1} />

                <path d={areaPath} fill={`url(#${gradientId})`} />
                <path d={linePath} fill="none" stroke="var(--viz-series-1)" strokeWidth={2} strokeLinejoin="round" />

                {points.map((p, i) => (
                  <text
                    key={p.date}
                    x={xFor(i)}
                    y={PLOT_H + 16}
                    textAnchor="middle"
                    fontSize={10}
                    fill="var(--viz-text-secondary)"
                  >
                    {i % Math.ceil(points.length / 7 || 1) === 0 ? shortDayLabel(p.date) : ""}
                  </text>
                ))}

                {hoverIndex != null && (
                  <line
                    x1={xFor(hoverIndex)}
                    x2={xFor(hoverIndex)}
                    y1={0}
                    y2={PLOT_H}
                    stroke="var(--viz-baseline)"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                  />
                )}
                {hovered && (
                  <circle
                    cx={xFor(hoverIndex!)}
                    cy={yFor(hovered.count)}
                    r={4}
                    fill="var(--viz-series-1)"
                    stroke="var(--viz-tooltip-bg)"
                    strokeWidth={2}
                  />
                )}
              </g>
            </svg>

            {hovered && (
              <div
                className="pointer-events-none absolute top-0 rounded-md border px-2.5 py-1.5 text-xs shadow-sm"
                style={{
                  left: `${((MARGIN.left + xFor(hoverIndex!)) / WIDTH) * 100}%`,
                  transform: "translate(-50%, -4px)",
                  backgroundColor: "var(--viz-tooltip-bg)",
                  borderColor: "var(--viz-tooltip-border)",
                  color: "var(--viz-text-primary)",
                }}
              >
                <div className="font-medium">{shortDayLabel(hovered.date)}</div>
                <div className="text-muted-foreground">{hovered.count} screenshot{hovered.count === 1 ? "" : "s"}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
