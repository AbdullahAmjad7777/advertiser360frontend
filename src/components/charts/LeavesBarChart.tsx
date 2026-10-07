import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PersonAttendanceStats } from "@/types";
import "./chart-theme.css";

// Leave = series blue, absent = the same critical red the trend chart uses
// for absences. Pair validated with the dataviz palette validator in light
// and dark modes.
const SEGMENTS = [
  { key: "leaveDays" as const, label: "Approved leave", color: "var(--viz-series-1)" },
  { key: "absentDays" as const, label: "Absent", color: "var(--viz-critical)" },
];

function niceMax(value: number): number {
  if (value <= 0) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const candidates = [1, 2, 2.5, 5, 10].map((m) => m * pow);
  return candidates.find((c) => c >= value) ?? value;
}

// One horizontal stacked bar per person, so leave + absence totals can be
// compared side by side. Horizontal keeps long names readable.
export function LeavesBarChart({
  data,
  loading,
  title = "Leaves & Absences",
  description,
}: {
  data: PersonAttendanceStats[] | null | undefined;
  loading?: boolean;
  title?: string;
  description?: string;
}) {
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const people = [...(data ?? [])].sort(
    (a, b) => b.leaveDays + b.absentDays - (a.leaveDays + a.absentDays),
  );
  const max = niceMax(Math.max(0, ...people.map((p) => p.leaveDays + p.absentDays)));

  return (
    <Card className="viz-root">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowTable((v) => !v)}>
          {showTable ? "Chart" : "Table"}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : people.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : showTable ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-1.5 pr-4 font-medium">Name</th>
                  <th className="py-1.5 pr-4 font-medium">Leave days</th>
                  <th className="py-1.5 pr-4 font-medium">Absent days</th>
                  <th className="py-1.5 pr-4 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p.employeeId} className="border-b last:border-0">
                    <td className="py-1.5 pr-4">{p.fullName}</td>
                    <td className="py-1.5 pr-4">{p.leaveDays}</td>
                    <td className="py-1.5 pr-4">{p.absentDays}</td>
                    <td className="py-1.5 pr-4 font-medium">{p.leaveDays + p.absentDays}</td>
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
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                  {s.label}
                </div>
              ))}
            </div>
            <div
              className="flex flex-col gap-2"
              role="img"
              aria-label={`${title}: stacked bars of leave and absent days per person`}
            >
              {people.map((p, i) => {
                const total = p.leaveDays + p.absentDays;
                const dimmed = hoverId !== null && hoverId !== p.employeeId;
                return (
                  <div
                    key={p.employeeId}
                    className="relative grid grid-cols-[minmax(0,8rem)_1fr_2rem] items-center gap-3"
                    onMouseEnter={() => setHoverId(p.employeeId)}
                    onMouseLeave={() => setHoverId(null)}
                  >
                    <span className="truncate text-xs" style={{ color: "var(--viz-text-secondary)" }}>
                      {p.fullName}
                    </span>
                    <div
                      className="flex h-4 items-center gap-0.5 transition-opacity duration-150"
                      style={{ opacity: dimmed ? 0.45 : 1 }}
                    >
                      {SEGMENTS.map((s, si) => {
                        const value = p[s.key];
                        if (value <= 0) return null;
                        const isLast = SEGMENTS.slice(si + 1).every((n) => p[n.key] <= 0);
                        return (
                          <motion.div
                            key={s.key}
                            className="h-full"
                            style={{
                              backgroundColor: s.color,
                              borderTopRightRadius: isLast ? 4 : 0,
                              borderBottomRightRadius: isLast ? 4 : 0,
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(value / max) * 100}%` }}
                            transition={{ duration: 0.5, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                          />
                        );
                      })}
                    </div>
                    <span className="text-right text-xs font-medium" style={{ color: "var(--viz-text-primary)" }}>
                      {total}
                    </span>
                    {hoverId === p.employeeId && (
                      <div
                        className="pointer-events-none absolute left-32 top-0 z-10 -translate-y-full rounded-md border px-2.5 py-1.5 text-xs shadow-sm"
                        style={{
                          backgroundColor: "var(--viz-tooltip-bg)",
                          borderColor: "var(--viz-tooltip-border)",
                          color: "var(--viz-text-primary)",
                        }}
                      >
                        <div className="mb-1 font-medium">{p.fullName}</div>
                        {SEGMENTS.map((s) => (
                          <div key={s.key} className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
                              {s.label}
                            </span>
                            <span className="font-medium">{p[s.key]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
