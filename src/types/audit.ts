export type AuditOperation = "INSERT" | "UPDATE" | "DELETE";

export interface AuditEntry {
  id: string;
  table_name: string;
  row_id: string;
  operation: AuditOperation;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string | null;
  changed_at: string;
}
