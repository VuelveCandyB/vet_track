create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_name text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  horse_id uuid references horses(id) on delete set null,
  description text not null,
  created_at timestamptz not null default now()
);

alter table activity_logs enable row level security;

create policy "insert own logs" on activity_logs
  for insert with check (auth.uid() = user_id);

create policy "read logs (page-gated)" on activity_logs
  for select using (true);

create index activity_logs_user_id_idx on activity_logs(user_id);
create index activity_logs_created_at_idx on activity_logs(created_at desc);
create index activity_logs_entity_type_idx on activity_logs(entity_type);
