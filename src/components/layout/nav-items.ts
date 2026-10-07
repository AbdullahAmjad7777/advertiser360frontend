import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Wallet,
  UserCircle,
  Settings,
  ListChecks,
  Coffee,
} from "lucide-react";
import type { AuthUser } from "@/types";
import { isFullAccess } from "@/lib/permissions";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export function getNavItems(user: AuthUser): NavItem[] {
  const fullAccess = isFullAccess(user.role);

  return [
    { label: "Dashboard", to: "/", icon: LayoutDashboard },
    ...(fullAccess
      ? [{ label: "Employees", to: "/employees", icon: Users }]
      : [{ label: "My Profile", to: `/employees/${user.id}`, icon: UserCircle }]),
    { label: "Tasks", to: "/tasks", icon: ListChecks },
    { label: "Breaks", to: "/breaks", icon: Coffee },
    { label: "Leaves", to: "/leaves", icon: CalendarDays },
    { label: "Payroll", to: "/payroll", icon: Wallet },
    ...(fullAccess ? [{ label: "Settings", to: "/settings", icon: Settings }] : []),
  ];
}
