import { useState } from "react";
import * as payrollApi from "@/api/payroll";
import { LateDeductionSummary } from "@/components/payroll/LateDeductionSummary";
import { PayrollStatusBadge } from "@/components/status-badges";
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
import { formatCurrency, monthName } from "@/lib/format";

const PAGE_SIZE = 10;

export function EmployeePayrollTab({ employeeId }: { employeeId: number }) {
  const [page, setPage] = useState(1);
  const payroll = useFetch(
    () => payrollApi.fetchPayrollList({ employeeId, page, limit: PAGE_SIZE }),
    [employeeId, page],
  );

  if (payroll.loading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (!payroll.data || payroll.data.items.length === 0) {
    return <p className="text-sm text-muted-foreground">No payroll records yet.</p>;
  }

  const { items, pagination } = payroll.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Period</TableHead>
              <TableHead>Present</TableHead>
              <TableHead>Absent</TableHead>
              <TableHead>Gross</TableHead>
              <TableHead>Deductions</TableHead>
              <TableHead>Late Deduction</TableHead>
              <TableHead>Net</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  {monthName(p.month)} {p.year}
                </TableCell>
                <TableCell>{p.total_present_days}</TableCell>
                <TableCell>{p.total_absent_days}</TableCell>
                <TableCell>{formatCurrency(p.gross_salary)}</TableCell>
                <TableCell>{formatCurrency(p.total_deductions)}</TableCell>
                <TableCell>
                  <LateDeductionSummary
                    lateDeductionDays={p.late_deduction_days}
                    lateDeductionAmount={p.late_deduction_amount}
                    breakdown={p.late_deduction_breakdown}
                  />
                </TableCell>
                <TableCell className="font-medium">{formatCurrency(p.net_salary)}</TableCell>
                <TableCell>
                  <PayrollStatusBadge status={p.status} />
                </TableCell>
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
