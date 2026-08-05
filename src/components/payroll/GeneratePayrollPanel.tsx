import { useState } from "react";
import { toast } from "sonner";
import * as payrollApi from "@/api/payroll";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/api-client";
import { monthName } from "@/lib/format";
import type { Employee } from "@/types";

export function GeneratePayrollPanel({
  employees,
  onGenerated,
}: {
  employees: Employee[];
  onGenerated: () => void;
}) {
  const now = new Date();
  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [submitting, setSubmitting] = useState(false);

  async function handleGenerate() {
    if (!employeeId) {
      toast.error("Select an employee first");
      return;
    }
    setSubmitting(true);
    try {
      await payrollApi.generatePayroll({
        employeeId: Number(employeeId),
        month: Number(month),
        year: Number(year),
      });
      toast.success("Payroll generated");
      onGenerated();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to generate payroll"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Payroll</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-2">
          <Label>Employee</Label>
          <Select value={employeeId} onValueChange={(v) => setEmployeeId(v ?? "")}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={String(emp.id)}>
                  {emp.full_name} ({emp.employee_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Month</Label>
          <Select value={month} onValueChange={(v) => setMonth(v ?? month)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {monthName(m)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="payroll-year">Year</Label>
          <Input
            id="payroll-year"
            type="number"
            className="w-24"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
        </div>
        <Button onClick={handleGenerate} disabled={submitting}>
          {submitting ? "Generating..." : "Generate"}
        </Button>
      </CardContent>
    </Card>
  );
}
