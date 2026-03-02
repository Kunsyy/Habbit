import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function getTodayDateStr(timezone: string): string {
  return getDateStr(new Date(), timezone);
}

export function getDateStr(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getMonthDateStrings(year: number, month: number, timezone: string): string[] {
  const dateStrings: string[] = [];
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    dateStrings.push(getDateStr(date, timezone));
    date.setDate(date.getDate() + 1);
  }
  return dateStrings;
}