import { createServiceClient } from "@/lib/supabase/server";
import type { AuditOperation, AuditEntry } from "../types/audit";

export async function writeAuditLog(
  tableName: string,
  rowId: string,
  operation: AuditOperation,
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
  changedBy: string | null
): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("audit_log").insert({
    table_name: tableName,
    row_id: rowId,
    operation,
    old_data: oldData,
    new_data: newData,
    changed_by: changedBy,
  });
}

export async function getAuditLog(
  tableName: string,
  rowId: string
): Promise<AuditEntry[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .eq("table_name", tableName)
    .eq("row_id", rowId)
    .order("changed_at", { ascending: false });
  if (error) throw new Error(`Audit log query failed: ${error.message}`);
  return (data ?? []) as AuditEntry[];
}
