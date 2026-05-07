-- ae_social_notifications: in-app notification inbox
create table if not exists ae_social_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  notification_type text not null,
  entity_type text,
  entity_id text,
  message text,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ae_social_notif_user_idx on ae_social_notifications(user_id, is_read, created_at desc);
alter table ae_social_notifications enable row level security;
create policy "users read own notifications" on ae_social_notifications for select using (auth.uid() = user_id);
create policy "users manage own notifications" on ae_social_notifications for all using (auth.uid() = user_id);
create policy "system can insert notifications" on ae_social_notifications for insert with check (true);
