import { useState } from "react";
import { toast } from "sonner";
import * as attendanceApi from "@/api/attendance";
import * as leavesApi from "@/api/leaves";
import * as notificationsApi from "@/api/notifications";
import { AttendanceStatusBadge } from "@/components/status-badges";
import { AttendanceTrendChart } from "@/components/charts/AttendanceTrendChart";
import { DownloadAgentCard } from "@/components/dashboard/DownloadAgentCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { getErrorMessage } from "@/lib/api-client";
import { formatDateTime, formatTime, localDateString } from "@/lib/format";

export function EmployeeDashboard() {
  const { user } = useAuth();
  const today = localDateString();
  const [actionLoading, setActionLoading] = useState(false);

  const attendance = useFetch(
    () => attendanceApi.fetchAttendanceHistory(user!.id, { from: today, to: today, limit: 1 }),
    [user!.id, today],
  );
  const attendanceTrend = useFetch(() => attendanceApi.fetchAttendanceTrend({ days: 14 }), []);
  const balance = useFetch(() => leavesApi.fetchLeaveBalance(user!.id), [user!.id]);
  const notifications = useFetch(() => notificationsApi.fetchNotifications({ limit: 5 }), []);

  const todayRecord = attendance.data?.items[0] ?? null;

  async function handleCheckIn() {
    setActionLoading(true);
    try {
      await attendanceApi.checkIn();
      toast.success("Checked in successfully");
      attendance.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to check in"));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    setActionLoading(true);
    try {
      await attendanceApi.checkOut();
      toast.success("Checked out successfully");
      attendance.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to check out"));
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
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
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Check-in</dt>
                  <dd>{formatTime(todayRecord?.check_in_time)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Check-out</dt>
                  <dd>{formatTime(todayRecord?.check_out_time)}</dd>
                </div>
              </dl>
              <div>
                {!todayRecord?.check_in_time && (
                  <Button onClick={handleCheckIn} disabled={actionLoading}>
                    Check In
                  </Button>
                )}
                {todayRecord?.check_in_time && !todayRecord.check_out_time && (
                  <Button onClick={handleCheckOut} disabled={actionLoading}>
                    Check Out
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leave Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {balance.loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : balance.data && balance.data.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {balance.data.map((b) => (
                <li key={b.leave_type_id} className="flex items-center justify-between text-sm">
                  <span>{b.type_name}</span>
                  <span className="font-medium">
                    {b.remaining} / {b.total_allotted} days left
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No leave balance data.</p>
          )}
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <AttendanceTrendChart
          data={attendanceTrend.data}
          loading={attendanceTrend.loading}
          title="My Attendance"
          description="Your present, late, and absent days, last 14 days."
        />
      </div>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : notifications.data && notifications.data.items.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {notifications.data.items.map((n) => (
                <li key={n.id} className="flex flex-col gap-0.5 text-sm">
                  <span>{n.message}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(n.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          )}
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <DownloadAgentCard />
      </div>
    </div>
  );
}
