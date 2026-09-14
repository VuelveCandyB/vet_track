-- Add archivo_url field to horse_referidos for storing image/pdf references
alter table public.horse_referidos
  add column archivo_url text;
