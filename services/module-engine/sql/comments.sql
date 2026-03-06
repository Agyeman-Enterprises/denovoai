-- Module: comments
create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade,
  author uuid references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create index if not exists comments_post_idx on comments(post_id);
