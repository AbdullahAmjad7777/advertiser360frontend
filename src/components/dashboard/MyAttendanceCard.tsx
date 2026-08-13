import { useState } from "react";
import { toast } from "sonner";
import * as attendanceApi from "@/api/attendance";
import { AttendanceStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFetch } from "@/hooks/useFetch";
import { getErrorMessage } from "@/lib/api-client";
import { formatTime, localDateString } from "@/lib/format";

// Shared between the Employee dashboard and the Manager view of the
// full-access dashboard — managers check in/out through the same flow as
// employees, they just aren't screenshot-monitored by the desktop agent.
export function MyAttendanceCard({ employeeId }: { employeeId: number }) {
  const today = localDateString();
  const [actionLoading, setActionLoading] = useState(false);

  const attendance = useFetch(
    () => attendanceApi.fetchAttendanceHistory(employeeId, { from: today, to: today, limit: 1 }),
    [employeeId, today],
  );

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
  );
}
