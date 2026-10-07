import { useEffect, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import * as settingsApi from "@/api/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { getErrorMessage } from "@/lib/api-client";
import { canManageLatePolicy, isFullAccess } from "@/lib/permissions";

// HTML time inputs work in HH:MM; the API stores/returns HH:MM:SS.
function toInputValue(time: string): string {
  return time.slice(0, 5);
}
function toApiValue(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const officeHours = useFetch(() => settingsApi.fetchOfficeHours(), []);
  const locationRestriction = useFetch(() => settingsApi.fetchLocationRestriction(), []);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [togglingLocation, setTogglingLocation] = useState(false);
  const latePolicy = useFetch(() => settingsApi.fetchLatePolicy(), []);
  const [graceMinutes, setGraceMinutes] = useState("");
  const [savingGrace, setSavingGrace] = useState(false);

  useEffect(() => {
    if (latePolicy.data) setGraceMinutes(String(latePolicy.data.graceMinutes));
  }, [latePolicy.data]);

  useEffect(() => {
    if (officeHours.data) {
      setStartTime(toInputValue(officeHours.data.officeStartTime));
      setEndTime(toInputValue(officeHours.data.officeEndTime));
    }
  }, [officeHours.data]);

  if (user && !isFullAccess(user.role)) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsApi.updateOfficeHours({
        officeStartTime: toApiValue(startTime),
        officeEndTime: toApiValue(endTime),
      });
      toast.success("Office hours updated");
      officeHours.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update office hours"));
    } finally {
      setSaving(false);
    }
  }

  async function handleLocationRestrictionToggle(enabled: boolean) {
    setTogglingLocation(true);
    try {
      await settingsApi.updateLocationRestriction(enabled);
      toast.success(enabled ? "Location restriction enabled" : "Location restriction disabled");
      locationRestriction.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update location restriction"));
    } finally {
      setTogglingLocation(false);
    }
  }

  async function handleGraceSubmit(e: FormEvent) {
    e.preventDefault();
    setSavingGrace(true);
    try {
      await settingsApi.updateLatePolicy(Number(graceMinutes));
      toast.success("Late grace period updated");
      latePolicy.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update grace period"));
    } finally {
      setSavingGrace(false);
    }
  }

  const isOvernight = startTime && endTime && endTime <= startTime;
  const canEditGrace = user ? canManageLatePolicy(user.role) : false;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Company-wide attendance configuration.</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Office Hours</CardTitle>
        </CardHeader>
        <CardContent>
          {officeHours.loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Applies to every employee and manager. Check-ins after start time (plus the grace
                period) are marked late; every 3 late days deducts 1 day's pay from that month's
                payroll. Sunday is the only weekly off — Monday through Saturday are working days.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="office-start">Start time</Label>
                  <Input
                    id="office-start"
                    type="time"
                    step={1}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="office-end">End time</Label>
                  <Input
                    id="office-end"
                    type="time"
                    step={1}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>
              {isOvernight && (
                <p className="text-xs text-muted-foreground">
                  End time is not after start time, so this is treated as an overnight shift
                  (e.g. 5:00 PM to 2:00 AM the next day).
                </p>
              )}
              <div>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Late Policy</CardTitle>
        </CardHeader>
        <CardContent>
          {latePolicy.loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <form onSubmit={handleGraceSubmit} className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                A check-in more than this many minutes after the shift start time is late. Every 3
                late check-ins in a month deduct 1 day's salary.
                {!canEditGrace && " Only the CEO can change this."}
              </p>
              <div className="flex max-w-40 flex-col gap-2">
                <Label htmlFor="grace-minutes">Grace period (minutes)</Label>
                <Input
                  id="grace-minutes"
                  type="number"
                  min={0}
                  max={180}
                  value={graceMinutes}
                  onChange={(e) => setGraceMinutes(e.target.value)}
                  disabled={!canEditGrace}
                  required
                />
              </div>
              {canEditGrace && (
                <div>
                  <Button type="submit" disabled={savingGrace}>
                    {savingGrace ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Location Restriction</CardTitle>
        </CardHeader>
        <CardContent>
          {locationRestriction.loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="location-restriction-toggle">Require office location</Label>
                <p className="text-sm text-muted-foreground">
                  When on, employees can only sign in and check in/out while physically at the
                  office. When off, everyone can use the portal from any location.
                </p>
              </div>
              <Switch
                id="location-restriction-toggle"
                checked={locationRestriction.data?.enabled ?? false}
                onCheckedChange={handleLocationRestrictionToggle}
                disabled={togglingLocation}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
