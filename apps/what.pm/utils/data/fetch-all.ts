const PAGE_SIZE = 1000;

type Page<T> = PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}>;

/**
 * Supabase returns at most 1000 rows per request, so this pages through
 * `.range(from, to)` until a short page. `page` must build a fresh query each
 * call, ordered on something unique so rows don't shift between pages.
 */
export async function fetchAllRows<T>(
  page: (from: number, to: number) => Page<T>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}
