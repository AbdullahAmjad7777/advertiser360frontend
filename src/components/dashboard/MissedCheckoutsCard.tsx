import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import * as attendanceApi from "@/api/attendance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFetch } from "@/hooks/useFetch";
import { getErrorMessage } from "@/lib/api-client";
import { formatDate, formatDateTime } from "@/lib/format";
import type { MissedCheckout } from "@/types";

// datetime-local works in bare wall-clock; the backend's strings are PKT
// wall-clock, so they line up directly (same approach as
// CorrectAttendanceDialog).
function toInputValue(pktString: string) {
  return pktString.replace(" ", "T").slice(0, 16);
}

function UnblockDialog({
  row,
  onClose,
  onDone,
}: {
  row: MissedCheckout;
  onClose: () => void;
  onDone: () => void;
}) {
  const [checkOutTime, setCheckOutTime] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await attendanceApi.closeMissedCheckout(row.attendance_id, {
        checkOutTime: `${checkOutTime}:00+05:00`,
        reason: reason.trim(),
      });
      toast.success(`${row.full_name} can check in again`);
      onDone();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to close the shift"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unblock {row.full_name}</DialogTitle>
          <DialogDescription>
            They checked in at {formatDateTime(row.check_in_time)} for the{" "}
            {formatDate(row.attendance_date)} shift but never checked out. Enter when they actually
            left; the shift is closed with that time and the change is logged with your name.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="unblockCheckOut">Actual check-out time</Label>
            <Input
              id="unblockCheckOut"
              type="datetime-local"
              min={toInputValue(row.check_in_time)}
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="unblockReason">Reason</Label>
            <Input
              id="unblockReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Forgot to check out, confirmed left at 3:00 AM"
              maxLength={200}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Close shift & unblock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// People blocked from checking in because they didn't check out of an
// earlier shift. The server scopes the list: the manager sees employees,
// the CEO also sees the manager.
export function MissedCheckoutsCard() {
  const missed = useFetch(() => attendanceApi.fetchMissedCheckouts(), []);
  const [selected, setSelected] = useState<MissedCheckout | null>(null);
  const rows = missed.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blocked Check-ins</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">
          These people missed a check-out and can't check in until the shift is closed.
        </p>
      </CardHeader>
      <CardContent>
        {missed.loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nobody is blocked.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Checked in</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.attendance_id}>
                  <TableCell>
                    <div className="font-medium">{row.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.employee_code}
                      {row.role_name === "manager" && " · Manager"}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(row.attendance_date)}</TableCell>
                  <TableCell>{formatDateTime(row.check_in_time)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => setSelected(row)}>
                      Unblock
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {selected && (
        <UnblockDialog row={selected} onClose={() => setSelected(null)} onDone={missed.refetch} />
      )}
    </Card>
  );
}
