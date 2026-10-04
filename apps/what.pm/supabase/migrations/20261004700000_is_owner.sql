-- My uuid lives here only, so every policy asks is_owner() instead
create or replace function public.is_owner()
  returns boolean
  language sql
  stable
  set search_path = ''
as $$
  select coalesce(auth.uid() = '00c2df16-db75-4b84-8469-91fd1e34c113'::uuid, false)
$$;

-- Wrapping the call in a select makes Postgres run it once per query, not per row

drop policy if exists "Only Nienke can insert items" on public.items;
drop policy if exists "Only the owner can insert items" on public.items;
create policy "Only the owner can insert items" on public.items
  for insert
  with check ((select public.is_owner()));

drop policy if exists "Only Nienke can update items" on public.items;
drop policy if exists "Only the owner can update items" on public.items;
create policy "Only the owner can update items" on public.items
  for update
  using ((select public.is_owner()));

drop policy if exists "Only Nienke can delete items" on public.items;
drop policy if exists "Only the owner can delete items" on public.items;
create policy "Only the owner can delete items" on public.items
  for delete
  using ((select public.is_owner()));

drop policy if exists "Only Nienke can use recommendations" on public.recommendations;
drop policy if exists "Only the owner can use recommendations" on public.recommendations;
create policy "Only the owner can use recommendations" on public.recommendations
  for all
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

drop policy if exists "Only Nienke can use dismissed" on public.dismissed;
drop policy if exists "Only the owner can use dismissed" on public.dismissed;
create policy "Only the owner can use dismissed" on public.dismissed
  for all
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

drop policy if exists "Only Nienke can read all of wanted" on public.wanted;
drop policy if exists "Only the owner can read all of wanted" on public.wanted;
create policy "Only the owner can read all of wanted" on public.wanted
  for select
  to authenticated
  using ((select public.is_owner()));

drop policy if exists "Only Nienke can add wanted" on public.wanted;
drop policy if exists "Only the owner can add wanted" on public.wanted;
create policy "Only the owner can add wanted" on public.wanted
  for insert
  with check ((select public.is_owner()));

drop policy if exists "Only Nienke can update wanted" on public.wanted;
drop policy if exists "Only the owner can update wanted" on public.wanted;
create policy "Only the owner can update wanted" on public.wanted
  for update
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

drop policy if exists "Only Nienke can delete wanted" on public.wanted;
drop policy if exists "Only the owner can delete wanted" on public.wanted;
create policy "Only the owner can delete wanted" on public.wanted
  for delete
  using ((select public.is_owner()));
