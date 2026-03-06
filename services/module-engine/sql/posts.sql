-- Module: posts
create table if not exists posts (
  id uuid primary key default uuid_generate_v4(),
  author uuid references profiles(id) on delete cascade,
  title text not null,
  body text,
  created_at timestamptz default now()
);

create index if not exists posts_author_idx on posts(author);
