-- Module: listings
create table if not exists listings (
  id uuid primary key default uuid_generate_v4(),
  seller uuid references profiles(id) on delete cascade,
  title text not null,
  price numeric not null,
  currency text default 'USD',
  created_at timestamptz default now()
);
