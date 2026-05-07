import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface SocialNotification {
  id: string;
  user_id: string;
  actor_id: string | null;
  notification_type: string;
  entity_type: string | null;
  entity_id: string | null;
  message: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => cookieStore.getAll() } });
}

export async function createNotification(userId: string, notificationType: string, opts: Partial<Pick<SocialNotification, "actor_id" | "entity_type" | "entity_id" | "message">> = {}): Promise<SocialNotification> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("ae_social_notifications").insert({ user_id: userId, notification_type: notificationType, ...opts }).select().single();
  if (error) throw error;
  return data as SocialNotification;
}

export async function markRead(notificationId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("ae_social_notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("id", notificationId);
  if (error) throw error;
}

export async function markAllRead(): Promise<void> {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error("Unauthenticated");
  const { error } = await supabase.from("ae_social_notifications").update({ is_read: true, read_at: new Date().toISOString() }).eq("user_id", user.id).eq("is_read", false);
  if (error) throw error;
}

export async function getNotifications(limit = 30, onlyUnread = false): Promise<SocialNotification[]> {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error("Unauthenticated");
  let query = supabase.from("ae_social_notifications").select().eq("user_id", user.id).order("created_at", { ascending: false }).limit(limit);
  if (onlyUnread) query = query.eq("is_read", false);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as SocialNotification[];
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return 0;
  const { count, error } = await supabase.from("ae_social_notifications").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false);
  if (error) throw error;
  return count ?? 0;
}
