import { useState } from "react";
import { toast } from "sonner";
import * as leavesApi from "@/api/leaves";
import { RequestLeaveDialog } from "@/components/leaves/RequestLeaveDialog";
import { LeaveStatusBadge } from "@/components/status-badges";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { formatDate } from "@/lib/format";
import { isFullAccess } from "@/lib/permissions";
import type { LeaveStatus } from "@/types";

const PAGE_SIZE = 10;

export default function LeavesPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<LeaveStatus | "all">("pending");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  const fullAccess = user ? isFullAccess(user.role) : false;

  const leaves = useFetch(
    () =>
      leavesApi.fetchLeaves({
        page,
        limit: PAGE_SIZE,
        status: status === "all" ? undefined : status,
      }),
    [page, status],
  );

  async function handleApprove(id: number) {
    setBusyId(id);
    try {
      await leavesApi.approveLeave(id);
      toast.success("Leave request approved");
      leaves.refetch();
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
      leaves.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to reject leave"));
    } finally {
      setBusyId(null);
    }
  }

  if (!user) return null;

  const { data, loading, error } = leaves;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leaves</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {fullAccess ? "Review and manage leave requests." : "Your leave request history."}
          </p>
        </div>
        {!fullAccess && (
          <Button onClick={() => setRequestDialogOpen(true)}>Request leave</Button>
        )}
      </div>

      <Select
        value={status}
        onValueChange={(v) => {
          setStatus((v ?? "all") as LeaveStatus | "all");
          setPage(1);
        }}
      >
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : data && data.items.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {fullAccess && <TableHead>Employee</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                {fullAccess && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((leave) => (
                <TableRow key={leave.id}>
                  {fullAccess && (
                    <TableCell>
                      <div className="font-medium">{leave.employee_name}</div>
                      <div className="text-xs text-muted-foreground">{leave.employee_code}</div>
                    </TableCell>
                  )}
                  <TableCell>{leave.leave_type_name}</TableCell>
                  <TableCell>{formatDate(leave.from_date)}</TableCell>
                  <TableCell>{formatDate(leave.to_date)}</TableCell>
                  <TableCell>{leave.total_days}</TableCell>
                  <TableCell>
                    <LeaveStatusBadge status={leave.status} />
                  </TableCell>
                  <TableCell className="max-w-48 truncate">{leave.reason ?? "-"}</TableCell>
                  {fullAccess && (
                    <TableCell className="text-right">
                      {leave.status === "pending" ? (
                        <div className="flex justify-end gap-2">
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
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {leave.approved_by_name ?? "-"}
                        </span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No leave requests found.</p>
      )}

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages}
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
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {!fullAccess && (
        <RequestLeaveDialog
          open={requestDialogOpen}
          onOpenChange={setRequestDialogOpen}
          employeeId={user.id}
          onSubmitted={() => leaves.refetch()}
        />
      )}
    </div>
  );
}
