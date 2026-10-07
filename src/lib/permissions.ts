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
