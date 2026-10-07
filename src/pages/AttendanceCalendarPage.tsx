import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as attendanceApi from "@/api/attendance";
import { PersonSelect } from "@/components/PersonSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { formatDate, formatTime, localDateString, monthName } from "@/lib/format";
import { isFullAccess } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import type { CalendarDay, CalendarDayStatus } from "@/types";
import "@/components/charts/chart-theme.css";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Status colors reuse the validated chart tokens (present = good, late =
// warning, absent = critical, leave = series blue). Every status also has
// a text label in the legend and the day's tooltip, so it's never
// color alone.
const STATUS_STYLE: Record<CalendarDayStatus, { label: string; color?: string; muted?: boolean }> = {
  present: { label: "Present", color: "var(--viz-good)" },
  late: { label: "Late", color: "var(--viz-warning)" },
  half_day: { label: "Half day", color: "var(--viz-warning)" },
  absent: { label: "Absent", color: "var(--viz-critical)" },
  on_leave: { label: "On leave", color: "var(--viz-series-1)" },
  off: { label: "Off (Sunday)", muted: true },
  holiday: { label: "Holiday", muted: true },
  pending: { label: "Today", muted: true },
  upcoming: { label: "Upcoming", muted: true },
  not_joined: { label: "Before joining", muted: true },
};

const LEGEND: CalendarDayStatus[] = ["present", "late", "absent", "on_leave", "off", "holiday"];

// "06:02 PM" -> "6:02p": fits inside a day cell.
function compactTime(value: string | null) {
  if (!value) return null;
  return formatTime(value).replace(/^0/, "").replace(" AM", "a").replace(" PM", "p");
}

function DayCell({ day }: { day: CalendarDay }) {
  const style = STATUS_STYLE[day.status];
  const dayNum = Number(day.date.slice(8));
  const inTime = compactTime(day.checkInTime);
  const outTime = compactTime(day.checkOutTime);
  const tooltip = [
    formatDate(day.date),
    style.label,
    day.checkInTime ? `In ${formatTime(day.checkInTime)}` : null,
    day.checkInTime ? `Out ${day.checkOutTime ? formatTime(day.checkOutTime) : "—"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      title={tooltip}
      className={cn(
        "flex min-h-12 flex-col gap-0.5 rounded-md border p-1 text-[10px] leading-tight",
        style.muted && "bg-muted/40 text-muted-foreground",
      )}
      style={style.color ? { borderLeft: `3px solid ${style.color}` } : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{dayNum}</span>
        {day.status === "off" && <span>Off</span>}
        {day.status === "absent" && <span style={{ color: "var(--viz-critical)" }}>A</span>}
        {day.status === "on_leave" && <span>L</span>}
      </div>
      {inTime && <span>In {inTime}</span>}
      {inTime && <span>Out {outTime ?? "—"}</span>}
    </div>
  );
}

// Full-year view. Each cell is a SHIFT date: the 6:00 PM shift that ends at
// 3:00 AM shows on the day it started, check-out included.
export default function AttendanceCalendarPage() {
  const { user } = useAuth();
  const fullAccess = user ? isFullAccess(user.role) : false;
  const [year, setYear] = useState(() => Number(localDateString().slice(0, 4)));
  const [personId, setPersonId] = useState<number | null>(null);

  const people = useFetch(
    () => (fullAccess ? attendanceApi.fetchAttendanceStats() : Promise.resolve([])),
    [fullAccess],
  );
  const options = (people.data ?? []).map((p) => ({ id: p.employeeId, name: p.fullName, role: p.role }));

  // The manager defaults to their own calendar; the CEO (who doesn't do
  // attendance) to the first person in the list.
  useEffect(() => {
    if (!fullAccess || personId != null || !people.data?.length || !user) return;
    const self = people.data.find((p) => p.employeeId === user.id);
    setPersonId(self ? self.employeeId : people.data[0].employeeId);
  }, [fullAccess, people.data, personId, user]);

  const targetId = fullAccess ? personId : (user?.id ?? null);
  const calendar = useFetch(
    () =>
      targetId ? attendanceApi.fetchYearCalendar({ employeeId: targetId, year }) : Promise.resolve(null),
    [targetId, year],
  );
  const summary = calendar.data?.summary;

  return (
    <div className="viz-root flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Check-in and check-out for every shift of the year. Sundays are off; a working day
            with no check-in is absent.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {fullAccess && <PersonSelect people={options} value={personId} onChange={setPersonId} />}
          <Button variant="outline" size="icon" aria-label="Previous year" onClick={() => setYear((y) => y - 1)}>
            <ChevronLeft />
          </Button>
          <span className="w-20 text-center font-medium">
            {year}
            {calendar.data?.isLeapYear && <span className="block text-[10px] text-muted-foreground">leap year</span>}
          </span>
          <Button variant="outline" size="icon" aria-label="Next year" onClick={() => setYear((y) => y + 1)}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Attendance", summary.attendancePercentage == null ? "–" : `${summary.attendancePercentage}%`],
            ["On time", summary.onTimePercentage == null ? "–" : `${summary.onTimePercentage}%`],
            ["Days attended", `${summary.attendedDays} / ${summary.workingDays}`],
            ["Late", summary.lateDays],
            ["Absent", summary.absentDays],
            ["On leave", summary.leaveDays],
          ].map(([label, value]) => (
            <Card key={label as string} size="sm">
              <CardContent>
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="text-xl font-semibold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {LEGEND.map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span
              className={cn("size-2.5 rounded-sm", STATUS_STYLE[s].muted && "bg-muted-foreground/30")}
              style={STATUS_STYLE[s].color ? { backgroundColor: STATUS_STYLE[s].color } : undefined}
              aria-hidden
            />
            {STATUS_STYLE[s].label}
          </span>
        ))}
      </div>

      {calendar.loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : calendar.error ? (
        <p className="text-sm text-destructive">{calendar.error}</p>
      ) : !calendar.data ? (
        <p className="text-sm text-muted-foreground">Select a person to view their calendar.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {calendar.data.months.map((m) => {
            const leadingBlanks = new Date(`${m.days[0].date}T00:00:00Z`).getUTCDay();
            return (
              <Card key={m.month}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {monthName(m.month)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">{m.daysInMonth} days</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1">
                    {WEEKDAYS.map((d) => (
                      <div key={d} className="pb-1 text-center text-[10px] font-medium text-muted-foreground">
                        {d}
                      </div>
                    ))}
                    {Array.from({ length: leadingBlanks }, (_, i) => (
                      <div key={`blank-${i}`} />
                    ))}
                    {m.days.map((day) => (
                      <DayCell key={day.date} day={day} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
