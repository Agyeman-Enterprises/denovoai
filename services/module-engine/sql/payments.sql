-- Module: payments (stub)
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  amount numeric not null,
  currency text default 'USD',
  status text default 'initiated',
  created_at timestamptz default now()
);
