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

export type MealRole = "main" | "side";

/** One dish in a meal slot. A name may include spaces. */
export type MealItem = {
  name: string;
  role: MealRole;
};

/** Meals for one member on one calendar day */
export type DayLog = {
  memberId: string;
  date: string; // YYYY-MM-DD
  /** slot name -> dishes */
  meals: Record<string, MealItem[]>;
};

export type AppData = {
  members: FamilyMember[];
  foodItems: string[];
  dayLogs: DayLog[];
};

export function mealSlotsFor(member: FamilyMember): string[] {
  return [...DEFAULT_MEAL_SLOTS, ...member.extraMealSlots];
}

export function mealRoleOf(value: unknown): MealRole {
  return value === "side" ? "side" : "main";
}

/** Trim ends only — never split on spaces or other delimiters. */
export function normalizeMealItem(value: unknown): MealItem | null {
  if (typeof value === "string") {
    const name = value.trim();
    return name ? { name, role: "main" } : null;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const entry = value as { name?: unknown; role?: unknown };
  if (typeof entry.name !== "string") return null;
  const name = entry.name.trim();
  if (!name) return null;
  return { name, role: mealRoleOf(entry.role) };
}

export function normalizeMealItems(value: unknown): MealItem[] {
  if (Array.isArray(value)) {
    const items: MealItem[] = [];
    for (const entry of value) {
      const item = normalizeMealItem(entry);
      if (item) items.push(item);
    }
    return items;
  }
  const item = normalizeMealItem(value);
  return item ? [item] : [];
}

export function normalizeMeals(meals: unknown): Record<string, MealItem[]> {
  if (!meals || typeof meals !== "object" || Array.isArray(meals)) {
    return {};
  }
  const next: Record<string, MealItem[]> = {};
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

