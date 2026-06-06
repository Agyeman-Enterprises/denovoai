import { sql, referrals } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import type { ReferralCode, ReferralConversion } from "@/types/db";

export type { ReferralCode, ReferralConversion } from "@/types/db";

export async function generateCode(
  rewardType = "credit",
  rewardValue = 0,
  opts: Partial<Pick<ReferralCode, "max_uses" | "expires_at">> = {},
): Promise<ReferralCode> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthenticated");
  const prefix = user.id.slice(0, 6).toUpperCase();
  const suffix = Array.from(crypto.getRandomValues(new Uint8Array(4))).map((b) => b.toString(16)).join("").toUpperCase();
  const code = `${prefix}-${suffix}`;
  return referrals.createCode(user.id, code, {
    reward_type: rewardType,
    reward_value: rewardValue,
    max_uses: opts.max_uses ?? undefined,
  });
}

export async function trackReferral(code: string): Promise<ReferralCode | null> {
  const rc = await referrals.getByCode(code);
  if (!rc) return null;
  if (rc.expires_at && new Date(rc.expires_at) < new Date()) return null;
  if (rc.max_uses !== null && rc.uses_count >= rc.max_uses) return null;
  return rc;
}

export async function convertReferral(
  codeId: string,
  referrerId: string,
  referredEmail?: string,
  referredUserId?: string,
): Promise<void> {
  await referrals.recordConversion({
    referral_code_id: codeId,
    referrer_id: referrerId,
    referred_email: referredEmail,
    referred_user_id: referredUserId,
  });
}

export async function getReferralStats(): Promise<{
  total_referrals: number; total_conversions: number; conversion_rate: number; codes: ReferralCode[];
}> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthenticated");
  const [codes, conversions] = await Promise.all([
    sql<ReferralCode[]>`SELECT * FROM ae_referral_codes WHERE owner_id = ${user.id}`,
    sql<{ id: string }[]>`SELECT id FROM ae_referral_conversions WHERE referrer_id = ${user.id}`,
  ]);
  const totalReferrals = codes.reduce((s, c) => s + c.uses_count, 0);
  const totalConversions = conversions.length;
  return {
    total_referrals: totalReferrals,
    total_conversions: totalConversions,
    conversion_rate: totalReferrals > 0 ? totalConversions / totalReferrals : 0,
    codes,
  };
}
