alter table public.items
  add column if not exists genres text[] not null default '{}';

comment on column public.items.genres is 'TMDB genres for movies and shows, with TV''s combined ones split to match movies';
