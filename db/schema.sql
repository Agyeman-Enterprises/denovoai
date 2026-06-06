-- ============================================================================
-- AE Design Studio — canonical schema (bare Postgres, sovereign)
-- Target: denovoai-db on Aurora, port 5433.  Postgres 16.
--
-- This REPLACES the Supabase-era supabase/migrations/*.sql. Differences:
--   * No `auth.users` — `profiles.id` IS the user id (= ae-auth OIDC `sub`).
--   * No RLS, no `auth.uid()` — ownership is enforced in app code
--     (every query carries an explicit WHERE user_id = <sub>).
--   * No auth triggers — profiles/subscriptions are JIT-provisioned in
--     /auth/callback on first login.
--
-- Idempotent: safe to re-run. CREATE ... IF NOT EXISTS throughout; the
-- 7 pre-existing tables (apps, assemble_jobs, credit_purchases, plans,
-- profiles, sessions, subscriptions) are left intact.
--
-- DEFERRED (no source migration — derive from src/lib/design-memory types):
--   trawl_sources, trawl_screenshots, trawl_runs  (design-inspiration crawler)
-- ============================================================================

-- ── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

-- ── Enums ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('owner', 'admin', 'member', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Users (profiles) — keyed by OIDC sub, no FK to any auth schema ──────────
CREATE TABLE IF NOT EXISTS profiles (
  id           uuid PRIMARY KEY,                       -- ae-auth OIDC sub
  email        text,
  display_name text,
  avatar_url   text,
  role         text CHECK (role IN ('user','admin')) DEFAULT 'user',
  created_at   timestamptz DEFAULT now()
);

-- ── Plans / subscriptions / credits ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plans (
  id                     text PRIMARY KEY,
  name                   text NOT NULL,
  monthly_credits        int  NOT NULL,
  stripe_price_id        text,
  stripe_price_id_annual text,
  price_monthly_cents    int,
  price_annual_cents     int,
  features               jsonb DEFAULT '[]',
  created_at             timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  plan_id                text REFERENCES plans(id) DEFAULT 'free',
  stripe_customer_id     text UNIQUE,
  stripe_subscription_id text UNIQUE,
  status                 text CHECK (status IN ('active','cancelled','past_due','trialing')) DEFAULT 'active',
  credits_remaining      int NOT NULL DEFAULT 1,
  current_period_end     timestamptz,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credit_purchases (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid REFERENCES profiles(id) ON DELETE CASCADE,
  credits                  int NOT NULL,
  amount_cents             int NOT NULL,
  stripe_payment_intent_id text UNIQUE,
  created_at               timestamptz DEFAULT now()
);

-- ── Generated apps / studio sessions / assembly jobs ────────────────────────
CREATE TABLE IF NOT EXISTS apps (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name                text NOT NULL,
  slug                text NOT NULL,
  template            text NOT NULL,
  status              text CHECK (status IN
                        ('parsing','confirming','assembling','deploying','live','failed','downloaded'))
                        DEFAULT 'parsing',
  slot_map            jsonb NOT NULL DEFAULT '{}',
  snippets            text[] DEFAULT '{}',
  output_type         text CHECK (output_type IN ('deploy','download')),
  gitea_repo_url      text,
  coolify_app_id      text,
  coolify_domain      text,
  download_url        text,
  download_expires_at timestamptz,
  error_message       text,
  credits_used        int DEFAULT 1,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
-- Dashboard hot path: apps by user, newest first (scale index per audit)
CREATE INDEX IF NOT EXISTS apps_user_created_idx ON apps (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS sessions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  app_id     uuid REFERENCES apps(id) ON DELETE CASCADE,
  messages   jsonb NOT NULL DEFAULT '[]',
  slot_map   jsonb DEFAULT '{}',
  stage      text CHECK (stage IN ('intake','clarifying','confirming','design','assembling','done')) DEFAULT 'intake',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS assemble_jobs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id     uuid REFERENCES apps(id) ON DELETE CASCADE,
  stage      text CHECK (stage IN
               ('cloning','substituting','injecting','schema','outputting','done','error'))
               DEFAULT 'cloning',
  progress   int DEFAULT 0,
  log        text[],
  result     jsonb,
  error      text,
  queue_job_id text,                                   -- ae-queue job id (Phase 4)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS assemble_jobs_app_idx ON assemble_jobs (app_id);

-- ── RBAC ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id     uuid,                                     -- null = global/app-level
  role       app_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, org_id, role)
);
CREATE INDEX IF NOT EXISTS user_roles_user_idx ON user_roles (user_id);

-- ── Billing (Stripe-standard) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS billing_customers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  customer_id text NOT NULL UNIQUE,
  email       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id     text NOT NULL,
  plan_id                text NOT NULL,
  status                 text NOT NULL DEFAULT 'active',
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  cancel_at              timestamptz,
  canceled_at            timestamptz,
  trial_start            timestamptz,
  trial_end              timestamptz,
  metadata               jsonb NOT NULL DEFAULT '{}',
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_billing_subs_user   ON billing_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_billing_subs_status ON billing_subscriptions (status);

CREATE TABLE IF NOT EXISTS usage_records (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  feature     text NOT NULL,
  quantity    int  NOT NULL DEFAULT 1,
  period      text NOT NULL,                           -- YYYY-MM
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_usage_user_feature_period ON usage_records (user_id, feature, period);

-- ── Audit log (changed_by supplied by app; no auth.uid trigger) ─────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  row_id     text NOT NULL,
  operation  text NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  old_data   jsonb,
  new_data   jsonb,
  changed_by uuid,                                     -- profiles.id, set by app
  changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_table_idx ON audit_log (table_name, changed_at DESC);

-- ── Leads ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ae_leads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email         text NOT NULL,
  first_name    text,
  last_name     text,
  phone         text,
  company       text,
  source        text NOT NULL DEFAULT 'website',
  utm_campaign  text,
  utm_medium    text,
  utm_source    text,
  status        text NOT NULL DEFAULT 'new',
  score         integer NOT NULL DEFAULT 0,
  tags          text[] NOT NULL DEFAULT '{}'::text[],
  notes         text,
  custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  converted_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, email)
);

-- ── Referrals ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ae_referral_codes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code         text NOT NULL UNIQUE,
  is_active    boolean NOT NULL DEFAULT true,
  max_uses     integer,
  uses_count   integer NOT NULL DEFAULT 0,
  reward_type  text NOT NULL DEFAULT 'credit',
  reward_value integer NOT NULL DEFAULT 0,
  expires_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ae_referral_conversions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id uuid NOT NULL REFERENCES ae_referral_codes(id) ON DELETE CASCADE,
  referrer_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  referred_email   text,
  converted_at     timestamptz NOT NULL DEFAULT now(),
  reward_issued    boolean NOT NULL DEFAULT false,
  reward_issued_at timestamptz
);

-- ── Notifications ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ae_social_notifications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id          uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notification_type text NOT NULL,
  entity_type       text,
  entity_id         text,
  message           text,
  is_read           boolean NOT NULL DEFAULT false,
  read_at           timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ae_social_notif_user_idx
  ON ae_social_notifications (user_id, is_read, created_at DESC);

-- ── Design schema: screen inventory + generated variants ────────────────────
CREATE SCHEMA IF NOT EXISTS design;

CREATE TABLE IF NOT EXISTS design.screens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  name        text NOT NULL,
  purpose     text NOT NULL,
  screen_type text NOT NULL DEFAULT 'main'
              CHECK (screen_type IN ('main','alternative','error','empty',
                                     'confirmation','mobile','onboarding')),
  position    int NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS screens_session_idx  ON design.screens (session_id);
CREATE INDEX IF NOT EXISTS screens_position_idx ON design.screens (session_id, position);

CREATE TABLE IF NOT EXISTS design.variants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id     uuid NOT NULL REFERENCES design.screens(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,
  html_preview  text,
  is_active     boolean NOT NULL DEFAULT true,
  prompt_used   text,
  model_used    text,
  trawl_sources jsonb,
  created_at    timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS variants_screen_idx ON design.variants (screen_id);
CREATE INDEX IF NOT EXISTS variants_active_idx ON design.variants (screen_id, is_active);

-- ── Seed: plans (reference data) ────────────────────────────────────────────
INSERT INTO plans (id, name, monthly_credits, price_monthly_cents, price_annual_cents, features) VALUES
('free',    'Free',    1,  0,     0,      '["1 app", "Download only", "Community templates"]'),
('starter', 'Starter', 5,  2900,  29000,  '["5 apps/month", "Auto-deploy", "All templates", "Email support"]'),
('pro',     'Pro',     15, 7900,  79000,  '["15 apps/month", "Priority deploy", "Custom snippets", "Priority support"]'),
('agency',  'Agency',  50, 19900, 199000, '["50 apps/month", "White label", "API access", "Dedicated support"]')
ON CONFLICT (id) DO NOTHING;
