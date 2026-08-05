import { Menu, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getNavItems } from "./nav-items";
import type { AuthUser } from "@/types";

interface SidebarProps {
  user: AuthUser;
  onNavigate?: () => void;
  /** Desktop icon-only rail mode. Never applies to the mobile drawer. */
  collapsed?: boolean;
  /** Shows the hamburger toggle when provided (desktop rail only). */
  onToggleCollapse?: () => void;
  /** Shows a close button when provided (mobile drawer only). */
  onClose?: () => void;
}

export function Sidebar({
  user,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
  onClose,
}: SidebarProps) {
  const navItems = getNavItems(user);

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div
        className={cn(
          "flex h-16 items-center justify-between border-b border-sidebar-border transition-[padding] duration-200",
          collapsed ? "px-2" : "px-5",
        )}
      >
        {/* shrink-0 wrapper (not min-w-0) so flexbox never squeezes it below
            its actual rendered size — the mark stays visible no matter what;
            only the text span's own explicit width collapses it to 0. */}
        <div className="flex shrink-0 items-center gap-2.5 overflow-hidden">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
            A
          </span>
          <span
            className={cn(
              "overflow-hidden text-base font-semibold tracking-tight whitespace-nowrap transition-all duration-200",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
            )}
          >
            Advertiser<span className="text-sidebar-primary">360</span>
          </span>
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={!collapsed}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Menu className="size-4" />
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <nav
        className={cn(
          "flex flex-1 flex-col gap-1 py-4 transition-[padding] duration-200",
          collapsed ? "px-2" : "px-3",
        )}
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center overflow-hidden rounded-lg py-2 text-sm font-medium transition-all",
                collapsed ? "justify-center px-0" : "gap-2.5 px-3",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm shadow-sidebar-primary/20"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )
            }
          >
            <item.icon className="size-4 shrink-0 transition-transform group-hover:scale-105" />
            <span
              className={cn(
                "truncate transition-all duration-200",
                collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
              )}
            >
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>
      <div
        className={cn(
          "truncate border-t border-sidebar-border text-xs text-sidebar-foreground/50 transition-all duration-200",
          collapsed ? "h-0 px-5 py-0 opacity-0" : "h-auto px-5 py-4 opacity-100",
        )}
      >
        Advertiser360 HRMS
      </div>
    </div>
  );
}
