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
