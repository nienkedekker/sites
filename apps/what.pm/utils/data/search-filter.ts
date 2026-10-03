/**
 * A PostgREST `.or()` filter matching `query` anywhere in any of `columns`.
 * The value is LIKE-escaped, then double-quoted so commas and parentheses in
 * titles don't split the filter.
 */
export function ilikeAny(columns: string[], query: string) {
  const like = query.replace(/[\\%_]/g, "\\$&");
  const quoted = `"%${like.replace(/[\\"]/g, "\\$&")}%"`;
  return columns.map((column) => `${column}.ilike.${quoted}`).join(",");
}
