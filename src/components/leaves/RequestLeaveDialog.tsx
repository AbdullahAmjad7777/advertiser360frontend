import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import * as leavesApi from "@/api/leaves";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFetch } from "@/hooks/useFetch";
import { getErrorMessage } from "@/lib/api-client";
import type { LeaveBalance } from "@/types";

interface RequestLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: number;
  onSubmitted: () => void;
}

function daysBetween(fromDate: string, toDate: string): number {
  const from = new Date(`${fromDate}T00:00:00Z`);
  const to = new Date(`${toDate}T00:00:00Z`);
  const diff = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

export function RequestLeaveDialog({
  open,
  onOpenChange,
  employeeId,
  onSubmitted,
}: RequestLeaveDialogProps) {
  const leaveTypes = useFetch(() => leavesApi.fetchLeaveTypes(), []);
  const balances = useFetch(() => leavesApi.fetchLeaveBalance(employeeId), [employeeId]);

  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setLeaveTypeId("");
      setFromDate("");
      setToDate("");
      setReason("");
      setClientError(null);
    }
  }, [open]);

  const selectedType = leaveTypes.data?.find((t) => String(t.id) === leaveTypeId);
  const selectedBalance: LeaveBalance | undefined = balances.data?.find(
    (b) => String(b.leave_type_id) === leaveTypeId,
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setClientError(null);

    if (!leaveTypeId || !fromDate || !toDate) {
      setClientError("Please fill in all required fields.");
      return;
    }
    if (toDate < fromDate) {
      setClientError("End date must be on or after the start date.");
      return;
    }

    const requestedDays = daysBetween(fromDate, toDate);
    if (selectedType?.is_paid && selectedBalance && selectedBalance.remaining < requestedDays) {
      setClientError(
        `Insufficient leave balance: requesting ${requestedDays} day(s) but only ${selectedBalance.remaining} remaining for ${selectedType.type_name}.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      await leavesApi.applyForLeave({
        leaveTypeId: Number(leaveTypeId),
        fromDate,
        toDate,
        reason: reason || undefined,
      });
      toast.success("Leave request submitted");
      onOpenChange(false);
      onSubmitted();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to submit leave request"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request leave</DialogTitle>
          <DialogDescription>Submit a new leave request for approval.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <div className="flex flex-col gap-2">
            <Label>Leave type</Label>
            <Select value={leaveTypeId} onValueChange={(v) => setLeaveTypeId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.data?.map((t) => (
                  <SelectItem key={t.id} value={String(t.id)}>
                    {t.type_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBalance && (
              <p className="text-xs text-muted-foreground">
                {selectedBalance.remaining} of {selectedBalance.total_allotted} days remaining
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fromDate">From</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="toDate">To</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
            />
          </div>
          {clientError && <p className="text-sm text-destructive">{clientError}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
