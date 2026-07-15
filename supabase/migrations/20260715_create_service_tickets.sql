-- Create service_tickets table
create table service_tickets (
  id uuid primary key default gen_random_uuid(),
  vet_name text not null,
  vet_email text not null,
  situacion text not null,
  detalle text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table service_tickets enable row level security;

-- Allow any authenticated user to insert their own ticket
create policy "Users can insert their own service tickets"
  on service_tickets for insert
  with check (auth.uid() = created_by);

-- Only admin can view all tickets (future dashboard)
create policy "Admin can view all service tickets"
  on service_tickets for select
  using (auth.jwt() ->> 'email' = (select 'admin@example.com')); -- Will be customized per deployment

-- Create index on created_by for performance
create index idx_service_tickets_created_by on service_tickets(created_by);
create index idx_service_tickets_created_at on service_tickets(created_at desc);
