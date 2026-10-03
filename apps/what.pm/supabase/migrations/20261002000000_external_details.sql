alter table public.items
  add column if not exists external_id text,
  add column if not exists pages integer check (pages > 0),
  add column if not exists runtime_minutes integer check (runtime_minutes > 0),
  add column if not exists based_on text;

comment on column public.items.external_id is 'OpenLibrary work key for books, TMDB id for movies and shows';
comment on column public.items.based_on is 'Author(s) of the source material, from TMDB writing credits';
