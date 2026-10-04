create table if not exists public.wanted (
  itemtype text not null check (itemtype in ('Book', 'Movie', 'Show')),
  external_id text not null,
  title text not null,
  creator text,
  published_year integer,
  reason text,
  because text[] not null default '{}',
  created_at timestamptz not null default now(),
  primary key (itemtype, external_id)
);

comment on table public.wanted is 'Recommendations I want to read or watch';

alter table public.wanted enable row level security;

drop policy if exists "Only Nienke can use wanted" on public.wanted;
create policy "Only Nienke can use wanted" on public.wanted
  for all
  using (auth.uid() = '00c2df16-db75-4b84-8469-91fd1e34c113'::uuid)
  with check (auth.uid() = '00c2df16-db75-4b84-8469-91fd1e34c113'::uuid);
