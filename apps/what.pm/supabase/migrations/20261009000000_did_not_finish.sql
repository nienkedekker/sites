alter table public.items
  add column if not exists did_not_finish boolean not null default false;

comment on column public.items.did_not_finish is 'Started but not finished: still listed, but left out of every count';

-- The cumulative chart counts finished entries only
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
      AND NOT did_not_finish
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
