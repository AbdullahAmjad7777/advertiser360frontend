import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const SIDEBAR_EXPANDED_WIDTH = "w-64";
// Wide enough to fit the logo mark + toggle button side by side without
// crowding (28px mark + 32px button + gap needs ~72px of usable space).
const SIDEBAR_COLLAPSED_WIDTH = "w-[88px]";

export function AppShell() {
  const { user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  return (
    <div className="flex min-h-svh">
      <aside
        className={cn(
          "hidden shrink-0 transition-[width] duration-200 ease-in-out md:block",
          collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH,
        )}
      >
        <div
          className={cn(
            "fixed h-svh transition-[width] duration-200 ease-in-out",
            collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH,
          )}
        >
          <Sidebar user={user} collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40 duration-200 animate-in fade-in-0"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 duration-200 animate-in slide-in-from-left">
            <Sidebar
              user={user}
              onNavigate={() => setMobileNavOpen(false)}
              onClose={() => setMobileNavOpen(false)}
            />
          </div>
        </div>
      )}

      <div
        className={cn(
          "flex min-h-svh flex-1 flex-col",
          mobileNavOpen && "pointer-events-none md:pointer-events-auto",
        )}
      >
        <Topbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
