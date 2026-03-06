-- Supabase schema stub for SaaS CRUD template
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  display_name text,
  created_at timestamptz default now()
);

create table if not exists items (
  id uuid primary key default uuid_generate_v4(),
  owner uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz default now()
);

create index if not exists items_owner_idx on items(owner);
