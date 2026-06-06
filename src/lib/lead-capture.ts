import { sql } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import type { Lead } from "@/types/db";

export type { Lead } from "@/types/db";

export async function captureLead(
  ownerId: string,
  email: string,
  opts: Partial<Omit<Lead, "id" | "owner_id" | "email" | "status" | "score" | "tags" | "created_at" | "updated_at">> = {},
): Promise<Lead> {
  const row = { owner_id: ownerId, email, ...opts } as Record<string, unknown>;
  const rows = await sql<Lead[]>`
    INSERT INTO ae_leads ${sql(row)}
    ON CONFLICT (owner_id, email) DO UPDATE SET updated_at = now()
    RETURNING *`;
  return rows[0];
}

export async function updateLeadStatus(leadId: string, status: string, notes?: string): Promise<Lead> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthenticated");
  const patch: Record<string, unknown> = { status };
  if (notes) patch.notes = notes;
  if (status === "converted") patch.converted_at = new Date().toISOString();
  const rows = await sql<Lead[]>`
    UPDATE ae_leads SET ${sql(patch)}, updated_at = now()
    WHERE id = ${leadId} AND owner_id = ${user.id}
    RETURNING *`;
  if (!rows[0]) throw new Error("Lead not found");
  return rows[0];
}

export async function getLeads(status?: string, limit = 50, offset = 0): Promise<Lead[]> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthenticated");
  return sql<Lead[]>`
    SELECT * FROM ae_leads
    WHERE owner_id = ${user.id} ${status ? sql`AND status = ${status}` : sql``}
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}`;
}

export async function exportLeads(status?: string): Promise<Pick<Lead, "email" | "first_name" | "last_name" | "phone" | "company" | "source" | "status">[]> {
  const list = await getLeads(status, 10000);
  return list.map(({ email, first_name, last_name, phone, company, source, status: s }) => ({ email, first_name, last_name, phone, company, source, status: s }));
}
