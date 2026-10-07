import * as attendanceApi from "@/api/attendance";
import * as settingsApi from "@/api/settings";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFetch } from "@/hooks/useFetch";
import { formatCurrency, formatDate, formatTime, localDateString, monthName } from "@/lib/format";
import type { LateSummaryRow } from "@/types";

function formatClock(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = (h * 60 + m + minutes) % (24 * 60);
  return `${Math.floor(total / 60)}:${total % 60}`;
}

function Deduction({ row }: { row: LateSummaryRow }) {
  if (row.deductionDays <= 0) return <span className="text-muted-foreground">None</span>;
  return (
    <Badge variant="destructive">
      -{row.deductionDays} day{row.deductionDays === 1 ? "" : "s"}
      {row.deductionAmount != null && row.deductionAmount > 0 && ` (${formatCurrency(row.deductionAmount)})`}
    </Badge>
  );
}

// This month's running late count and the "3 lates = 1 day's pay"
// deduction it has triggered so far. The server scopes the rows: an
// employee gets only themselves, the manager all employees, the CEO
// employees and the manager.
export function LateSummaryCard() {
  const summary = useFetch(() => attendanceApi.fetchLateSummary(), []);
  const policy = useFetch(() => settingsApi.fetchLatePolicy(), []);
  const currentMonth = Number(localDateString().slice(5, 7));
  const rows = summary.data ?? [];
  const single = rows.length === 1;

  const policyText = policy.data
    ? `Late = check-in after ${formatClock(addMinutes(policy.data.officeStartTime, policy.data.graceMinutes))}. Every ${policy.data.latesPerDeduction} lates deduct 1 day's salary.`
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Late Check-ins · {monthName(currentMonth)}</CardTitle>
        {policyText && <p className="mt-1 text-xs text-muted-foreground">{policyText}</p>}
      </CardHeader>
      <CardContent>
        {summary.loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data.</p>
        ) : single ? (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-baseline gap-6">
              <div>
                <div className="text-3xl font-semibold">{rows[0].lateCount}</div>
                <div className="text-xs text-muted-foreground">late this month</div>
              </div>
              <div>
                <Deduction row={rows[0]} />
                <div className="mt-1 text-xs text-muted-foreground">
                  {3 - (rows[0].lateCount % 3)} more late
                  {3 - (rows[0].lateCount % 3) === 1 ? "" : "s"} until the next deduction
                </div>
              </div>
            </div>
            {rows[0].lateDates.length > 0 && (
              <ul className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                {rows[0].lateDates.map((d) => (
                  <li key={d.date} className="rounded border px-1.5 py-0.5">
                    {formatDate(d.date)} · {formatTime(d.checkInTime)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Lates</TableHead>
                <TableHead>Deduction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.employeeId}>
                  <TableCell>
                    <div className="font-medium">{row.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                      {row.employeeCode}
                      {row.role === "manager" && " · Manager"}
                    </div>
                  </TableCell>
                  <TableCell>{row.lateCount}</TableCell>
                  <TableCell>
                    <Deduction row={row} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
