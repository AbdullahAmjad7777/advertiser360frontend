import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PersonAttendanceStats } from "@/types";
import "./chart-theme.css";

// Ring segments, as shares of the month's working days. Whatever is left of
// the track (grey) is absent/leave. Status colors carry meaning here
// (on time = good, late = warning) and always ship with the legend labels.
const SEGMENTS = [
  { key: "onTimeDays" as const, label: "On time", color: "var(--viz-good)" },
  { key: "lateDays" as const, label: "Late", color: "var(--viz-warning)" },
];

// Gap between adjacent arc segments, in px along the circumference.
const ARC_GAP = 2;

function Ring({
  stats,
  size,
  stroke,
  onHover,
}: {
  stats: PersonAttendanceStats;
  size: number;
  stroke: number;
  onHover?: (hovering: boolean) => void;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const label = stats.attendancePercentage == null ? "–" : `${Math.round(stats.attendancePercentage)}%`;
  const onTime = stats.onTimePercentage == null ? null : Math.round(stats.onTimePercentage);

  let offset = 0;
  const arcs = SEGMENTS.map((s) => {
    const share = stats.workingDays > 0 ? stats[s.key] / stats.workingDays : 0;
    const length = share * circumference;
    const arc = { ...s, start: offset, length };
    offset += length;
    return arc;
  }).filter((a) => a.length > 0);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${stats.fullName}: ${label} attendance, ${onTime ?? "–"}% on time`}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--viz-grid)" strokeWidth={stroke} />
      {arcs.map((a, i) => {
        const visible = Math.max(0, a.length - (arcs.length > 1 ? ARC_GAP : 0));
        return (
          <motion.circle
            key={a.key}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={stroke}
            strokeDasharray={`${visible} ${circumference}`}
            strokeDashoffset={-a.start}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
      })}
      <text
        x="50%"
        y={onTime != null ? "45%" : "50%"}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.22}
        fontWeight={600}
        fill="var(--viz-text-primary)"
      >
        {label}
      </text>
      {onTime != null && (
        <text
          x="50%"
          y="66%"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={Math.max(9, size * 0.1)}
          fill="var(--viz-text-secondary)"
        >
          {onTime}% on time
        </text>
      )}
    </svg>
  );
}

function Detail({ stats }: { stats: PersonAttendanceStats }) {
  return (
    <span>
      Came {stats.attendedDays} of {stats.workingDays} working days · {stats.onTimeDays} on time ·{" "}
      {stats.lateDays} late · {stats.absentDays} absent
      {stats.leaveDays > 0 && ` · ${stats.leaveDays} on leave`}
      {stats.missedCheckouts > 0 && ` · ${stats.missedCheckouts} missed check-out`}
    </span>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {SEGMENTS.map((s) => (
        <div key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: s.color }} aria-hidden />
          {s.label}
        </div>
      ))}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: "var(--viz-grid)" }} aria-hidden />
        Absent / leave
      </div>
    </div>
  );
}

// Big number = attendance % (came, on time or late). Below it and in green:
// the on-time share, so a punctual person stands out from a late one.
export function AttendanceDonutChart({
  data,
  loading,
  title = "Attendance",
  description,
  action,
}: {
  data: PersonAttendanceStats[] | null | undefined;
  loading?: boolean;
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const people = [...(data ?? [])].sort(
    (a, b) => (b.onTimePercentage ?? -1) - (a.onTimePercentage ?? -1) || (b.attendancePercentage ?? -1) - (a.attendancePercentage ?? -1),
  );
  const single = people.length === 1;

  return (
    <Card className="viz-root">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          {action}
          {!single && people.length > 0 && (
            <Button type="button" variant="outline" size="sm" onClick={() => setShowTable((v) => !v)}>
              {showTable ? "Chart" : "Table"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : people.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attendance data yet.</p>
        ) : single ? (
          <>
            <div className="flex items-center gap-5">
              <Ring stats={people[0]} size={132} stroke={12} />
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-medium">{people[0].fullName}</span>
                <span className="text-xs text-muted-foreground">
                  <Detail stats={people[0]} />
                </span>
              </div>
            </div>
            <Legend />
          </>
        ) : showTable ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-1.5 pr-4 font-medium">Name</th>
                  <th className="py-1.5 pr-4 font-medium">Attendance</th>
                  <th className="py-1.5 pr-4 font-medium">On time</th>
                  <th className="py-1.5 pr-4 font-medium">Came / working</th>
                  <th className="py-1.5 pr-4 font-medium">Late</th>
                  <th className="py-1.5 pr-4 font-medium">Absent</th>
                  <th className="py-1.5 pr-4 font-medium">Missed check-out</th>
                </tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p.employeeId} className="border-b last:border-0">
                    <td className="py-1.5 pr-4">{p.fullName}</td>
                    <td className="py-1.5 pr-4 font-medium">
                      {p.attendancePercentage == null ? "–" : `${p.attendancePercentage}%`}
                    </td>
                    <td className="py-1.5 pr-4 font-medium">
                      {p.onTimePercentage == null ? "–" : `${p.onTimePercentage}%`}
                    </td>
                    <td className="py-1.5 pr-4">
                      {p.attendedDays} / {p.workingDays}
                    </td>
                    <td className="py-1.5 pr-4">{p.lateDays}</td>
                    <td className="py-1.5 pr-4">{p.absentDays}</td>
                    <td className="py-1.5 pr-4">{p.missedCheckouts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <>
            <Legend />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {people.map((p) => (
                <div key={p.employeeId} className="relative flex flex-col items-center gap-1.5">
                  <Ring
                    stats={p}
                    size={96}
                    stroke={9}
                    onHover={(h) => setHoverId(h ? p.employeeId : null)}
                  />
                  <span className="max-w-full truncate text-center text-xs font-medium">{p.fullName}</span>
                  {hoverId === p.employeeId && (
                    <div
                      className="pointer-events-none absolute -top-2 left-1/2 z-10 w-52 -translate-x-1/2 -translate-y-full rounded-md border px-2.5 py-1.5 text-xs shadow-sm"
                      style={{
                        backgroundColor: "var(--viz-tooltip-bg)",
                        borderColor: "var(--viz-tooltip-border)",
                        color: "var(--viz-text-primary)",
                      }}
                    >
                      <div className="mb-0.5 font-medium">{p.fullName}</div>
                      <Detail stats={p} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
