import { Navigate, useParams } from "react-router-dom";
import * as employeesApi from "@/api/employees";
import { EmployeeAttendanceTab } from "@/components/employees/EmployeeAttendanceTab";
import { EmployeeLeavesTab } from "@/components/employees/EmployeeLeavesTab";
import { EmployeePayrollTab } from "@/components/employees/EmployeePayrollTab";
import { ShiftTimingCard } from "@/components/employees/ShiftTimingCard";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useFetch } from "@/hooks/useFetch";
import { formatDate } from "@/lib/format";
import { isFullAccess } from "@/lib/permissions";

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const employeeId = Number(id);

  const employee = useFetch(
    () => employeesApi.fetchEmployeeById(employeeId),
    [employeeId],
  );

  if (user && !isFullAccess(user.role) && user.id !== employeeId) {
    return <Navigate to={`/employees/${user.id}`} replace />;
  }

  if (employee.loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (employee.error || !employee.data) {
    return <p className="text-sm text-destructive">{employee.error ?? "Employee not found."}</p>;
  }

  const emp = employee.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          {emp.profile_picture_url && (
            <img
              src={emp.profile_picture_url}
              alt={emp.full_name}
              className="h-14 w-14 rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{emp.full_name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {emp.employee_code} · {emp.email}
            </p>
          </div>
        </div>
        <Badge variant={emp.is_active ? "default" : "secondary"}>
          {emp.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-md border p-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Department</dt>
          <dd>{emp.department_name ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Designation</dt>
          <dd>{emp.designation_name ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Role</dt>
          <dd className="capitalize">{emp.role_name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Manager</dt>
          <dd>{emp.manager_name ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Join date</dt>
          <dd>{formatDate(emp.join_date)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Phone</dt>
          <dd>{emp.phone ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">CNIC</dt>
          <dd>{emp.cnic_number ?? "-"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Date of birth</dt>
          <dd>{emp.date_of_birth ? formatDate(emp.date_of_birth) : "-"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground">Address</dt>
          <dd>{emp.address ?? "-"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground">Emergency contact</dt>
          <dd>
            {emp.emergency_contact_name
              ? `${emp.emergency_contact_name} (${emp.emergency_contact_relation ?? "-"}) · ${emp.emergency_contact_phone ?? "-"}`
              : "-"}
          </dd>
        </div>
        {isFullAccess(user?.role ?? "employee") && (
          <div className="col-span-2 sm:col-span-4">
            <dt className="text-muted-foreground">Bank details</dt>
            <dd>
              {emp.bank_name
                ? `${emp.bank_name} · ${emp.account_title} · ${emp.account_number}${emp.iban ? ` · ${emp.iban}` : ""}`
                : "-"}
            </dd>
          </div>
        )}
      </dl>

      {isFullAccess(user?.role ?? "employee") && (
        <ShiftTimingCard employee={emp} onUpdated={() => employee.refetch()} />
      )}

      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leaves">Leaves</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>
        <TabsContent value="attendance">
          <EmployeeAttendanceTab employeeId={emp.id} />
        </TabsContent>
        <TabsContent value="leaves">
          <EmployeeLeavesTab employeeId={emp.id} />
        </TabsContent>
        <TabsContent value="payroll">
          <EmployeePayrollTab employeeId={emp.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
