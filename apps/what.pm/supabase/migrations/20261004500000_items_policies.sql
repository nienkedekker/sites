-- These policies were set up in the dashboard; this records them
alter table public.items enable row level security;

drop policy if exists "Anyone can read items" on public.items;
create policy "Anyone can read items" on public.items
  for select
  using (true);

drop policy if exists "Only Nienke can insert items" on public.items;
create policy "Only Nienke can insert items" on public.items
  for insert
  with check (auth.uid() = '00c2df16-db75-4b84-8469-91fd1e34c113'::uuid);

drop policy if exists "Only Nienke can update items" on public.items;
create policy "Only Nienke can update items" on public.items
  for update
  using (auth.uid() = '00c2df16-db75-4b84-8469-91fd1e34c113'::uuid);

drop policy if exists "Only Nienke can delete items" on public.items;
create policy "Only Nienke can delete items" on public.items
  for delete
  using (auth.uid() = '00c2df16-db75-4b84-8469-91fd1e34c113'::uuid);

-- RLS doesn't cover truncate, and the API never needs these
revoke truncate, references, trigger on public.items from anon, authenticated;
