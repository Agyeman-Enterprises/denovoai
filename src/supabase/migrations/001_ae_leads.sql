-- ae_leads: captured leads with source attribution
create table if not exists ae_leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  phone text,
  company text,
  source text not null default 'website',
  utm_campaign text,
  utm_medium text,
  utm_source text,
  status text not null default 'new',
  score integer not null default 0,
  tags text[] not null default '{}'::text[],
  notes text,
  custom_fields jsonb not null default '{}'::jsonb,
  converted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, email)
);

alter table ae_leads enable row level security;
create policy "owners read own leads" on ae_leads for select using (auth.uid() = owner_id);
create policy "owners manage own leads" on ae_leads for all using (auth.uid() = owner_id);
create policy "public can insert leads" on ae_leads for insert with check (true);
