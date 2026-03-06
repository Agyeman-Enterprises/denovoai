-- Module: orders
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  listing uuid references listings(id) on delete cascade,
  buyer uuid references profiles(id) on delete cascade,
  status text default 'pending',
  created_at timestamptz default now()
);
