import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PersonAttendanceStats } from "@/types";
import "./chart-theme.css";

// A single progress ring: share of working days attended (present, late or
// half day) out of working days so far this year. Sundays, holidays,
// upcoming days and today's not-yet-started shift are not working days.
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
  const pct = stats.attendancePercentage ?? 0;
  const label = stats.attendancePercentage == null ? "–" : `${Math.round(pct)}%`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${stats.fullName}: ${label} attendance`}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--viz-grid)"
        strokeWidth={stroke}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--viz-series-1)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={size * 0.22}
        fontWeight={600}
        fill="var(--viz-text-primary)"
      >
        {label}
      </text>
    </svg>
  );
}

function Detail({ stats }: { stats: PersonAttendanceStats }) {
  return (
    <span>
      {stats.attendedDays} of {stats.workingDays} working days · {stats.lateDays} late ·{" "}
      {stats.absentDays} absent · {stats.leaveDays} on leave
    </span>
  );
}

export function AttendanceDonutChart({
  data,
  loading,
  title = "Attendance",
  description,
}: {
  data: PersonAttendanceStats[] | null | undefined;
  loading?: boolean;
  title?: string;
  description?: string;
}) {
  const [hoverId, setHoverId] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const people = data ?? [];
  const single = people.length === 1;

  return (
    <Card className="viz-root">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        {!single && people.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={() => setShowTable((v) => !v)}>
            {showTable ? "Chart" : "Table"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : people.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attendance data yet.</p>
        ) : single ? (
          <div className="flex items-center gap-5">
            <Ring stats={people[0]} size={132} stroke={12} />
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{people[0].fullName}</span>
              <span className="text-xs text-muted-foreground">
                <Detail stats={people[0]} />
              </span>
            </div>
          </div>
        ) : showTable ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-1.5 pr-4 font-medium">Name</th>
                  <th className="py-1.5 pr-4 font-medium">Attendance</th>
                  <th className="py-1.5 pr-4 font-medium">Attended / working</th>
                  <th className="py-1.5 pr-4 font-medium">Late</th>
                  <th className="py-1.5 pr-4 font-medium">Absent</th>
                </tr>
              </thead>
              <tbody>
                {people.map((p) => (
                  <tr key={p.employeeId} className="border-b last:border-0">
                    <td className="py-1.5 pr-4">{p.fullName}</td>
                    <td className="py-1.5 pr-4 font-medium">
                      {p.attendancePercentage == null ? "–" : `${p.attendancePercentage}%`}
                    </td>
                    <td className="py-1.5 pr-4">
                      {p.attendedDays} / {p.workingDays}
                    </td>
                    <td className="py-1.5 pr-4">{p.lateDays}</td>
                    <td className="py-1.5 pr-4">{p.absentDays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {people.map((p) => (
              <div key={p.employeeId} className="relative flex flex-col items-center gap-1.5">
                <Ring
                  stats={p}
                  size={84}
                  stroke={8}
                  onHover={(h) => setHoverId(h ? p.employeeId : null)}
                />
                <span className="max-w-full truncate text-center text-xs font-medium">
                  {p.fullName}
                </span>
                {hoverId === p.employeeId && (
                  <div
                    className="pointer-events-none absolute -top-2 left-1/2 z-10 w-48 -translate-x-1/2 -translate-y-full rounded-md border px-2.5 py-1.5 text-xs shadow-sm"
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
        )}
      </CardContent>
    </Card>
  );
}
