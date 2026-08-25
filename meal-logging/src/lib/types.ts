export type MemberIcon = "baby" | "son" | "daughter" | "mom" | "dad";

export const MEMBER_ICONS: MemberIcon[] = [
  "baby",
  "son",
  "daughter",
  "mom",
  "dad",
];

export const DEFAULT_MEAL_SLOTS = ["Breakfast", "Lunch", "Dinner"] as const;

export type FamilyMember = {
  id: string;
  name: string;
  icon: MemberIcon;
  /** Extra slots beyond Breakfast / Lunch / Dinner, e.g. "Evening snack" */
  extraMealSlots: string[];
  createdAt: string; // YYYY-MM-DD
};

/** Meals for one member on one calendar day */
export type DayLog = {
  memberId: string;
  date: string; // YYYY-MM-DD
  /** slot name -> food item names (each name is a full string; spaces allowed) */
  meals: Record<string, string[]>;
};

export type AppData = {
  members: FamilyMember[];
  foodItems: string[];
  dayLogs: DayLog[];
};

export function mealSlotsFor(member: FamilyMember): string[] {
  return [...DEFAULT_MEAL_SLOTS, ...member.extraMealSlots];
}

/** Trim ends only — never split on spaces or other delimiters. */
export function normalizeMealItems(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (Array.isArray(value)) {
    const items: string[] = [];
    for (const entry of value) {
      if (typeof entry !== "string") continue;
      const trimmed = entry.trim();
      if (trimmed) items.push(trimmed);
    }
    return items;
  }
  return [];
}

export function normalizeMeals(meals: unknown): Record<string, string[]> {
  if (!meals || typeof meals !== "object" || Array.isArray(meals)) {
    return {};
  }
  const next: Record<string, string[]> = {};
  for (const [slot, value] of Object.entries(meals)) {
    next[slot] = normalizeMealItems(value);
  }
  return next;
}

export function normalizeDayLogs(logs: unknown): DayLog[] {
  if (!Array.isArray(logs)) return [];
  const next: DayLog[] = [];
  for (const log of logs) {
    if (!log || typeof log !== "object") continue;
    const entry = log as { memberId?: unknown; date?: unknown; meals?: unknown };
    if (typeof entry.memberId !== "string" || typeof entry.date !== "string") {
      continue;
    }
    next.push({
      memberId: entry.memberId,
      date: entry.date,
      meals: normalizeMeals(entry.meals),
    });
  }
  return next;
}

/** Display-only join. Do not parse this string back into items. */
export function formatMealItems(items: string[] | undefined): string {
  const filled = (items ?? []).map((item) => item.trim()).filter(Boolean);
  return filled.length > 0 ? filled.join(", ") : "—";
}
