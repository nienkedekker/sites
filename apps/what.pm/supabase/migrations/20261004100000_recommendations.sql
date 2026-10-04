create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  itemtype text not null check (itemtype in ('Book', 'Movie', 'Show')),
  external_id text not null,
  title text not null,
  creator text,
  published_year integer,
  reason text not null,
  because text[] not null default '{}',
  score real not null,
  batch_at timestamptz not null default now(),
  unique (itemtype, external_id)
);

create table if not exists public.dismissed (
  itemtype text not null check (itemtype in ('Book', 'Movie', 'Show')),
  external_id text not null,
  title text not null,
  kind text not null check (kind in ('not_for_me', 'seen')),
  created_at timestamptz not null default now(),
  primary key (itemtype, external_id)
);

comment on column public.recommendations.creator is 'Author for books, director or creator for movies and shows';
comment on column public.recommendations.because is 'Titles from the log behind the pick';

alter table public.recommendations enable row level security;
alter table public.dismissed enable row level security;

drop policy if exists "Only Nienke can use recommendations" on public.recommendations;
create policy "Only Nienke can use recommendations" on public.recommendations
  for all
  using (auth.uid() = '00c2df16-db75-4b84-8469-91fd1e34c113'::uuid)
  with check (auth.uid() = '00c2df16-db75-4b84-8469-91fd1e34c113'::uuid);

drop policy if exists "Only Nienke can use dismissed" on public.dismissed;
create policy "Only Nienke can use dismissed" on public.dismissed
  for all
  using (auth.uid() = '00c2df16-db75-4b84-8469-91fd1e34c113'::uuid)
  with check (auth.uid() = '00c2df16-db75-4b84-8469-91fd1e34c113'::uuid);
