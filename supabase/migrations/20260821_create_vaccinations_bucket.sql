-- Create vaccinations bucket for storing vaccine certificates
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vaccinations',
  'vaccinations',
  false,
  5242880,
  array['application/pdf']
)
on conflict (id) do nothing;

-- Allow authenticated users to upload their own horse's PDFs
create policy "Users can upload vaccine PDFs for their horses"
  on storage.objects for insert
  with check (
    bucket_id = 'vaccinations'
    and auth.role() = 'authenticated'
  );

-- Allow authenticated users to view vaccine PDFs
create policy "Users can view vaccine PDFs"
  on storage.objects for select
  with check (
    bucket_id = 'vaccinations'
    and auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete their own vaccine PDFs
create policy "Users can delete their own vaccine PDFs"
  on storage.objects for delete
  with check (
    bucket_id = 'vaccinations'
    and auth.role() = 'authenticated'
  );
