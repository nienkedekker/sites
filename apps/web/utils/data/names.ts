export const splitNames = (value: string | null) =>
  (value ?? "")
    .split(/,\s*|\s+(?:&|and)\s+/)
    .map((name) => name.trim())
    .filter(Boolean);
