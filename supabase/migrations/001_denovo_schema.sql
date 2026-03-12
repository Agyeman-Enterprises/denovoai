-- Denovo schema for denovoai tables (shared Supabase project with designai)
CREATE SCHEMA IF NOT EXISTS denovo;
GRANT USAGE ON SCHEMA denovo TO anon, authenticated, service_role;

-- User profiles (mirrors auth.users)
CREATE TABLE IF NOT EXISTS denovo.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions (Stripe-backed)
CREATE TABLE IF NOT EXISTS denovo.subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_price_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Runs (AI generation runs per user)
CREATE TABLE IF NOT EXISTS denovo.runs (
  id TEXT PRIMARY KEY DEFAULT 'run-' || substr(gen_random_uuid()::text, 1, 8),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  mode TEXT DEFAULT 'auto',
  status TEXT NOT NULL DEFAULT 'pending',
  artifacts_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Monthly run counts helper
CREATE TABLE IF NOT EXISTS denovo.run_counts (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month)
);

-- Enable RLS
ALTER TABLE denovo.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE denovo.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE denovo.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE denovo.run_counts ENABLE ROW LEVEL SECURITY;

-- Profiles: own row only
CREATE POLICY "profiles_self" ON denovo.profiles
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Subscriptions: read own, service role manages
CREATE POLICY "subscriptions_read_own" ON denovo.subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_service_all" ON denovo.subscriptions
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Runs: own rows only
CREATE POLICY "runs_own" ON denovo.runs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Run counts: own rows only
CREATE POLICY "run_counts_own" ON denovo.run_counts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Auto-create profile + free subscription on signup
CREATE OR REPLACE FUNCTION denovo.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO denovo.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO denovo.subscriptions (id, user_id, plan, status)
  VALUES ('sub_free_' || NEW.id::text, NEW.id, 'free', 'active')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION denovo.handle_new_user();
