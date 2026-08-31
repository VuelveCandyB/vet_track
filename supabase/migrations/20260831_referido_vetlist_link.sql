alter table public.horse_referidos
  add column extremidad          text,
  add column grado                text,
  add column elegible_trabajar    boolean not null default false,
  add column requiere_pruebas     boolean not null default false,
  add column reclamo_anulado      boolean not null default false,
  add column persona_responsable  text,
  add column tipo_contacto        text,
  add column contacto             text,
  add column vetlist_id           uuid references public.vetlist(id);

create index idx_horse_referidos_vetlist on public.horse_referidos(vetlist_id);

alter table public.vetlist
  add column referido_id uuid references public.horse_referidos(id);

create index idx_vetlist_referido on public.vetlist(referido_id);
