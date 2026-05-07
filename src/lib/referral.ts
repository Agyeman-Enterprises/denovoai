import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface ReferralCode {
  id: string;
  owner_id: string;
  code: string;
  is_active: boolean;
  max_uses: number | null;
  uses_count: number;
  reward_type: string;
  reward_value: number;
  expires_at: string | null;
  created_at: string;
}

export interface ReferralConversion {
  id: string;
  referral_code_id: string;
  referrer_id: string;
  referred_user_id: string | null;
  referred_email: string | null;
  converted_at: string;
  reward_issued: boolean;
  reward_issued_at: string | null;
}

async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
}

export async function generateCode(rewardType = "credit", rewardValue = 0, opts: Partial<Pick<ReferralCode, "max_uses" | "expires_at">> = {}): Promise<ReferralCode> {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error("Unauthenticated");
  const prefix = user.id.slice(0, 6).toUpperCase();
  const suffix = Array.from(crypto.getRandomValues(new Uint8Array(4))).map(b => b.toString(16)).join("").toUpperCase();
  const code = `${prefix}-${suffix}`;
  const { data, error } = await supabase.from("ae_referral_codes").insert({ owner_id: user.id, code, reward_type: rewardType, reward_value: rewardValue, ...opts }).select().single();
  if (error) throw error;
  return data as ReferralCode;
}

export async function trackReferral(code: string): Promise<ReferralCode | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("ae_referral_codes").select().eq("code", code).eq("is_active", true).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const rc = data as ReferralCode;
  if (rc.expires_at && new Date(rc.expires_at) < new Date()) return null;
  if (rc.max_uses !== null && rc.uses_count >= rc.max_uses) return null;
  return rc;
}

export async function convertReferral(codeId: string, referrerId: string, referredEmail?: string, referredUserId?: string): Promise<ReferralConversion> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("ae_referral_conversions").insert({ referral_code_id: codeId, referrer_id: referrerId, referred_email: referredEmail ?? null, referred_user_id: referredUserId ?? null }).select().single();
  if (error) throw error;
  const { data: rc } = await supabase.from("ae_referral_codes").select("uses_count").eq("id", codeId).single();
  if (rc) await supabase.from("ae_referral_codes").update({ uses_count: (rc as { uses_count: number }).uses_count + 1 }).eq("id", codeId);
  return data as ReferralConversion;
}

export async function getReferralStats(): Promise<{ total_referrals: number; total_conversions: number; conversion_rate: number; codes: ReferralCode[] }> {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error("Unauthenticated");
  const [{ data: codes }, { data: conversions }] = await Promise.all([supabase.from("ae_referral_codes").select().eq("owner_id", user.id), supabase.from("ae_referral_conversions").select("id").eq("referrer_id", user.id)]);
  const codeList = (codes ?? []) as ReferralCode[];
  const totalReferrals = codeList.reduce((s, c) => s + c.uses_count, 0);
  const totalConversions = (conversions ?? []).length;
  return { total_referrals: totalReferrals, total_conversions: totalConversions, conversion_rate: totalReferrals > 0 ? totalConversions / totalReferrals : 0, codes: codeList };
}
