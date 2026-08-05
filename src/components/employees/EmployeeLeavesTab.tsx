import { useState } from "react";
import * as leavesApi from "@/api/leaves";
import { LeaveStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFetch } from "@/hooks/useFetch";
import { formatDate } from "@/lib/format";

const PAGE_SIZE = 10;

export function EmployeeLeavesTab({ employeeId }: { employeeId: number }) {
  const [page, setPage] = useState(1);
  const leaves = useFetch(
    () => leavesApi.fetchLeaves({ employeeId, page, limit: PAGE_SIZE }),
    [employeeId, page],
  );

  if (leaves.loading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (!leaves.data || leaves.data.items.length === 0) {
    return <p className="text-sm text-muted-foreground">No leave requests yet.</p>;
  }

  const { items, pagination } = leaves.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((leave) => (
              <TableRow key={leave.id}>
                <TableCell>{leave.leave_type_name}</TableCell>
                <TableCell>{formatDate(leave.from_date)}</TableCell>
                <TableCell>{formatDate(leave.to_date)}</TableCell>
                <TableCell>{leave.total_days}</TableCell>
                <TableCell>
                  <LeaveStatusBadge status={leave.status} />
                </TableCell>
                <TableCell className="max-w-48 truncate">{leave.reason ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
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
