/** Local calendar date as YYYY-MM-DD */
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayString(): string {
  return formatDate(new Date());
}

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, days: number): string {
  const d = parseDate(iso);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

/** Inclusive range from start to end (both YYYY-MM-DD), newest first */
export function dateRangeNewestFirst(start: string, end: string): string[] {
  if (start > end) return dateRangeNewestFirst(end, start);
  const out: string[] = [];
  let cur = end;
  while (cur >= start) {
    out.push(cur);
    cur = addDays(cur, -1);
  }
  return out;
}

export function formatDisplayDate(iso: string): string {
  return parseDate(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
