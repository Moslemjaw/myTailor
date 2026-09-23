import { CURRENCY } from "./constants";

export function formatPrice(value: number | string) {
  const n = typeof value === "string" ? Number(value) : value;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(n);
  return `${formatted} ${CURRENCY}`;
}

export function formatDays(days: number) {
  return `${days} ${days === 1 ? "day" : "days"}`;
}

export function formatDate(value: string | Date, opts: Intl.DateTimeFormatOptions = {}) {
  const d = typeof value === "string" ? parseDate(value) : value;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", ...opts }).format(d);
}

export function formatDateShort(value: string | Date) {
  return formatDate(value, { year: undefined });
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

/** Date-only strings (YYYY-MM-DD) are parsed as local dates, not UTC. */
function parseDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
}

export function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const s = Math.round(diff / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} ${d === 1 ? "day" : "days"} ago`;
  return formatDate(value, { year: d > 300 ? "numeric" : undefined });
}

/** "in 12 days", "tomorrow", "3 days ago" for a desired completion date. */
export function daysUntil(date: string) {
  const target = parseDate(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function describeDeadline(date: string) {
  const n = daysUntil(date);
  if (n < 0) return `${formatDateShort(date)} · passed`;
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n < 60) return `${formatDateShort(date)} · in ${n} days`;
  return formatDate(date);
}

export function firstName(fullName: string | null | undefined) {
  return (fullName ?? "").trim().split(/\s+/)[0] || "there";
}

export function initials(fullName: string | null | undefined) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

export function orderRef(n: number) {
  return `#${n}`;
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}
