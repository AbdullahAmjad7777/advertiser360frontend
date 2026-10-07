import { useState } from "react";
import { toast } from "sonner";
import * as attendanceApi from "@/api/attendance";
import * as leavesApi from "@/api/leaves";
import * as notificationsApi from "@/api/notifications";
import { AttendanceStatusBadge } from "@/components/status-badges";
import { AttendanceDonutChart } from "@/components/charts/AttendanceDonutChart";
import { AttendanceTrendChart } from "@/components/charts/AttendanceTrendChart";
import { LeavesBarChart } from "@/components/charts/LeavesBarChart";
import { LateSummaryCard } from "@/components/dashboard/LateSummaryCard";
import { MissedCheckoutsCard } from "@/components/dashboard/MissedCheckoutsCard";
import { MyAttendanceCard } from "@/components/dashboard/MyAttendanceCard";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import { MyTasksCard } from "@/components/tasks/MyTasksCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function FullAccessDashboard() {
  const { user } = useAuth();
  const [busyId, setBusyId] = useState<number | null>(null);

  const attendanceToday = useFetch(() => attendanceApi.fetchTodayAttendance({ limit: 10 }), []);
  const attendanceTrend = useFetch(() => attendanceApi.fetchAttendanceTrend({ days: 14 }), []);
  const pendingLeaves = useFetch(() => leavesApi.fetchLeaves({ status: "pending", limit: 10 }), []);
  const activity = useFetch(() => notificationsApi.fetchNotifications({ limit: 50 }), []);
  const stats = useFetch(() => attendanceApi.fetchAttendanceStats(), []);
  const isManager = user?.role === "manager";

  const loginActivity = (activity.data?.items ?? [])
    .filter((n) => n.type === "login_alert")
    .slice(0, 10);

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

  return (
    <StaggerGroup className="grid gap-4 xl:grid-cols-2">
      {isManager && user && (
        <>
          <StaggerItem>
            <MyAttendanceCard employeeId={user.id} onChanged={stats.refetch} />
          </StaggerItem>
          <StaggerItem>
            <MyTasksCard />
          </StaggerItem>
        </>
      )}

      <StaggerItem className="xl:col-span-2">
        <AttendanceDonutChart
          data={stats.data}
          loading={stats.loading}
          title="Attendance %"
          description={
            isManager
              ? "Each employee's attended days out of working days this year (Sundays excluded)."
              : "Everyone's attended days out of working days this year, including the manager (Sundays excluded)."
          }
        />
      </StaggerItem>

      <StaggerItem>
        <LeavesBarChart
          data={stats.data}
          loading={stats.loading}
          description="Approved leave days and absent days per person, this year."
        />
      </StaggerItem>

      <StaggerItem>
        <LateSummaryCard />
      </StaggerItem>

      <StaggerItem className="xl:col-span-2">
        <MissedCheckoutsCard />
      </StaggerItem>

      <StaggerItem>
        <AttendanceTrendChart
          data={attendanceTrend.data}
          loading={attendanceTrend.loading}
          description="Company-wide present, late, and absent counts, last 14 days."
        />
      </StaggerItem>

      <StaggerItem className="xl:col-span-2">
      <Card>
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
      </StaggerItem>

      <StaggerItem className="xl:col-span-2">
      <Card>
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
      </StaggerItem>

      <StaggerItem className="xl:col-span-2">
      <Card>
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
      </StaggerItem>
    </StaggerGroup>
  );
}
