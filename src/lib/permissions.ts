import type { Role } from "@/types";

export function isFullAccess(role: Role): boolean {
  return role === "ceo" || role === "manager";
}
