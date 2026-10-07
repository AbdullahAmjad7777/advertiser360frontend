import { useState } from "react";
import * as attendanceApi from "@/api/attendance";
import * as breaksApi from "@/api/breaks";
import { PersonSelect } from "@/components/PersonSelect";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { formatDate, formatDuration, formatTime, localDateString } from "@/lib/format";
import { isFullAccess } from "@/lib/permissions";

function daysAgo(n: number) {
  return localDateString(new Date(Date.now() - n * 86400000));
}

// Break history grouped per person per shift. The server decides whose
// breaks come back: an employee only their own, the manager every
// employee's (and their own), the CEO every employee's and the manager's.
export default function BreaksPage() {
  const { user } = useAuth();
  const fullAccess = user ? isFullAccess(user.role) : false;

  const [personId, setPersonId] = useState<number | null>(null);
  const [from, setFrom] = useState(() => daysAgo(29));
  const [to, setTo] = useState(() => localDateString());

  const people = useFetch(
    () => (fullAccess ? attendanceApi.fetchAttendanceStats() : Promise.resolve([])),
    [fullAccess],
  );
  const history = useFetch(
    () => breaksApi.fetchBreakHistory({ employeeId: personId ?? undefined, from, to }),
    [personId, from, to],
  );

  const options = (people.data ?? []).map((p) => ({ id: p.employeeId, name: p.fullName, role: p.role }));
  const days = history.data?.days ?? [];
  const grandTotal = days.reduce((sum, d) => sum + d.totalSeconds, 0);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Breaks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user?.role === "ceo"
            ? "Break records for every employee and the manager."
            : fullAccess
              ? "Break records for every employee, plus your own."
              : "Your break history and total break time per shift."}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {fullAccess && (
          <div className="flex flex-col gap-1.5">
            <Label>Person</Label>
            <PersonSelect people={options} value={personId} onChange={setPersonId} allowAll />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="breaksFrom">From</Label>
          <Input id="breaksFrom" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="breaksTo">To</Label>
          <Input id="breaksTo" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Break History</CardTitle>
          {!history.loading && days.length > 0 && (
            <span className="text-sm text-muted-foreground">
              Total: <span className="font-medium text-foreground">{formatDuration(grandTotal)}</span>
            </span>
          )}
        </CardHeader>
        <CardContent>
          {history.loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : history.error ? (
            <p className="text-sm text-destructive">{history.error}</p>
          ) : days.length === 0 ? (
            <p className="text-sm text-muted-foreground">No breaks in this period.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {fullAccess && <TableHead>Name</TableHead>}
                  <TableHead>Shift</TableHead>
                  <TableHead>Breaks</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {days.map((day) => (
                  <TableRow key={`${day.employeeId}-${day.shiftDate}`}>
                    {fullAccess && (
                      <TableCell>
                        <div className="font-medium">{day.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {day.employeeCode}
                          {day.role === "manager" && " · Manager"}
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="align-top">{formatDate(day.shiftDate)}</TableCell>
                    <TableCell>
                      <ul className="flex flex-col gap-0.5 text-sm">
                        {day.breaks.map((b) => (
                          <li key={b.id} className="flex items-center gap-2">
                            <span>
                              {formatTime(b.breakStart)} – {b.isActive ? "now" : formatTime(b.breakEnd)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({formatDuration(b.durationSeconds)})
                            </span>
                            {b.isActive && <Badge variant="outline">On break</Badge>}
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell className="text-right align-top font-medium">
                      {formatDuration(day.totalSeconds)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
