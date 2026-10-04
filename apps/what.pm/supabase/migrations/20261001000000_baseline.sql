-- The schema as it stood before the migrations folder, read from the live
-- database, so a fresh project can be built from this folder alone

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  season integer,
  director text,
  published_year integer not null,
  belongs_to_year integer not null,
  redo boolean not null default false,
  itemtype text not null check (itemtype in ('Book', 'Movie', 'Show')),
  created_at timestamp default now(),
  updated_at timestamp default now(),
  in_progress boolean default false
);

create index if not exists idx_items_belongs_to_year
  on public.items using btree (belongs_to_year);
create index if not exists idx_items_year_type_created
  on public.items using btree (belongs_to_year, itemtype, created_at);
create index if not exists idx_items_title_text
  on public.items using gin (to_tsvector('english'::regconfig, title));
create index if not exists idx_items_author_text
  on public.items using gin (to_tsvector('english'::regconfig, author));
create index if not exists idx_items_director_text
  on public.items using gin (to_tsvector('english'::regconfig, director));

alter table public.items enable row level security;

revoke truncate, references, trigger on public.items from anon, authenticated;

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

create or replace view public.distinct_years
  with (security_invoker = on) as
  select distinct items.belongs_to_year from public.items;

create or replace function public.count_logged_years()
 returns bigint
 language sql
 stable
 set search_path to 'public'
as $function$
  SELECT COUNT(DISTINCT belongs_to_year) FROM items;
$function$;

create or replace function public.get_item_counts()
 returns table(itemtype text, total_count bigint, current_year_count bigint)
 language plpgsql
 stable
as $function$
BEGIN
  RETURN QUERY
  SELECT
    items.itemtype,  -- Explicitly reference the table
    COUNT(*) AS total_count,
    SUM(CASE WHEN items.belongs_to_year = EXTRACT(YEAR FROM CURRENT_DATE) THEN 1 ELSE 0 END) AS current_year_count
  FROM items
  GROUP BY items.itemtype;
END;
$function$;

create or replace function public.get_cumulative_item_counts()
 returns table(log_year integer, book_total bigint, movie_total bigint, show_total bigint)
 language plpgsql
 stable
as $function$
BEGIN
  RETURN QUERY
  WITH years AS (
    -- Generate a full range of years from the first logged year to the current year
    SELECT generate_series(
      (SELECT MIN(belongs_to_year) FROM items),
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
    ) AS generated_year
  ),
  yearly_counts AS (
    SELECT
      belongs_to_year AS counted_year,
      COUNT(*) FILTER (WHERE itemtype = 'Book') AS books,
      COUNT(*) FILTER (WHERE itemtype = 'Movie') AS movies,
      COUNT(*) FILTER (WHERE itemtype = 'Show') AS shows
    FROM items
    WHERE belongs_to_year IS NOT NULL
    GROUP BY belongs_to_year
  ),
  combined AS (
    -- Join the generated year series with the actual logged counts
    SELECT
      y.generated_year AS log_year, -- Rename to avoid ambiguity
      COALESCE(yc.books, 0) AS books,
      COALESCE(yc.movies, 0) AS movies,
      COALESCE(yc.shows, 0) AS shows
    FROM years y
    LEFT JOIN yearly_counts yc ON y.generated_year = yc.counted_year
    ORDER BY y.generated_year
  ),
  cumulative AS (
    SELECT
      combined.log_year, -- Explicitly reference the correct log_year
      CAST(SUM(combined.books) OVER (ORDER BY combined.log_year) AS BIGINT) AS book_total,
      CAST(SUM(combined.movies) OVER (ORDER BY combined.log_year) AS BIGINT) AS movie_total,
      CAST(SUM(combined.shows) OVER (ORDER BY combined.log_year) AS BIGINT) AS show_total
    FROM combined
  )
  SELECT cumulative.log_year, cumulative.book_total, cumulative.movie_total, cumulative.show_total
  FROM cumulative;
END;
$function$;

create or replace function public.get_item_counts_by_decade()
 returns table(decade text, count bigint)
 language plpgsql
 stable
 set search_path to 'public'
as $function$
BEGIN
  RETURN QUERY
  SELECT
    (published_year / 10) * 10 || 's' AS decade,
    COUNT(*) AS count
  FROM items
  WHERE published_year IS NOT NULL
  GROUP BY (published_year / 10) * 10
  ORDER BY decade;
END;
$function$;
