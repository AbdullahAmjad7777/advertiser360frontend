import { EmployeeDashboard } from "@/components/dashboard/EmployeeDashboard";
import { FullAccessDashboard } from "@/components/dashboard/FullAccessDashboard";
import { useAuth } from "@/hooks/useAuth";
import { isFullAccess } from "@/lib/permissions";

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  const fullAccess = isFullAccess(user.role);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {user.full_name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {fullAccess ? "Company-wide overview" : "Your daily summary"}
        </p>
      </div>
      {fullAccess ? <FullAccessDashboard /> : <EmployeeDashboard />}
    </div>
  );
}
