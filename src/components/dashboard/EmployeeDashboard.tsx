import * as leavesApi from "@/api/leaves";
import * as notificationsApi from "@/api/notifications";
import * as attendanceApi from "@/api/attendance";
import { AttendanceTrendChart } from "@/components/charts/AttendanceTrendChart";
import { MyAttendanceCard } from "@/components/dashboard/MyAttendanceCard";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { StaggerGroup, StaggerItem } from "@/components/motion/Stagger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { formatDateTime } from "@/lib/format";

export function EmployeeDashboard() {
  const { user } = useAuth();

  const attendanceTrend = useFetch(() => attendanceApi.fetchAttendanceTrend({ days: 14 }), []);
  const balance = useFetch(() => leavesApi.fetchLeaveBalance(user!.id), [user!.id]);
  const notifications = useFetch(() => notificationsApi.fetchNotifications({ limit: 5 }), []);

  return (
    <StaggerGroup className="grid gap-4 lg:grid-cols-2">
      <StaggerItem>
        <MyAttendanceCard employeeId={user!.id} />
      </StaggerItem>

      <StaggerItem>
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
                    <AnimatedNumber value={b.remaining} /> / {b.total_allotted} days left
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No leave balance data.</p>
          )}
        </CardContent>
      </Card>
      </StaggerItem>

      <StaggerItem className="lg:col-span-2">
        <AttendanceTrendChart
          data={attendanceTrend.data}
          loading={attendanceTrend.loading}
          title="My Attendance"
          description="Your present, late, and absent days, last 14 days."
        />
      </StaggerItem>

      <StaggerItem className="lg:col-span-2">
      <Card>
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
      </StaggerItem>
    </StaggerGroup>
  );
}
