-- Module: calendar
create table if not exists calendar_events (
  id uuid primary key default uuid_generate_v4(),
  owner uuid references profiles(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_at timestamptz default now()
);
