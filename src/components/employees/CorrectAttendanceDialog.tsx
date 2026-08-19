import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import * as attendanceApi from "@/api/attendance";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { formatDateTime } from "@/lib/format";
import type { AttendanceHistoryRow, AttendanceStatus } from "@/types";

const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "half_day", label: "Half day" },
  { value: "absent", label: "Absent" },
  { value: "on_leave", label: "On leave" },
  { value: "holiday", label: "Holiday" },
];

// "2026-08-18 20:15:23" (the backend's PKT wall-clock string) <-> the value
// a <input type="datetime-local"> needs/produces ("2026-08-18T20:15"). No
// timezone math here — the backend string already IS PKT wall-clock, and
// datetime-local is a bare wall-clock value with no zone of its own, so
// they line up directly.
function toInputValue(pktString: string | null) {
  if (!pktString) return "";
  return pktString.replace(" ", "T").slice(0, 16);
}

// Tags the input's bare wall-clock value with an explicit +05:00 offset
// before sending, so the backend parses it as PKT regardless of which
// timezone the server process itself happens to be running in.
function fromInputValue(value: string): string | null {
  if (!value) return null;
  return `${value}:00+05:00`;
}

export function CorrectAttendanceDialog({
  record,
  open,
  onOpenChange,
  onSaved,
}: {
  record: AttendanceHistoryRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [checkInTime, setCheckInTime] = useState(() => toInputValue(record.check_in_time));
  const [checkOutTime, setCheckOutTime] = useState(() => toInputValue(record.check_out_time));
  const [status, setStatus] = useState<AttendanceStatus>(record.status);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const editLog = useFetch(() => attendanceApi.fetchAttendanceEditLog(record.id), [record.id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await attendanceApi.correctAttendance(record.id, {
        checkInTime: fromInputValue(checkInTime),
        checkOutTime: fromInputValue(checkOutTime),
        status,
        reason: reason.trim() || undefined,
      });
      toast.success("Attendance record updated");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update attendance record"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Correct attendance</DialogTitle>
          <DialogDescription>
            Changes are logged with your name and the time, so there's a record of what was
            corrected.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="correctCheckIn">Check-in</Label>
            <Input
              id="correctCheckIn"
              type="datetime-local"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="correctCheckOut">Check-out</Label>
            <div className="flex items-center gap-2">
              <Input
                id="correctCheckOut"
                type="datetime-local"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
              />
              {checkOutTime && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCheckOutTime("")}
                >
                  Undo checkout
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as AttendanceStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="correctReason">Reason (optional)</Label>
            <Input
              id="correctReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Employee accidentally checked out mid-shift"
            />
          </div>

          {!editLog.loading && editLog.data && editLog.data.length > 0 && (
            <div className="flex flex-col gap-1.5 rounded-md border p-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Edit history</span>
              {editLog.data.map((entry) => (
                <div key={entry.id}>
                  {formatDateTime(entry.edited_at)} — {entry.edited_by_name ?? "Unknown"}
                  {entry.reason ? `: ${entry.reason}` : ""}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save correction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
