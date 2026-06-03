/**
 * AE Design Studio — sovereign data layer (bare Postgres via postgres.js).
 *
 * Replaces the Supabase client. There is NO RLS on this database — ownership
 * is enforced HERE, in app code. The repos below make that enforcement
 * structural: every owner-scoped method REQUIRES a `userId` argument, so
 * "forgot to scope the query" is a missing-argument type error, not a silent
 * cross-tenant data leak.
 *
 * - Owner-scoped reads/writes  → use the repos (apps, sessions, subscriptions…).
 * - Genuinely cross-user work  → admin/webhook/pipeline paths use `sql` directly
 *                                and must justify why no userId scope applies.
 */
import postgres from "postgres";
import type {
  App, Session, Subscription, CreditPurchase, AssembleJob, Plan, Profile,
  UserRole, AppRole, BillingCustomer, BillingSubscription, UsageRecord,
  Lead, ReferralCode, ReferralConversion, SocialNotification, Screen, Variant,
  AppStatus, SessionStage,
} from "@/types/db";

// ── Connection (singleton — survives HMR in dev, avoids pool exhaustion) ─────
const connectionString =
  process.env.DATABASE_URL ?? process.env.AE_DESIGN_STUDIO_DATABASE_URL;

if (!connectionString) {
  throw new Error("db: DATABASE_URL (or AE_DESIGN_STUDIO_DATABASE_URL) is not set");
}

declare global {
  // eslint-disable-next-line no-var
  var __aedsSql: ReturnType<typeof postgres> | undefined;
}

export const sql =
  global.__aedsSql ??
  postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
  });

if (process.env.NODE_ENV !== "production") global.__aedsSql = sql;

const one = <T>(rows: readonly T[]): T | null => (rows.length ? rows[0] : null);

// ── profiles (JIT-provisioned in /auth/callback) ─────────────────────────────
export const profiles = {
  async get(userId: string): Promise<Profile | null> {
    return one(await sql<Profile[]>`SELECT * FROM profiles WHERE id = ${userId}`);
  },
  /** Upsert on first login. `id` is the OIDC sub. */
  async upsert(p: { id: string; email?: string | null; display_name?: string | null; avatar_url?: string | null }): Promise<Profile> {
    const rows = await sql<Profile[]>`
      INSERT INTO profiles (id, email, display_name, avatar_url)
      VALUES (${p.id}, ${p.email ?? null}, ${p.display_name ?? null}, ${p.avatar_url ?? null})
      ON CONFLICT (id) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, profiles.email),
        display_name = COALESCE(EXCLUDED.display_name, profiles.display_name)
      RETURNING *`;
    return rows[0];
  },
};

// ── plans (public reference data — no ownership) ─────────────────────────────
export const plans = {
  async list(): Promise<Plan[]> {
    return sql<Plan[]>`SELECT * FROM plans ORDER BY monthly_credits`;
  },
  async get(id: string): Promise<Plan | null> {
    return one(await sql<Plan[]>`SELECT * FROM plans WHERE id = ${id}`);
  },
};

// ── apps (owner-scoped) ──────────────────────────────────────────────────────
export const apps = {
  async listByUser(userId: string): Promise<App[]> {
    return sql<App[]>`SELECT * FROM apps WHERE user_id = ${userId} ORDER BY created_at DESC`;
  },
  async getForUser(id: string, userId: string): Promise<App | null> {
    return one(await sql<App[]>`SELECT * FROM apps WHERE id = ${id} AND user_id = ${userId}`);
  },
  async create(userId: string, data: {
    name: string; slug: string; template: string; slot_map?: object;
    snippets?: string[]; output_type?: "deploy" | "download"; status?: AppStatus;
  }): Promise<App> {
    const rows = await sql<App[]>`
      INSERT INTO apps (user_id, name, slug, template, slot_map, snippets, output_type, status)
      VALUES (${userId}, ${data.name}, ${data.slug}, ${data.template},
              ${sql.json((data.slot_map ?? {}) as never)}, ${data.snippets ?? []},
              ${data.output_type ?? null}, ${data.status ?? "parsing"})
      RETURNING *`;
    return rows[0];
  },
  async updateForUser(id: string, userId: string, patch: Partial<Pick<App,
    "name" | "status" | "output_type" | "error_message">>): Promise<App | null> {
    return one(await sql<App[]>`
      UPDATE apps SET ${sql(patch as Record<string, unknown>)}, updated_at = now()
      WHERE id = ${id} AND user_id = ${userId} RETURNING *`);
  },
  async deleteForUser(id: string, userId: string): Promise<boolean> {
    const rows = await sql`DELETE FROM apps WHERE id = ${id} AND user_id = ${userId} RETURNING id`;
    return rows.length > 0;
  },
  /** Pipeline/service path — no user scope (assembly worker updates status). */
  async _serviceUpdateStatus(id: string, patch: Partial<App>): Promise<void> {
    await sql`UPDATE apps SET ${sql(patch as Record<string, unknown>)}, updated_at = now() WHERE id = ${id}`;
  },
};

// ── sessions (owner-scoped) ──────────────────────────────────────────────────
export const sessions = {
  async getForUser(id: string, userId: string): Promise<Session | null> {
    return one(await sql<Session[]>`SELECT * FROM sessions WHERE id = ${id} AND user_id = ${userId}`);
  },
  /** Pipeline reads session by id without a user (server-trusted context). */
  async _serviceGet(id: string): Promise<Session | null> {
    return one(await sql<Session[]>`SELECT * FROM sessions WHERE id = ${id}`);
  },
  async create(userId: string, id?: string): Promise<Session> {
    const rows = id
      ? await sql<Session[]>`INSERT INTO sessions (id, user_id) VALUES (${id}, ${userId}) RETURNING *`
      : await sql<Session[]>`INSERT INTO sessions (user_id) VALUES (${userId}) RETURNING *`;
    return rows[0];
  },
  async updateForUser(id: string, userId: string, patch: {
    messages?: unknown[]; slot_map?: object; stage?: SessionStage; app_id?: string;
  }): Promise<Session | null> {
    return one(await sql<Session[]>`
      UPDATE sessions SET ${sql(patch as Record<string, unknown>)}, updated_at = now()
      WHERE id = ${id} AND user_id = ${userId} RETURNING *`);
  },
};

// ── subscriptions / credits (owner-scoped) ───────────────────────────────────
export const subscriptions = {
  async getByUser(userId: string): Promise<Subscription | null> {
    return one(await sql<Subscription[]>`SELECT * FROM subscriptions WHERE user_id = ${userId}`);
  },
  /** JIT-provision a default free subscription on first login. Idempotent. */
  async ensure(userId: string): Promise<void> {
    await sql`
      INSERT INTO subscriptions (user_id, plan_id)
      VALUES (${userId}, 'free')
      ON CONFLICT (user_id) DO NOTHING`;
  },
  /** Atomic credit decrement — only succeeds if the user has credits left. */
  async tryConsumeCredit(userId: string): Promise<boolean> {
    const rows = await sql`
      UPDATE subscriptions SET credits_remaining = credits_remaining - 1, updated_at = now()
      WHERE user_id = ${userId} AND credits_remaining > 0 RETURNING id`;
    return rows.length > 0;
  },
  async setByStripeCustomer(stripeCustomerId: string, patch: Partial<Subscription>): Promise<void> {
    await sql`UPDATE subscriptions SET ${sql(patch as Record<string, unknown>)}, updated_at = now()
              WHERE stripe_customer_id = ${stripeCustomerId}`;
  },
  async addCredits(userId: string, n: number): Promise<void> {
    await sql`UPDATE subscriptions SET credits_remaining = credits_remaining + ${n}, updated_at = now()
              WHERE user_id = ${userId}`;
  },
};

export const creditPurchases = {
  async insert(userId: string, p: { credits: number; amount_cents: number; stripe_payment_intent_id?: string }): Promise<CreditPurchase> {
    const rows = await sql<CreditPurchase[]>`
      INSERT INTO credit_purchases (user_id, credits, amount_cents, stripe_payment_intent_id)
      VALUES (${userId}, ${p.credits}, ${p.amount_cents}, ${p.stripe_payment_intent_id ?? null})
      RETURNING *`;
    return rows[0];
  },
};

// ── assemble_jobs (ownership flows through the parent app) ────────────────────
export const assembleJobs = {
  async getForUser(jobId: string, userId: string): Promise<AssembleJob | null> {
    return one(await sql<AssembleJob[]>`
      SELECT j.* FROM assemble_jobs j
      JOIN apps a ON a.id = j.app_id
      WHERE j.id = ${jobId} AND a.user_id = ${userId}`);
  },
  async create(appId: string): Promise<AssembleJob> {
    const rows = await sql<AssembleJob[]>`INSERT INTO assemble_jobs (app_id) VALUES (${appId}) RETURNING *`;
    return rows[0];
  },
  async _serviceUpdate(id: string, patch: Partial<AssembleJob>): Promise<void> {
    await sql`UPDATE assemble_jobs SET ${sql(patch as Record<string, unknown>)}, updated_at = now() WHERE id = ${id}`;
  },
};

// ── user_roles (RBAC) ────────────────────────────────────────────────────────
export const userRoles = {
  async forUser(userId: string): Promise<UserRole[]> {
    return sql<UserRole[]>`SELECT * FROM user_roles WHERE user_id = ${userId}`;
  },
  /** Global (org_id IS NULL) admin/owner check. */
  async isGlobalAdmin(userId: string): Promise<boolean> {
    const rows = await sql`
      SELECT 1 FROM user_roles
      WHERE user_id = ${userId} AND org_id IS NULL AND role IN ('owner','admin') LIMIT 1`;
    return rows.length > 0;
  },
  async grant(userId: string, role: AppRole, orgId: string | null = null): Promise<void> {
    await sql`INSERT INTO user_roles (user_id, role, org_id) VALUES (${userId}, ${role}, ${orgId})
              ON CONFLICT (user_id, org_id, role) DO NOTHING`;
  },
};

// ── billing ──────────────────────────────────────────────────────────────────
export const billingCustomers = {
  async getByUser(userId: string): Promise<BillingCustomer | null> {
    return one(await sql<BillingCustomer[]>`SELECT * FROM billing_customers WHERE user_id = ${userId}`);
  },
  async insert(userId: string, customerId: string, email?: string): Promise<BillingCustomer> {
    const rows = await sql<BillingCustomer[]>`
      INSERT INTO billing_customers (user_id, customer_id, email)
      VALUES (${userId}, ${customerId}, ${email ?? null})
      ON CONFLICT (user_id) DO UPDATE SET customer_id = EXCLUDED.customer_id RETURNING *`;
    return rows[0];
  },
};

export const billingSubscriptions = {
  async getByUser(userId: string): Promise<BillingSubscription | null> {
    return one(await sql<BillingSubscription[]>`
      SELECT * FROM billing_subscriptions WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1`);
  },
  async upsertByStripeId(data: Partial<BillingSubscription> & { stripe_subscription_id: string; user_id: string; stripe_customer_id: string; plan_id: string; status: string }): Promise<void> {
    await sql`
      INSERT INTO billing_subscriptions ${sql(data as Record<string, unknown>)}
      ON CONFLICT (stripe_subscription_id) DO UPDATE SET
        status = EXCLUDED.status,
        current_period_end = EXCLUDED.current_period_end,
        updated_at = now()`;
  },
};

// ── usage metering (owner-scoped) ────────────────────────────────────────────
export const usage = {
  async record(userId: string, feature: string, period: string, quantity = 1): Promise<void> {
    await sql`INSERT INTO usage_records (user_id, feature, period, quantity)
              VALUES (${userId}, ${feature}, ${period}, ${quantity})`;
  },
  async sumForPeriod(userId: string, feature: string, period: string): Promise<number> {
    const rows = await sql<{ total: number }[]>`
      SELECT COALESCE(SUM(quantity),0)::int AS total FROM usage_records
      WHERE user_id = ${userId} AND feature = ${feature} AND period = ${period}`;
    return rows[0]?.total ?? 0;
  },
};

// ── audit log (changed_by supplied explicitly) ───────────────────────────────
export const audit = {
  async log(entry: {
    table_name: string; row_id: string; operation: "INSERT" | "UPDATE" | "DELETE";
    old_data?: unknown; new_data?: unknown; changed_by?: string | null;
  }): Promise<void> {
    await sql`
      INSERT INTO audit_log (table_name, row_id, operation, old_data, new_data, changed_by)
      VALUES (${entry.table_name}, ${entry.row_id}, ${entry.operation},
              ${entry.old_data ? sql.json(entry.old_data as never) : null},
              ${entry.new_data ? sql.json(entry.new_data as never) : null},
              ${entry.changed_by ?? null})`;
  },
};

// ── leads (owner-scoped) ─────────────────────────────────────────────────────
export const leads = {
  async upsert(ownerId: string, l: { email: string; first_name?: string; last_name?: string; phone?: string; company?: string; source?: string; utm_campaign?: string; utm_medium?: string; utm_source?: string }): Promise<Lead> {
    const rows = await sql<Lead[]>`
      INSERT INTO ae_leads (owner_id, email, first_name, last_name, phone, company, source, utm_campaign, utm_medium, utm_source)
      VALUES (${ownerId}, ${l.email}, ${l.first_name ?? null}, ${l.last_name ?? null}, ${l.phone ?? null},
              ${l.company ?? null}, ${l.source ?? "website"}, ${l.utm_campaign ?? null}, ${l.utm_medium ?? null}, ${l.utm_source ?? null})
      ON CONFLICT (owner_id, email) DO UPDATE SET updated_at = now()
      RETURNING *`;
    return rows[0];
  },
  async listByOwner(ownerId: string): Promise<Lead[]> {
    return sql<Lead[]>`SELECT * FROM ae_leads WHERE owner_id = ${ownerId} ORDER BY created_at DESC`;
  },
};

// ── referrals (owner-scoped) ─────────────────────────────────────────────────
export const referrals = {
  async createCode(ownerId: string, code: string, opts?: { reward_type?: string; reward_value?: number; max_uses?: number }): Promise<ReferralCode> {
    const rows = await sql<ReferralCode[]>`
      INSERT INTO ae_referral_codes (owner_id, code, reward_type, reward_value, max_uses)
      VALUES (${ownerId}, ${code}, ${opts?.reward_type ?? "credit"}, ${opts?.reward_value ?? 0}, ${opts?.max_uses ?? null})
      RETURNING *`;
    return rows[0];
  },
  async getByCode(code: string): Promise<ReferralCode | null> {
    return one(await sql<ReferralCode[]>`SELECT * FROM ae_referral_codes WHERE code = ${code} AND is_active = true`);
  },
  async recordConversion(c: { referral_code_id: string; referrer_id: string; referred_user_id?: string; referred_email?: string }): Promise<void> {
    await sql`INSERT INTO ae_referral_conversions (referral_code_id, referrer_id, referred_user_id, referred_email)
              VALUES (${c.referral_code_id}, ${c.referrer_id}, ${c.referred_user_id ?? null}, ${c.referred_email ?? null})`;
    await sql`UPDATE ae_referral_codes SET uses_count = uses_count + 1 WHERE id = ${c.referral_code_id}`;
  },
};

// ── notifications (owner-scoped) ─────────────────────────────────────────────
export const notifications = {
  async create(userId: string, n: { notification_type: string; message?: string; actor_id?: string; entity_type?: string; entity_id?: string }): Promise<SocialNotification> {
    const rows = await sql<SocialNotification[]>`
      INSERT INTO ae_social_notifications (user_id, notification_type, message, actor_id, entity_type, entity_id)
      VALUES (${userId}, ${n.notification_type}, ${n.message ?? null}, ${n.actor_id ?? null}, ${n.entity_type ?? null}, ${n.entity_id ?? null})
      RETURNING *`;
    return rows[0];
  },
  async listByUser(userId: string, limit = 50): Promise<SocialNotification[]> {
    return sql<SocialNotification[]>`
      SELECT * FROM ae_social_notifications WHERE user_id = ${userId}
      ORDER BY created_at DESC LIMIT ${limit}`;
  },
  async markRead(id: string, userId: string): Promise<void> {
    await sql`UPDATE ae_social_notifications SET is_read = true, read_at = now()
              WHERE id = ${id} AND user_id = ${userId}`;
  },
};

// ── design screens/variants (ownership via parent session) ───────────────────
export const screens = {
  async listForUser(sessionId: string, userId: string): Promise<Screen[]> {
    return sql<Screen[]>`
      SELECT s.* FROM design.screens s
      JOIN sessions ss ON ss.id = s.session_id
      WHERE s.session_id = ${sessionId} AND ss.user_id = ${userId}
      ORDER BY s.position`;
  },
  async _serviceList(sessionId: string): Promise<Screen[]> {
    return sql<Screen[]>`SELECT * FROM design.screens WHERE session_id = ${sessionId} ORDER BY position`;
  },
};

export const variants = {
  async _serviceActiveForScreen(screenId: string): Promise<Variant | null> {
    return one(await sql<Variant[]>`
      SELECT * FROM design.variants WHERE screen_id = ${screenId} AND is_active = true
      ORDER BY created_at DESC LIMIT 1`);
  },
};
