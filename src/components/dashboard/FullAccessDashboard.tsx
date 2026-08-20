import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import * as agentApi from "@/api/agent";
import * as attendanceApi from "@/api/attendance";
import * as leavesApi from "@/api/leaves";
import * as notificationsApi from "@/api/notifications";
import * as screenshotsApi from "@/api/screenshots";
import { AttendanceStatusBadge } from "@/components/status-badges";
import { AttendanceTrendChart } from "@/components/charts/AttendanceTrendChart";
import { ScreenshotActivityChart } from "@/components/charts/ScreenshotActivityChart";
import { MyAttendanceCard } from "@/components/dashboard/MyAttendanceCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { getErrorMessage } from "@/lib/api-client";
import { formatDate, formatDateTime, formatTime } from "@/lib/format";
import type { AgentCaptureStatus, AgentFixAllProgress } from "@/types";

// An agent whose last heartbeat is older than this is either closed or
// unreachable — its capture state is stale, not necessarily wrong, so it's
// excluded from the "capture problem" list rather than shown as broken.
const CAPTURE_HEARTBEAT_STALE_MS = 5 * 60 * 1000;

// How long to keep polling for ack updates after clicking the button, and
// how often — agents pick the signal up on their own ~15s poll cycle, so a
// minute of watching covers the near-immediate responders without polling
// forever.
const FIX_ALL_POLL_WINDOW_MS = 60_000;
const FIX_ALL_POLL_INTERVAL_MS = 5_000;

export function FullAccessDashboard() {
  const { user } = useAuth();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [fixingAll, setFixingAll] = useState(false);
  const [fixAllProgress, setFixAllProgress] = useState<AgentFixAllProgress | null>(null);
  const [isPollingFixAll, setIsPollingFixAll] = useState(false);
  const fixAllPollRef = useRef<{ interval: ReturnType<typeof setInterval>; timeout: ReturnType<typeof setTimeout> } | null>(null);

  useEffect(() => {
    return () => {
      if (fixAllPollRef.current) {
        clearInterval(fixAllPollRef.current.interval);
        clearTimeout(fixAllPollRef.current.timeout);
      }
    };
  }, []);

  const attendanceToday = useFetch(() => attendanceApi.fetchTodayAttendance({ limit: 10 }), []);
  const captureStatus = useFetch(() => agentApi.fetchCaptureStatuses(), []);
  const attendanceTrend = useFetch(() => attendanceApi.fetchAttendanceTrend({ days: 14 }), []);
  const screenshotActivity = useFetch(() => screenshotsApi.fetchScreenshotActivity(7), []);
  const pendingLeaves = useFetch(() => leavesApi.fetchLeaves({ status: "pending", limit: 10 }), []);
  const activity = useFetch(() => notificationsApi.fetchNotifications({ limit: 50 }), []);

  const loginActivity = (activity.data?.items ?? [])
    .filter((n) => n.type === "login_alert")
    .slice(0, 10);

  // Checked-in-but-not-actually-being-captured is otherwise invisible —
  // discovered this only after manually cross-referencing timestamps for one
  // employee. This surfaces it directly: anyone checked in right now whose
  // agent last reported not-capturing (or an outright error), or whose agent
  // hasn't reported in at all recently despite them being checked in.
  const captureStatusByEmployee = new Map<number, AgentCaptureStatus>(
    (captureStatus.data ?? []).map((s) => [s.id, s]),
  );
  const checkedInNow = (attendanceToday.data?.items ?? []).filter(
    (row) => row.check_in_time && !row.check_out_time,
  );
  const captureProblems = checkedInNow
    .map((row) => ({ row, status: captureStatusByEmployee.get(row.employee_id) ?? null }))
    .filter(({ status }) => {
      if (!status) return true; // never reported a heartbeat at all
      const lastSeen = status.agent_last_seen_at ? new Date(status.agent_last_seen_at).getTime() : 0;
      const stale = Date.now() - lastSeen > CAPTURE_HEARTBEAT_STALE_MS;
      if (stale) return false; // agent isn't reachable right now — that's the offline list's job, not this one
      return !status.agent_capturing || Boolean(status.agent_last_capture_error);
    });

  async function handleApprove(id: number) {
    setBusyId(id);
    try {
      await leavesApi.approveLeave(id);
      toast.success("Leave request approved");
      pendingLeaves.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to approve leave"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: number) {
    setBusyId(id);
    try {
      await leavesApi.rejectLeave(id);
      toast.success("Leave request rejected");
      pendingLeaves.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to reject leave"));
    } finally {
      setBusyId(null);
    }
  }

  // For when an employee's desktop agent has silently stopped working (e.g.
  // its session expired) but they're still shown as checked in on the web
  // portal. Just recording a check-out time wouldn't actually free them up
  // to check in again — checkIn() rejects any row that already has a
  // check_in_time, regardless of whether it's also checked out (one row per
  // employee per shift date). So this clears the check-in entirely — both
  // times and the status reset to the same 'absent' default an untouched
  // day would have — rather than just checking them out, so their next
  // check-in attempt creates a genuinely fresh record instead of hitting
  // "already checked in for this shift".
  async function handleDismissCheckIn(attendanceId: number) {
    setBusyId(attendanceId);
    try {
      await attendanceApi.correctAttendance(attendanceId, {
        checkInTime: null,
        checkOutTime: null,
        status: "absent",
        reason: "Check-in cleared by manager/CEO so the employee could check in again",
      });
      toast.success("Check-in dismissed — the employee can check in again");
      attendanceToday.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to dismiss check-in"));
    } finally {
      setBusyId(null);
    }
  }

  // One click does both a session-refresh and an update-check on every
  // currently-signed-in agent at once, plus surfaces exactly which
  // employees' agents aren't reachable at all — those are the only ones a
  // manager/CEO ever needs to message personally, since nothing
  // software-side can reach an agent that isn't open. Everyone else needs
  // zero action from the employee.
  async function handleFixAll() {
    if (fixAllPollRef.current) {
      clearInterval(fixAllPollRef.current.interval);
      clearTimeout(fixAllPollRef.current.timeout);
      fixAllPollRef.current = null;
    }
    setFixingAll(true);
    setFixAllProgress(null);
    try {
      const result = await agentApi.fixAllAgents();
      const n = result.estimatedReachable;
      toast.success(
        `Fix signal sent — roughly ${n} agent${n === 1 ? "" : "s"} likely to pick it up shortly`,
      );
      setFixAllProgress({ ...result, respondedCount: 0, updated: 0, alreadyCurrent: 0 });
      setIsPollingFixAll(true);

      const interval = setInterval(async () => {
        try {
          const progress = await agentApi.fetchFixAllProgress(
            result.resyncRequestId,
            result.updateRequestId,
          );
          setFixAllProgress(progress);
        } catch {
          // Transient poll failure — next tick tries again, nothing to surface.
        }
      }, FIX_ALL_POLL_INTERVAL_MS);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        fixAllPollRef.current = null;
        setIsPollingFixAll(false);
      }, FIX_ALL_POLL_WINDOW_MS);

      fixAllPollRef.current = { interval, timeout };
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to send fix-all signal"));
    } finally {
      setFixingAll(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {user?.role === "manager" && <MyAttendanceCard employeeId={user.id} />}

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Desktop Agents</CardTitle>
          <CardDescription>
            Employees only ever need to Check In / Check Out — everything else about their
            desktop agent is handled from here. One click refreshes every signed-in agent's
            session, restarts monitoring on any that got stuck, and installs the latest
            version. Only agents that are fully closed can't be reached this way — those
            employees are listed below so you know exactly who to remind, without guessing.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button onClick={handleFixAll} disabled={fixingAll} className="self-start">
            {fixingAll ? "Sending..." : "Fix All Agents Now"}
          </Button>

          {fixAllProgress && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">{fixAllProgress.respondedCount}</strong> of ~
                {fixAllProgress.estimatedReachable} agent{fixAllProgress.estimatedReachable === 1 ? "" : "s"}{" "}
                confirmed so far ({fixAllProgress.updated} updated to the latest version,{" "}
                {fixAllProgress.alreadyCurrent} already up to date).{" "}
                {isPollingFixAll ? "Still watching..." : "Done watching for this round."}
              </p>

              {fixAllProgress.offlineAgents.length > 0 && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-sm font-medium text-destructive">
                    {fixAllProgress.offlineAgents.length} agent
                    {fixAllProgress.offlineAgents.length === 1 ? " is" : "s are"} offline — nothing
                    automatic can reach them. Ask{" "}
                    {fixAllProgress.offlineAgents.length === 1 ? "this employee" : "these employees"}{" "}
                    to open the Advertisers360 Agent app once:
                  </p>
                  <ul className="mt-2 flex flex-col gap-1 text-sm">
                    {fixAllProgress.offlineAgents.map((emp) => (
                      <li key={emp.id} className="flex items-center justify-between">
                        <span>
                          {emp.full_name} <span className="text-muted-foreground">({emp.employee_code})</span>
                        </span>
                        <span className="text-muted-foreground">{emp.email}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {captureProblems.length > 0 && (
        <Card className="xl:col-span-2 border-destructive/30">
          <CardHeader>
            <CardTitle>Screen Capture Not Working</CardTitle>
            <CardDescription>
              These employees are checked in right now, but their agent isn't actually capturing
              screenshots. "Fix All Agents Now" above will restart capture on any that just got
              stuck — if the problem persists after that, it's a local issue on that machine (most
              often a screen-recording permission that was never granted).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm">
              {captureProblems.map(({ row, status }) => (
                <li
                  key={row.employee_id}
                  className="flex flex-col gap-0.5 rounded-md border border-destructive/30 bg-destructive/5 p-2"
                >
                  <span className="font-medium">
                    {row.full_name} <span className="text-muted-foreground">({row.employee_code})</span>
                  </span>
                  <span className="text-muted-foreground">
                    {status
                      ? status.agent_last_capture_error
                        ? `Last error: ${status.agent_last_capture_error}`
                        : "Agent reports capture is not running"
                      : "Agent has never reported its capture status — likely still on an old version"}
                    {status?.agent_version ? ` · v${status.agent_version}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <AttendanceTrendChart
        data={attendanceTrend.data}
        loading={attendanceTrend.loading}
        description="Company-wide present, late, and absent counts, last 14 days."
      />
      <ScreenshotActivityChart data={screenshotActivity.data} loading={screenshotActivity.loading} />

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Today's Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceToday.loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : attendanceToday.data && attendanceToday.data.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceToday.data.items.map((row) => (
                  <TableRow key={row.employee_id}>
                    <TableCell>
                      <div className="font-medium">{row.full_name}</div>
                      <div className="text-xs text-muted-foreground">{row.employee_code}</div>
                    </TableCell>
                    <TableCell>{formatTime(row.check_in_time)}</TableCell>
                    <TableCell>{formatTime(row.check_out_time)}</TableCell>
                    <TableCell>
                      <AttendanceStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {row.attendance_id && row.check_in_time && !row.check_out_time && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busyId === row.attendance_id}
                          onClick={() => handleDismissCheckIn(row.attendance_id!)}
                        >
                          Dismiss check-in
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No attendance records for today.</p>
          )}
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Pending Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingLeaves.loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : pendingLeaves.data && pendingLeaves.data.items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingLeaves.data.items.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <div className="font-medium">{leave.employee_name}</div>
                      <div className="text-xs text-muted-foreground">{leave.employee_code}</div>
                    </TableCell>
                    <TableCell>{leave.leave_type_name}</TableCell>
                    <TableCell>{formatDate(leave.from_date)}</TableCell>
                    <TableCell>{formatDate(leave.to_date)}</TableCell>
                    <TableCell>{leave.total_days}</TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        disabled={busyId === leave.id}
                        onClick={() => handleApprove(leave.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === leave.id}
                        onClick={() => handleReject(leave.id)}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No pending leave requests.</p>
          )}
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Recent Login Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {activity.loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : loginActivity.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {loginActivity.map((n) => (
                <li key={n.id} className="flex items-center justify-between text-sm">
                  <span>{n.message}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(n.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No recent login activity.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
