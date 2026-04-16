export function toDateTimeLocalValue(date?: Date | string): string {
  if (!date) {
    return "";
  }

  const parsedDate = typeof date === "string" ? new Date(date) : date;

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const timezoneOffsetMs = parsedDate.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(parsedDate.getTime() - timezoneOffsetMs);
  return localDate.toISOString().slice(0, 16);
}

export function toDateOnlyLocalValue(date?: Date): string | undefined {
  if (!date || Number.isNaN(date.getTime())) {
    return undefined;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateOnlyToLocalDate(
  value?: string | null
): Date | undefined {
  if (!value) {
    return undefined;
  }

  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed;
}
