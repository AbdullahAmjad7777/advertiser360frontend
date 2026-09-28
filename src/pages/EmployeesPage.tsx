import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import * as employeesApi from "@/api/employees";
import { EmployeeFormDialog } from "@/components/employees/EmployeeFormDialog";
import { InviteEmployeeDialog } from "@/components/employees/InviteEmployeeDialog";
import { PendingInvitationsCard } from "@/components/employees/PendingInvitationsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useFetch } from "@/hooks/useFetch";
import { getErrorMessage } from "@/lib/api-client";
import { isFullAccess } from "@/lib/permissions";
import type { Employee, EmployeeListParams } from "@/types";

const PAGE_SIZE = 10;

export default function EmployeesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EmployeeListParams["status"]>("active");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [invitationsRefreshKey, setInvitationsRefreshKey] = useState(0);
  const debouncedSearch = useDebouncedValue(search);

  const employees = useFetch(
    () =>
      employeesApi.fetchEmployees({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status,
      }),
    [page, debouncedSearch, status],
  );

  const allActive = useFetch(
    () => employeesApi.fetchEmployees({ page: 1, limit: 100, status: "active" }),
    [],
  );

  if (user && !isFullAccess(user.role)) {
    return <Navigate to={`/employees/${user.id}`} replace />;
  }

  function openEdit(employee: Employee) {
    setEditingEmployee(employee);
    setDialogOpen(true);
  }

  async function handleRevokeSession(employee: Employee) {
    if (
      !window.confirm(
        `Reset ${employee.full_name}'s session? They'll be logged out of the web CRM (immediately, ` +
          `if their tab is open) and will need to log in again — which also refreshes their desktop agent.`,
      )
    ) {
      return;
    }
    try {
      await employeesApi.revokeEmployeeSession(employee.id);
      toast.success(
        `${employee.full_name}'s session was reset. Next time their browser checks in, they'll be ` +
          `asked to log in again — which will also refresh the desktop agent.`,
      );
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to reset session"));
    }
  }

  async function handleDeactivate(employee: Employee) {
    if (
      !window.confirm(
        `Permanently delete ${employee.full_name}? This removes their account and all of their ` +
          `data (attendance, payroll, leaves, messages) from the system. This cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await employeesApi.deactivateEmployee(employee.id);
      toast.success("Employee deleted");
      employees.refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete employee"));
    }
  }

  const pagination = employees.data?.pagination;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage employee records across the company.
          </p>
        </div>
        <Button onClick={() => setInviteDialogOpen(true)}>Add employee</Button>
      </div>

      <PendingInvitationsCard key={invitationsRefreshKey} />

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by name, code, or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v as EmployeeListParams["status"]);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {employees.loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : employees.error ? (
        <p className="text-sm text-destructive">{employees.error}</p>
      ) : employees.data && employees.data.items.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.data.items.map((emp) => (
                <TableRow
                  key={emp.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/employees/${emp.id}`)}
                >
                  <TableCell>
                    <div className="font-medium">{emp.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {emp.employee_code} · {emp.email}
                    </div>
                  </TableCell>
                  <TableCell>{emp.department_name ?? "-"}</TableCell>
                  <TableCell>{emp.designation_name ?? "-"}</TableCell>
                  <TableCell className="capitalize">{emp.role_name}</TableCell>
                  <TableCell>
                    <Badge variant={emp.is_active ? "default" : "secondary"}>
                      {emp.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(emp)}>
                        Edit
                      </Button>
                      {emp.is_active === 1 && emp.id !== user?.id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevokeSession(emp)}
                        >
                          Force session refresh
                        </Button>
                      )}
                      {emp.is_active === 1 && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeactivate(emp)}
                        >
                          Delete
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
        <p className="text-sm text-muted-foreground">No employees found.</p>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
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

      <EmployeeFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={editingEmployee}
        managers={allActive.data?.items ?? []}
        onSaved={() => {
          employees.refetch();
          allActive.refetch();
        }}
      />

      <InviteEmployeeDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInvited={() => setInvitationsRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
