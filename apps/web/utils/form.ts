export function toNumber(value: string): number {
  return value === "" ? 0 : parseInt(value, 10) || 0;
}

export function formatNumberInputValue(
  value: number | undefined | null,
): string {
  if (value === 0 || value === undefined || value === null) {
    return "";
  }
  return String(value);
}
