import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface Lead {
  id: string;
  owner_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_source: string | null;
  status: string;
  score: number;
  tags: string[];
  notes: string | null;
  custom_fields: Record<string, unknown>;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
}

async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll() } });
}

export async function captureLead(ownerId: string, email: string, opts: Partial<Omit<Lead, "id" | "owner_id" | "email" | "status" | "score" | "tags" | "created_at" | "updated_at">> = {}): Promise<Lead> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("ae_leads").upsert({ owner_id: ownerId, email, ...opts }, { onConflict: "owner_id,email", ignoreDuplicates: true }).select().single();
  if (error) throw error;
  return data as Lead;
}

export async function updateLeadStatus(leadId: string, status: string, notes?: string): Promise<Lead> {
  const supabase = await createClient();
  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (notes) updates.notes = notes;
  if (status === "converted") updates.converted_at = new Date().toISOString();
  const { data, error } = await supabase.from("ae_leads").update(updates).eq("id", leadId).select().single();
  if (error) throw error;
  return data as Lead;
}

export async function getLeads(status?: string, limit = 50, offset = 0): Promise<Lead[]> {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error("Unauthenticated");
  let query = supabase.from("ae_leads").select().eq("owner_id", user.id).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Lead[];
}

export async function exportLeads(status?: string): Promise<Pick<Lead, "email" | "first_name" | "last_name" | "phone" | "company" | "source" | "status">[]> {
  const leads = await getLeads(status, 10000);
  return leads.map(({ email, first_name, last_name, phone, company, source, status: s }) => ({ email, first_name, last_name, phone, company, source, status: s }));
}
