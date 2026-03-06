-- Module: booking_flow
create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references calendar_events(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  status text default 'pending',
  created_at timestamptz default now()
);
