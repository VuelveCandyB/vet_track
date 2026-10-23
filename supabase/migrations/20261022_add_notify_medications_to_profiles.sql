alter table public.profiles
  add column if not exists notify_medications boolean not null default false;
