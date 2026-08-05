import { useState } from "react";
import { toast } from "sonner";
import * as attendanceApi from "@/api/attendance";
import * as leavesApi from "@/api/leaves";
import * as notificationsApi from "@/api/notifications";
import { AttendanceStatusBadge } from "@/components/status-badges";
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
import { useFetch } from "@/hooks/useFetch";
import { getErrorMessage } from "@/lib/api-client";
import { formatDate, formatDateTime, formatTime } from "@/lib/format";

export function FullAccessDashboard() {
  const [busyId, setBusyId] = useState<number | null>(null);

  const attendanceToday = useFetch(() => attendanceApi.fetchTodayAttendance({ limit: 10 }), []);
  const pendingLeaves = useFetch(() => leavesApi.fetchLeaves({ status: "pending", limit: 10 }), []);
  const activity = useFetch(() => notificationsApi.fetchNotifications({ limit: 50 }), []);

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

  return (
    <div className="grid gap-4 xl:grid-cols-2">
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
