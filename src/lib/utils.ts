import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { id } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateId(date: string | Date | null | undefined, pattern = "dd MMM yyyy"): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  try {
    return format(d, pattern, { locale: id });
  } catch {
    return "-";
  }
}

export function formatDateTimeId(date: string | Date | null | undefined): string {
  return formatDateId(date, "dd MMM yyyy, HH:mm 'WIB'");
}

export function formatTimeAgo(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? parseISO(date) : date;
  try {
    return formatDistanceToNow(d, { addSuffix: true, locale: id });
  } catch {
    return "-";
  }
}

export function formatNumber(val: number | null | undefined, decimals = 2): string {
  if (val === null || val === undefined || isNaN(val)) return "0";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(val);
}

export function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return "0%";
  return `${formatNumber(val, 1)}%`;
}

export function formatWeight(val: number | null | undefined, unit = "Ton"): string {
  return `${formatNumber(val, 2)} ${unit}`;
}
