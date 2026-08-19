import { useState } from "react";
import { toast } from "sonner";
import * as employeesApi from "@/api/employees";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api-client";
import type { Employee } from "@/types";

// HH:MM:SS (backend) <-> HH:MM (<input type="time">)
function toTimeInput(value: string | null) {
  return value ? value.slice(0, 5) : "";
}
function toApiTime(value: string) {
  return value ? `${value}:00` : null;
}

export function ShiftTimingCard({
  employee,
  onUpdated,
}: {
  employee: Employee;
  onUpdated: () => void;
}) {
  const hasOverride = Boolean(employee.shift_start_time && employee.shift_end_time);
  const [startTime, setStartTime] = useState(toTimeInput(employee.shift_start_time));
  const [endTime, setEndTime] = useState(toTimeInput(employee.shift_end_time));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!startTime || !endTime) {
      toast.error("Set both a start and end time, or use Reset to clear the override");
      return;
    }
    setSaving(true);
    try {
      await employeesApi.updateEmployee(employee.id, {
        shiftStartTime: toApiTime(startTime),
        shiftEndTime: toApiTime(endTime),
      });
      toast.success("Shift timing updated");
      onUpdated();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update shift timing"));
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setSaving(true);
    try {
      await employeesApi.updateEmployee(employee.id, {
        shiftStartTime: null,
        shiftEndTime: null,
      });
      setStartTime("");
      setEndTime("");
      toast.success("Reverted to the company default shift");
      onUpdated();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to reset shift timing"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shift timing</CardTitle>
        <CardDescription>
          {hasOverride
            ? "This employee has a custom shift, used instead of the company default for late/absent calculations."
            : "Using the company-wide default shift. Set a start and end time to override it for this employee only."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="shiftStart">Start</Label>
          <Input
            id="shiftStart"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-32"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="shiftEnd">End</Label>
          <Input
            id="shiftEnd"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-32"
          />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          Save
        </Button>
        {hasOverride && (
          <Button variant="outline" onClick={handleReset} disabled={saving}>
            Reset to company default
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
