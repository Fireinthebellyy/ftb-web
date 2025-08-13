import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | Date) {
  const now = dayjs();
  const target = dayjs(input);
  const diffDays = now.diff(target, "day");

  if (diffDays < 3) {
    return target.fromNow();
  }
  return target.format("D MMM, h:mm A");
}
