import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import * as employeesApi from "@/api/employees";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useLookups } from "@/hooks/useLookups";
import { getErrorMessage } from "@/lib/api-client";
import type { Employee } from "@/types";

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  managers: Employee[];
  onSaved: () => void;
}

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  cnicNumber: string;
  gender: "male" | "female" | "other" | "";
  dateOfBirth: string;
  departmentId: string;
  designationId: string;
  roleId: string;
  managerId: string;
  joinDate: string;
  baseSalary: string;
}

const EMPTY_FORM: FormState = {
  fullName: "",
  email: "",
  phone: "",
  cnicNumber: "",
  gender: "",
  dateOfBirth: "",
  departmentId: "",
  designationId: "",
  roleId: "",
  managerId: "",
  joinDate: "",
  baseSalary: "",
};

function employeeToForm(employee: Employee): FormState {
  return {
    fullName: employee.full_name,
    email: employee.email,
    phone: employee.phone ?? "",
    cnicNumber: employee.cnic_number ?? "",
    gender: employee.gender ?? "",
    dateOfBirth: employee.date_of_birth ?? "",
    departmentId: employee.department_id ? String(employee.department_id) : "",
    designationId: employee.designation_id ? String(employee.designation_id) : "",
    roleId: String(employee.role_id),
    managerId: employee.manager_id ? String(employee.manager_id) : "",
    joinDate: employee.join_date,
    baseSalary: employee.base_salary,
  };
}

// Create is handled entirely by the invite-and-self-onboard flow (see
// InviteEmployeeDialog / OnboardingPage) — this dialog only ever edits an
// existing employee now.
export function EmployeeFormDialog({
  open,
  onOpenChange,
  employee,
  managers,
  onSaved,
}: EmployeeFormDialogProps) {
  const { departments, designations, roles } = useLookups();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(employee ? employeeToForm(employee) : EMPTY_FORM);
    }
  }, [open, employee]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateFromSelect(key: keyof FormState, value: string | null) {
    update(key, (value ?? "") as FormState[typeof key]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!employee) return;
    setSubmitting(true);
    try {
      await employeesApi.updateEmployee(employee.id, {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || undefined,
        cnicNumber: form.cnicNumber || undefined,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        designationId: form.designationId ? Number(form.designationId) : undefined,
        roleId: form.roleId ? Number(form.roleId) : undefined,
        managerId: form.managerId ? Number(form.managerId) : undefined,
        joinDate: form.joinDate || undefined,
        baseSalary: form.baseSalary ? Number(form.baseSalary) : undefined,
      });
      toast.success("Employee updated");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save employee"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit employee</DialogTitle>
          <DialogDescription>Update this employee's details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                required
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cnicNumber">CNIC number</Label>
              <Input
                id="cnicNumber"
                value={form.cnicNumber}
                onChange={(e) => update("cnicNumber", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Gender</Label>
              <Select
                value={form.gender}
                onValueChange={(v) => update("gender", (v ?? "") as FormState["gender"])}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="dateOfBirth">Date of birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => update("dateOfBirth", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Department</Label>
              <Select
                value={form.departmentId}
                onValueChange={(v) => updateFromSelect("departmentId", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Designation</Label>
              <Select
                value={form.designationId}
                onValueChange={(v) => updateFromSelect("designationId", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {designations
                    .filter(
                      (d) =>
                        !form.departmentId || String(d.department_id) === form.departmentId,
                    )
                    .map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.designation_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <Select value={form.roleId} onValueChange={(v) => updateFromSelect("roleId", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)} className="capitalize">
                      {r.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Manager</Label>
              <Select value={form.managerId} onValueChange={(v) => updateFromSelect("managerId", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  {managers
                    .filter((m) => !employee || m.id !== employee.id)
                    .map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="joinDate">Join date</Label>
              <Input
                id="joinDate"
                type="date"
                value={form.joinDate}
                onChange={(e) => update("joinDate", e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="baseSalary">Base salary</Label>
              <Input
                id="baseSalary"
                type="number"
                min={0}
                step="0.01"
                value={form.baseSalary}
                onChange={(e) => update("baseSalary", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
