import { useState } from "react";
import * as attendanceApi from "@/api/attendance";
import { AttendanceStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CorrectAttendanceDialog } from "@/components/employees/CorrectAttendanceDialog";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { isFullAccess } from "@/lib/permissions";
import { formatDate, formatTime } from "@/lib/format";
import type { AttendanceHistoryRow } from "@/types";

const PAGE_SIZE = 10;

export function EmployeeAttendanceTab({ employeeId }: { employeeId: number }) {
  const { user } = useAuth();
  const canCorrect = isFullAccess(user?.role ?? "employee");
  const [page, setPage] = useState(1);
  const [correcting, setCorrecting] = useState<AttendanceHistoryRow | null>(null);
  const history = useFetch(
    () => attendanceApi.fetchAttendanceHistory(employeeId, { page, limit: PAGE_SIZE }),
    [employeeId, page],
  );

  if (history.loading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (!history.data || history.data.items.length === 0) {
    return <p className="text-sm text-muted-foreground">No attendance records yet.</p>;
  }

  const { items, pagination } = history.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Status</TableHead>
              {canCorrect && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{formatDate(row.attendance_date)}</TableCell>
                <TableCell>{formatTime(row.check_in_time)}</TableCell>
                <TableCell>{formatTime(row.check_out_time)}</TableCell>
                <TableCell>{row.total_hours ?? "-"}</TableCell>
                <TableCell>
                  <AttendanceStatusBadge status={row.status} />
                </TableCell>
                {canCorrect && (
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setCorrecting(row)}>
                      Correct
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {correcting && (
        <CorrectAttendanceDialog
          record={correcting}
          open={Boolean(correcting)}
          onOpenChange={(open) => !open && setCorrecting(null)}
          onSaved={() => history.refetch()}
        />
      )}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
