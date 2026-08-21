insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where email = 'admin@admin.com'
on conflict (user_id, role) do nothing;
