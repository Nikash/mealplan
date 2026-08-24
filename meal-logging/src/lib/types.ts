export type MemberIcon = "baby" | "boy" | "girl" | "mom" | "dad";

export const MEMBER_ICONS: MemberIcon[] = [
  "baby",
  "boy",
  "girl",
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
  /** slot name -> food item name */
  meals: Record<string, string>;
};

export type AppData = {
  members: FamilyMember[];
  foodItems: string[];
  dayLogs: DayLog[];
};

export function mealSlotsFor(member: FamilyMember): string[] {
  return [...DEFAULT_MEAL_SLOTS, ...member.extraMealSlots];
}
