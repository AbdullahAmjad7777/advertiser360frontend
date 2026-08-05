import { useState } from "react";
import { toast } from "sonner";
import * as employeesApi from "@/api/employees";
import * as payrollApi from "@/api/payroll";
import { EmployeePayrollTab } from "@/components/employees/EmployeePayrollTab";
import { GeneratePayrollPanel } from "@/components/payroll/GeneratePayrollPanel";
import { PayrollStatusBadge } from "@/components/status-badges";
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
import { formatCurrency, monthName } from "@/lib/format";
import { isFullAccess } from "@/lib/permissions";
import type { PayrollStatus } from "@/types";

const PAGE_SIZE = 10;

export default function PayrollPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<PayrollStatus | "all">("all");
  const [busyId, setBusyId] = useState<number | null>(null);

  const fullAccess = user ? isFullAccess(user.role) : false;

  const activeEmployees = useFetch(
    () => employeesApi.fetchEmployees({ page: 1, limit: 100, status: "active" }),
    [],
  );

  const payroll = useFetch(
    () =>
      payrollApi.fetchPayrollList({
        page,
        limit: PAGE_SIZE,
        employeeId: employeeFilter === "all" ? undefined : Number(employeeFilter),
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
    [page, employeeFilter, statusFilter],
  );

  async function handleFinalize(id: number) {
    setBusyId(id);
    try {
      await payrollApi.finalizePayroll(id);
      toast.success("Payroll finalized");
      payroll.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to finalize payroll"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleMarkPaid(id: number) {
    setBusyId(id);
    try {
      await payrollApi.markPayrollPaid(id);
      toast.success("Payroll marked as paid");
      payroll.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to mark payroll as paid"));
    } finally {
      setBusyId(null);
    }
  }

  if (!user) return null;

  if (!fullAccess) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payroll</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your payroll history.</p>
        </div>
        <EmployeePayrollTab employeeId={user.id} />
      </div>
    );
  }

  const { data, loading, error } = payroll;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payroll</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate and manage payroll for all employees.
        </p>
      </div>

      <GeneratePayrollPanel
        employees={activeEmployees.data?.items ?? []}
        onGenerated={() => payroll.refetch()}
      />

      <div className="flex flex-wrap gap-3">
        <Select
          value={employeeFilter}
          onValueChange={(v) => {
            setEmployeeFilter(v ?? "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All employees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All employees</SelectItem>
            {(activeEmployees.data?.items ?? []).map((emp) => (
              <SelectItem key={emp.id} value={String(emp.id)}>
                {emp.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter((v ?? "all") as PayrollStatus | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="finalized">Finalized</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : data && data.items.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.employee_name}</div>
                    <div className="text-xs text-muted-foreground">{p.employee_code}</div>
                  </TableCell>
                  <TableCell>
                    {monthName(p.month)} {p.year}
                  </TableCell>
                  <TableCell>{formatCurrency(p.gross_salary)}</TableCell>
                  <TableCell>{formatCurrency(p.total_deductions)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(p.net_salary)}</TableCell>
                  <TableCell>
                    <PayrollStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {p.status === "draft" && (
                        <Button
                          size="sm"
                          disabled={busyId === p.id}
                          onClick={() => handleFinalize(p.id)}
                        >
                          Finalize
                        </Button>
                      )}
                      {p.status === "finalized" && (
                        <Button
                          size="sm"
                          disabled={busyId === p.id}
                          onClick={() => handleMarkPaid(p.id)}
                        >
                          Mark paid
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No payroll records found.</p>
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
    </div>
  );
}
