-- User profiles (extends Supabase auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text check (role in ('user', 'admin')) default 'user',
  created_at timestamptz default now()
);

-- Subscription plans
create table if not exists plans (
  id text primary key,
  name text not null,
  monthly_credits int not null,
  stripe_price_id text,
  stripe_price_id_annual text,
  price_monthly_cents int,
  price_annual_cents int,
  features jsonb default '[]',
  created_at timestamptz default now()
);

-- User subscriptions (Stripe-synced)
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade unique,
  plan_id text references plans(id) default 'free',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text check (status in ('active','cancelled','past_due','trialing')) default 'active',
  credits_remaining int not null default 1,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Credit top-ups (one-time purchases)
create table if not exists credit_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  credits int not null,
  amount_cents int not null,
  stripe_payment_intent_id text unique,
  created_at timestamptz default now()
);

-- Generated apps
create table if not exists apps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  slug text not null,
  template text not null,
  status text check (status in (
    'parsing','confirming','assembling','deploying','live','failed','downloaded'
  )) default 'parsing',
  slot_map jsonb not null default '{}',
  snippets text[] default '{}',
  output_type text check (output_type in ('deploy','download')),
  gitea_repo_url text,
  coolify_app_id text,
  coolify_domain text,
  download_url text,
  download_expires_at timestamptz,
  error_message text,
  credits_used int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Intent Parser conversation sessions
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  app_id uuid references apps(id) on delete cascade,
  messages jsonb not null default '[]',
  slot_map jsonb default '{}',
  stage text check (stage in (
    'intake','clarifying','confirming','assembling','done'
  )) default 'intake',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Assemble job progress
create table if not exists assemble_jobs (
  id uuid primary key default gen_random_uuid(),
  app_id uuid references apps(id) on delete cascade,
  stage text check (stage in (
    'cloning','substituting','injecting','schema','outputting','done','error'
  )) default 'cloning',
  progress int default 0,
  log text[],
  result jsonb,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table credit_purchases enable row level security;
alter table apps enable row level security;
alter table sessions enable row level security;
alter table assemble_jobs enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own subscription" on subscriptions for all using (auth.uid() = user_id);
create policy "own credit purchases" on credit_purchases for all using (auth.uid() = user_id);
create policy "own apps" on apps for all using (auth.uid() = user_id);
create policy "own sessions" on sessions for all using (auth.uid() = user_id);
create policy "own jobs" on assemble_jobs for select using (
  auth.uid() = (select user_id from apps where id = app_id)
);

alter table plans enable row level security;
create policy "public read plans" on plans for select using (true);

-- Seed plans
insert into plans (id, name, monthly_credits, price_monthly_cents, price_annual_cents, features) values
('free',    'Free',    1,  0,      0,      '["1 app", "Download only", "Community templates"]'),
('starter', 'Starter', 5,  2900,   29000,  '["5 apps/month", "Auto-deploy", "All templates", "Email support"]'),
('pro',     'Pro',     15, 7900,   79000,  '["15 apps/month", "Priority deploy", "Custom snippets", "Priority support"]'),
('agency',  'Agency',  50, 19900,  199000, '["50 apps/month", "White label", "API access", "Dedicated support"]')
on conflict (id) do nothing;

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name, avatar_url)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url');
  insert into subscriptions (user_id, plan_id, credits_remaining)
  values (new.id, 'free', 1);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
