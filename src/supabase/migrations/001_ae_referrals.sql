-- ae_referral_codes: unique referral codes per user
create table if not exists ae_referral_codes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique,
  is_active boolean not null default true,
  max_uses integer,
  uses_count integer not null default 0,
  reward_type text not null default 'credit',
  reward_value integer not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists ae_referral_conversions (
  id uuid primary key default gen_random_uuid(),
  referral_code_id uuid not null references ae_referral_codes(id) on delete cascade,
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid references auth.users(id) on delete set null,
  referred_email text,
  converted_at timestamptz not null default now(),
  reward_issued boolean not null default false,
  reward_issued_at timestamptz
);

alter table ae_referral_codes enable row level security;
alter table ae_referral_conversions enable row level security;

create policy "owners read own codes" on ae_referral_codes for select using (auth.uid() = owner_id);
create policy "owners manage own codes" on ae_referral_codes for all using (auth.uid() = owner_id);
create policy "public read active codes" on ae_referral_codes for select using (is_active = true);
create policy "referrers read own conversions" on ae_referral_conversions for select using (auth.uid() = referrer_id);
create policy "insert conversion" on ae_referral_conversions for insert with check (true);
