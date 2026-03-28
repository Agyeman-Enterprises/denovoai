"use client";

import { useRole } from "@/lib/permissions/hooks";

export function PermissionGate({ check, children, fallback }: { check: (role: string) => boolean; children: React.ReactNode; fallback?: React.ReactNode }) {
  const { role, loading } = useRole();
  if (loading) return null;
  return check(role) ? <>{children}</> : <>{fallback ?? null}</>;
}
