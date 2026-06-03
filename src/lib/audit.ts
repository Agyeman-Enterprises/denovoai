import { sql, audit } from "@/lib/db";
import type { AuditOperation, AuditEntry } from "../types/audit";

export async function writeAuditLog(
  tableName: string,
  rowId: string,
  operation: AuditOperation,
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
  changedBy: string | null
): Promise<void> {
  await audit.log({
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
  const rows = await sql<AuditEntry[]>`
    SELECT * FROM audit_log
    WHERE table_name = ${tableName} AND row_id = ${rowId}
    ORDER BY changed_at DESC`;
  return rows as AuditEntry[];
}
