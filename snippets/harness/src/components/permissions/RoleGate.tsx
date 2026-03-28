"use client";

import { useRole } from "@/lib/permissions/hooks";
import type { Role } from "@/lib/permissions/roles";

export function RoleGate({ requiredRole, children, fallback }: { requiredRole: Role; children: React.ReactNode; fallback?: React.ReactNode }) {
  const { hasRole, loading } = useRole();
  if (loading) return null;
  return hasRole(requiredRole) ? <>{children}</> : <>{fallback ?? null}</>;
}
