/**
 * Row types for the AE Design Studio bare-Postgres schema (db/schema.sql).
 * snake_case to match columns exactly (AE Rule 6). Hand-written — there is no
 * Supabase type generation anymore. Keep in sync with db/schema.sql.
 */

export type AppStatus =
  | "parsing" | "confirming" | "assembling" | "deploying" | "live" | "failed" | "downloaded";
export type SessionStage = "intake" | "clarifying" | "confirming" | "design" | "assembling" | "done";
export type AssembleStage =
  | "cloning" | "substituting" | "injecting" | "schema" | "outputting" | "done" | "error";
export type AppRole = "owner" | "admin" | "member" | "viewer";

export interface Profile {
  id: string;                 // OIDC sub
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  monthly_credits: number;
  stripe_price_id: string | null;
  stripe_price_id_annual: string | null;
  price_monthly_cents: number | null;
  price_annual_cents: number | null;
  features: unknown;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: "active" | "cancelled" | "past_due" | "trialing";
  credits_remaining: number;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditPurchase {
  id: string;
  user_id: string;
  credits: number;
  amount_cents: number;
  stripe_payment_intent_id: string | null;
  created_at: string;
}

export interface App {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  template: string;
  status: AppStatus;
  slot_map: Record<string, unknown>;
  snippets: string[];
  output_type: "deploy" | "download" | null;
  gitea_repo_url: string | null;
  coolify_app_id: string | null;
  coolify_domain: string | null;
  download_url: string | null;
  download_expires_at: string | null;
  error_message: string | null;
  credits_used: number;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  app_id: string | null;
  messages: unknown[];
  slot_map: Record<string, unknown>;
  stage: SessionStage;
  created_at: string;
  updated_at: string;
}

export interface AssembleJob {
  id: string;
  app_id: string;
  stage: AssembleStage;
  progress: number;
  log: string[] | null;
  result: unknown;
  error: string | null;
  queue_job_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  org_id: string | null;
  role: AppRole;
  created_at: string;
}

export interface BillingCustomer {
  id: string;
  user_id: string;
  customer_id: string;
  email: string | null;
  created_at: string;
}

export interface BillingSubscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string;
  plan_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UsageRecord {
  id: string;
  user_id: string;
  feature: string;
  quantity: number;
  period: string;
  recorded_at: string;
}

export interface AuditLogRow {
  id: string;
  table_name: string;
  row_id: string;
  operation: "INSERT" | "UPDATE" | "DELETE";
  old_data: unknown;
  new_data: unknown;
  changed_by: string | null;
  changed_at: string;
}

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

export interface Screen {
  id: string;
  session_id: string;
  name: string;
  purpose: string;
  screen_type: "main" | "alternative" | "error" | "empty" | "confirmation" | "mobile" | "onboarding";
  position: number;
  created_at: string;
}

export interface Variant {
  id: string;
  screen_id: string;
  storage_path: string;
  html_preview: string | null;
  is_active: boolean;
  prompt_used: string | null;
  model_used: string | null;
  trawl_sources: unknown;
  created_at: string;
}
