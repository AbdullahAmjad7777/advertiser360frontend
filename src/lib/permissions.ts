import type { Role } from "@/types";

export function isFullAccess(role: Role): boolean {
  return role === "ceo" || role === "manager";
}

// Mirrors backend/src/permissions/permissions.js — the server enforces
// these; the UI only uses them to decide what to show.
export function canManageTasks(role: Role): boolean {
  return role === "ceo";
}

export function canManageLatePolicy(role: Role): boolean {
  return role === "ceo";
}

// Does this role take part in attendance (check-in, breaks, tasks)? The CEO
// only oversees.
export function tracksAttendance(role: Role): boolean {
  return role !== "ceo";
}

// Whether `viewer` gets the Reset password action for `target`. The server
// enforces the same rule: the CEO can reset employees and the manager, the
// manager only employees, and nobody their own password this way.
export function canResetPassword(viewer: { id: number; role: Role }, target: { id: number; role_name: string }): boolean {
  if (viewer.id === target.id || target.role_name === "ceo") return false;
  if (viewer.role === "ceo") return true;
  return viewer.role === "manager" && target.role_name === "employee";
}
