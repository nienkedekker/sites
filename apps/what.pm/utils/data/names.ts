export const splitNames = (value: string | null) =>
  (value ?? "")
    .split(/,\s*|\s+(?:&|and)\s+/)
    .map((name) => name.trim())
    .filter(Boolean);

export const nameKey = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]/g, "");
