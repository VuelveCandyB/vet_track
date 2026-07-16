alter table public.profiles
  add column notify_vaccinations boolean not null default false;

update public.profiles p
set notify_vaccinations = true
from auth.users u
where p.id = u.id
  and u.email = 'm.rivera@camareroracepr.com';
