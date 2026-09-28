import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import * as attendanceApi from "@/api/attendance";
import { AttendanceStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFetch } from "@/hooks/useFetch";
import { getErrorMessage } from "@/lib/api-client";
import { formatTime } from "@/lib/format";

// Shared between the Employee dashboard and the Manager view of the
// full-access dashboard — managers check in/out through the same flow as
// employees.
//
// Reads the *current shift* record (resolved server-side by shift date, not
// the browser's plain calendar date) rather than querying attendance history
// for "today" — our shifts can cross midnight, so a still-open shift that
// started yesterday evening needs to keep showing as checked-in after the
// calendar date rolls over, not reset to "Not checked in yet".
export function MyAttendanceCard({ employeeId }: { employeeId: number }) {
  const [actionLoading, setActionLoading] = useState(false);

  const attendance = useFetch(() => attendanceApi.fetchCurrentStatus(), [employeeId]);

  const todayRecord = attendance.data ?? null;

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
              {todayRecord?.check_in_time && !todayRecord.check_out_time && (
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
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
