import { useEffect, useState } from "react";
import { AlertTriangle, Coffee, Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as attendanceApi from "@/api/attendance";
import * as breaksApi from "@/api/breaks";
import { AttendanceStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFetch } from "@/hooks/useFetch";
import { getErrorCode, getErrorMessage, getErrorPayload } from "@/lib/api-client";
import { formatDate, formatDuration, formatTime } from "@/lib/format";
import type { PendingTaskSummary } from "@/types";

// Shared between the Employee dashboard and the Manager view of the
// full-access dashboard — managers check in/out through the same flow as
// employees.
//
// Reads the *current shift* record (resolved server-side by shift date, not
// the browser's plain calendar date) rather than querying attendance history
// for "today" — our shifts can cross midnight, so a still-open shift that
// started yesterday evening needs to keep showing as checked-in after the
// calendar date rolls over, not reset to "Not checked in yet".
export function MyAttendanceCard({
  employeeId,
  onChanged,
}: {
  employeeId: number;
  onChanged?: () => void;
}) {
  const [actionLoading, setActionLoading] = useState(false);
  const [breakLoading, setBreakLoading] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<PendingTaskSummary[] | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const attendance = useFetch(() => attendanceApi.fetchCurrentStatus(), [employeeId]);
  const block = useFetch(() => attendanceApi.fetchCheckInBlock(), [employeeId]);
  const activeBreak = useFetch(() => breaksApi.fetchActiveBreak(), [employeeId]);

  const todayRecord = attendance.data ?? null;
  const shiftDate = todayRecord?.attendance_date;
  const breakHistory = useFetch(
    () =>
      shiftDate
        ? breaksApi.fetchBreakHistory({ employeeId, from: shiftDate, to: shiftDate })
        : Promise.resolve(null),
    [employeeId, shiftDate, activeBreak.data?.id, activeBreak.data?.break_end],
  );

  const onBreak = Boolean(activeBreak.data);
  const inShift = Boolean(todayRecord?.check_in_time && !todayRecord.check_out_time);
  const blocked = !todayRecord?.check_in_time && block.data?.blocked;

  // Ticks the running break timer once a second while on a break.
  useEffect(() => {
    if (!onBreak) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [onBreak]);

  const activeBreakSeconds = activeBreak.data
    ? Math.max(
        0,
        Math.floor(
          (now - new Date(`${activeBreak.data.break_start.replace(" ", "T")}+05:00`).getTime()) /
            1000,
        ),
      )
    : 0;
  const finishedBreakSeconds = (breakHistory.data?.days[0]?.breaks ?? [])
    .filter((b) => !b.isActive)
    .reduce((sum, b) => sum + b.durationSeconds, 0);

  function refreshAll() {
    attendance.refetch();
    block.refetch();
    activeBreak.refetch();
    onChanged?.();
  }

  async function handleCheckIn() {
    setActionLoading(true);
    try {
      await attendanceApi.checkIn();
      toast.success("Checked in successfully");
      refreshAll();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to check in"));
      if (getErrorCode(err) === "MISSED_CHECKOUT") block.refetch();
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    setActionLoading(true);
    setPendingTasks(null);
    try {
      await attendanceApi.checkOut();
      toast.success("Checked out successfully");
      refreshAll();
    } catch (err) {
      if (getErrorCode(err) === "TASKS_PENDING") {
        setPendingTasks(
          getErrorPayload<{ pendingTasks: PendingTaskSummary[] }>(err)?.pendingTasks ?? [],
        );
      }
      toast.error(getErrorMessage(err, "Failed to check out"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBreak(action: "start" | "end") {
    setBreakLoading(true);
    try {
      if (action === "start") {
        await breaksApi.startBreak();
        toast.success("Break started");
      } else {
        await breaksApi.endBreak();
        toast.success("Break ended");
      }
      activeBreak.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, `Failed to ${action} break`));
    } finally {
      setBreakLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Attendance</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {attendance.loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <>
            <div className="flex items-center gap-3">
              {todayRecord ? (
                <AttendanceStatusBadge status={todayRecord.status} />
              ) : (
                <span className="text-sm text-muted-foreground">Not checked in yet</span>
              )}
              {onBreak && (
                <span className="flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400">
                  <Coffee className="size-4" /> On break · {formatDuration(activeBreakSeconds)}
                </span>
              )}
            </div>
            <dl className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Check-in</dt>
                <dd>{formatTime(todayRecord?.check_in_time)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Check-out</dt>
                <dd>{formatTime(todayRecord?.check_out_time)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Break time</dt>
                <dd>{formatDuration(finishedBreakSeconds + activeBreakSeconds)}</dd>
              </div>
            </dl>

            {blocked && (
              <div
                role="alert"
                className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div className="flex flex-col gap-1">
                  <span className="font-medium">Check-in is blocked</span>
                  <span className="text-muted-foreground">
                    You didn't check out of your {formatDate(block.data?.attendanceDate)} shift
                    (checked in at {formatTime(block.data?.checkInTime)}). Ask your manager or
                    the CEO to close that shift, then you can check in.
                  </span>
                </div>
              </div>
            )}

            {pendingTasks && pendingTasks.length > 0 && inShift && (
              <div
                role="alert"
                className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div className="flex flex-col gap-1">
                  <span className="font-medium">
                    Complete these tasks before checking out:
                  </span>
                  <ul className="list-disc pl-4 text-muted-foreground">
                    {pendingTasks.map((t) => (
                      <li key={t.id}>
                        {t.title} <span className="text-xs">(due {formatDate(t.due_date)})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {!todayRecord?.check_in_time && (
                <Button onClick={handleCheckIn} disabled={actionLoading || Boolean(blocked)}>
                  {actionLoading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Checking in...
                    </>
                  ) : (
                    "Check In"
                  )}
                </Button>
              )}
              {inShift && (
                <>
                  <Button onClick={handleCheckOut} disabled={actionLoading}>
                    {actionLoading ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Checking out...
                      </>
                    ) : (
                      "Check Out"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleBreak("start")}
                    disabled={breakLoading || onBreak || activeBreak.loading}
                  >
                    Start Break
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleBreak("end")}
                    disabled={breakLoading || !onBreak}
                  >
                    End Break
                  </Button>
                </>
              )}
            </div>
            {inShift && onBreak && (
              <p className="text-xs text-muted-foreground">
                Checking out ends your current break automatically.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
