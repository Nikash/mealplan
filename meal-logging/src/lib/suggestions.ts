import { daysBetween } from "@/lib/dates";
import type { DayLog } from "@/lib/types";

export type ScoredMealItem = {
  name: string;
  frequency: number;
  daysSince: number;
  score: number;
};

const DEFAULT_LIMIT = 5;

function itemKey(name: string): string {
  return name.trim().toLowerCase();
}

export function scoreSlotItems(
  dayLogs: DayLog[],
  opts: { memberId: string; slot: string; asOfDate: string },
): ScoredMealItem[] {
  const stats = new Map<
    string,
    { name: string; lastDate: string; days: Set<string> }
  >();

  for (const log of dayLogs) {
    if (log.memberId !== opts.memberId) continue;
    if (log.date >= opts.asOfDate) continue;
    const slotItems = log.meals[opts.slot];
    if (!slotItems || slotItems.length === 0) continue;

    const seenThisDay = new Set<string>();
    for (const raw of slotItems) {
      const name = raw.trim();
      if (!name) continue;
      const key = itemKey(name);
      if (seenThisDay.has(key)) continue;
      seenThisDay.add(key);

      const prev = stats.get(key);
      if (!prev) {
        stats.set(key, {
          name,
          lastDate: log.date,
          days: new Set([log.date]),
        });
        continue;
      }
      prev.days.add(log.date);
      if (log.date >= prev.lastDate) {
        prev.lastDate = log.date;
        prev.name = name;
      }
    }
  }

  const scored: ScoredMealItem[] = [];
  for (const { name, lastDate, days } of stats.values()) {
    const calendarDays = daysBetween(lastDate, opts.asOfDate);
    const daysSince = Math.max(0, calendarDays - 1);
    const frequency = days.size;
    scored.push({
      name,
      frequency,
      daysSince,
      score: frequency * (daysSince + 1),
    });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.daysSince !== a.daysSince) return b.daysSince - a.daysSince;
    return a.name.localeCompare(b.name);
  });

  return scored;
}

export function suggestMealItems(
  dayLogs: DayLog[],
  opts: {
    memberId: string;
    slot: string;
    asOfDate: string;
    exclude?: string[];
    limit?: number;
  },
): string[] {
  const exclude = new Set(
    (opts.exclude ?? []).map((name) => itemKey(name)).filter(Boolean),
  );
  const limit = opts.limit ?? DEFAULT_LIMIT;
  const names: string[] = [];
  for (const item of scoreSlotItems(dayLogs, opts)) {
    if (exclude.has(itemKey(item.name))) continue;
    names.push(item.name);
    if (names.length >= limit) break;
  }
  return names;
}

export function rankFoodItems(
  foodItems: string[],
  dayLogs: DayLog[],
  opts: { memberId: string; slot: string; asOfDate: string },
): string[] {
  const scored = scoreSlotItems(dayLogs, opts);
  const rank = new Map<string, number>();
  scored.forEach((item, index) => {
    rank.set(itemKey(item.name), index);
  });

  const used = new Set<string>();
  const ranked: string[] = [];

  const scoredCatalog = foodItems
    .map((name, originalIndex) => ({
      name,
      originalIndex,
      scoreRank: rank.get(itemKey(name)),
    }))
    .filter(
      (row): row is { name: string; originalIndex: number; scoreRank: number } =>
        row.scoreRank !== undefined,
    )
    .sort(
      (a, b) =>
        a.scoreRank - b.scoreRank || a.originalIndex - b.originalIndex,
    );

  for (const row of scoredCatalog) {
    const key = itemKey(row.name);
    if (!key || used.has(key)) continue;
    used.add(key);
    ranked.push(row.name);
  }

  for (const name of foodItems) {
    const key = itemKey(name);
    if (!key || used.has(key)) continue;
    used.add(key);
    ranked.push(name);
  }

  return ranked;
}
