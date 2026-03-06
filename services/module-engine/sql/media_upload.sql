-- Module: media_upload
create table if not exists media (
  id uuid primary key default uuid_generate_v4(),
  owner uuid references profiles(id) on delete cascade,
  url text not null,
  alt text,
  created_at timestamptz default now()
);
