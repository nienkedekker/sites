-- Up next streams new picks over Realtime, so the media server at home hears
-- about one the moment it's added instead of polling. Anon still only sees the
-- columns it's granted
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'wanted'
  ) then
    alter publication supabase_realtime add table public.wanted;
  end if;
end $$;
