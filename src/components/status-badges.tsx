import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AttendanceStatus, LeaveStatus, PayrollStatus } from "@/types";

const ATTENDANCE_STYLES: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  late: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  half_day: "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-400",
  absent: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400",
  on_leave: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400",
  holiday: "bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400",
};

const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  late: "Late",
  half_day: "Half day",
  absent: "Absent",
  on_leave: "On leave",
  holiday: "Holiday",
};

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <Badge className={cn("font-normal", ATTENDANCE_STYLES[status])}>
      {ATTENDANCE_LABELS[status]}
    </Badge>
  );
}

const LEAVE_STYLES: Record<LeaveStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400",
};

export function LeaveStatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <Badge className={cn("font-normal capitalize", LEAVE_STYLES[status])}>{status}</Badge>
  );
}

const PAYROLL_STYLES: Record<PayrollStatus, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-400",
  finalized: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
};

export function PayrollStatusBadge({ status }: { status: PayrollStatus }) {
  return (
    <Badge className={cn("font-normal capitalize", PAYROLL_STYLES[status])}>{status}</Badge>
  );
}
