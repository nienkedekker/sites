drop policy if exists "Only Nienke can use wanted" on public.wanted;

-- Up next is public, but the reasons behind Claude's picks are only for me
revoke select on public.wanted from anon;
grant select (itemtype, external_id, title, creator, published_year, created_at)
  on public.wanted to anon;

drop policy if exists "Anyone can read wanted" on public.wanted;
create policy "Anyone can read wanted" on public.wanted
  for select
  to anon
  using (true);

drop policy if exists "Only Nienke can read all of wanted" on public.wanted;
create policy "Only Nienke can read all of wanted" on public.wanted
  for select
  to authenticated
  using (auth.uid() = '00c2df16-db75-4b84-8469-91fd1e34c113'::uuid);

drop policy if exists "Only Nienke can add wanted" on public.wanted;
create policy "Only Nienke can add wanted" on public.wanted
  for insert
  with check (auth.uid() = '00c2df16-db75-4b84-8469-91fd1e34c113'::uuid);

drop policy if exists "Only Nienke can update wanted" on public.wanted;
create policy "Only Nienke can update wanted" on public.wanted
  for update
  using (auth.uid() = '00c2df16-db75-4b84-8469-91fd1e34c113'::uuid)
  with check (auth.uid() = '00c2df16-db75-4b84-8469-91fd1e34c113'::uuid);

drop policy if exists "Only Nienke can delete wanted" on public.wanted;
create policy "Only Nienke can delete wanted" on public.wanted
  for delete
  using (auth.uid() = '00c2df16-db75-4b84-8469-91fd1e34c113'::uuid);

comment on table public.wanted is 'Up next: public, apart from the reasons';
