import { useState } from "react";
import { Navigate } from "react-router-dom";
import * as employeesApi from "@/api/employees";
import * as screenshotsApi from "@/api/screenshots";
import { getScreenshotFileUrl } from "@/api/screenshots";
import {
  Dialog,
  DialogContent,
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
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { formatDateTime, localDateString } from "@/lib/format";
import { isFullAccess } from "@/lib/permissions";
import type { Screenshot } from "@/types";

export default function ScreenshotsPage() {
  const { user } = useAuth();
  const [employeeId, setEmployeeId] = useState("all");
  const [date, setDate] = useState(localDateString());
  const [selected, setSelected] = useState<Screenshot | null>(null);

  const employees = useFetch(
    () => employeesApi.fetchEmployees({ page: 1, limit: 100, status: "active" }),
    [],
  );

  const screenshots = useFetch(
    () =>
      screenshotsApi.fetchScreenshots({
        employeeId: employeeId === "all" ? undefined : Number(employeeId),
        from: date,
        to: date,
        limit: 100,
      }),
    [employeeId, date],
  );

  if (user && !isFullAccess(user.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Screenshots</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Attendance monitoring captures from the desktop agent.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-2">
          <Label>Employee</Label>
          <Select value={employeeId} onValueChange={(v) => setEmployeeId(v ?? "all")}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All employees</SelectItem>
              {(employees.data?.items ?? []).map((emp) => (
                <SelectItem key={emp.id} value={String(emp.id)}>
                  {emp.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="screenshot-date">Date</Label>
          <Input
            id="screenshot-date"
            type="date"
            className="w-40"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {screenshots.loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : screenshots.error ? (
        <p className="text-sm text-destructive">{screenshots.error}</p>
      ) : screenshots.data && screenshots.data.items.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {screenshots.data.items.map((shot) => (
            <button
              key={shot.id}
              type="button"
              onClick={() => setSelected(shot)}
              className="flex flex-col overflow-hidden rounded-md border text-left transition-colors hover:border-ring"
            >
              <img
                src={getScreenshotFileUrl(shot.id)}
                alt={`Screenshot of ${shot.employee_name} at ${shot.captured_at}`}
                loading="lazy"
                className="aspect-video w-full object-cover"
              />
              <div className="flex flex-col gap-0.5 p-2">
                <span className="text-xs font-medium">{shot.employee_name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(shot.captured_at)}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No screenshots for this selection.</p>
      )}

      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selected ? `${selected.employee_name} — ${formatDateTime(selected.captured_at)}` : ""}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <img
              src={getScreenshotFileUrl(selected.id)}
              alt={`Full-size screenshot of ${selected.employee_name}`}
              className="w-full rounded-md border"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
