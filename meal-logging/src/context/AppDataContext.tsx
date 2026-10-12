"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  initData,
  loadData,
  saveData,
  emptyData,
  subscribeData,
} from "@/lib/storage";
import {
  mealItemKey,
  normalizeMealItems,
  type AppData,
  type DayLog,
  type FamilyMember,
  type MealItem,
  type MealRole,
  type MemberIcon,
} from "@/lib/types";
import { todayString } from "@/lib/dates";

type AppDataContextValue = {
  ready: boolean;
  data: AppData;
  addMember: (input: {
    name: string;
    icon: MemberIcon;
    extraMealSlots: string[];
  }) => void;
  updateMember: (
    id: string,
    patch: { icon: MemberIcon; extraMealSlots: string[] },
  ) => void;
  getMember: (id: string) => FamilyMember | undefined;
  getDayLog: (memberId: string, date: string) => DayLog | undefined;
  saveDayLog: (
    memberId: string,
    date: string,
    meals: Record<string, MealItem[]>,
    applyToMemberIds: string[],
  ) => void;
  addFoodItem: (name: string) => void;
  renameFoodItem: (from: string, to: string) => boolean;
  setMealItemRole: (name: string, role: MealRole) => void;
  deleteFoodItem: (name: string) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

function newId(): string {
  return crypto.randomUUID();
}

function dishNameTaken(data: AppData, key: string): boolean {
  if (data.foodItems.some((name) => mealItemKey(name) === key)) return true;
  return data.dayLogs.some((log) =>
    Object.values(log.meals).some((items) =>
      items.some((item) => mealItemKey(item.name) === key),
    ),
  );
}

function replaceDishName(
  foodItems: string[],
  fromKey: string,
  nextName: string,
): string[] {
  const toKey = mealItemKey(nextName);
  let replaced = false;
  const next: string[] = [];
  for (const name of foodItems) {
    if (mealItemKey(name) === fromKey) {
      if (!replaced) {
        next.push(nextName);
        replaced = true;
      }
      continue;
    }
    next.push(name);
  }
  if (!replaced && !next.some((name) => mealItemKey(name) === toKey)) {
    next.push(nextName);
  }
  return next;
}

function mapMeals(
  meals: Record<string, MealItem[]>,
  mapItem: (item: MealItem) => MealItem | null,
): Record<string, MealItem[]> {
  const next: Record<string, MealItem[]> = {};
  for (const [slot, items] of Object.entries(meals)) {
    const mapped: MealItem[] = [];
    for (const item of items) {
      const result = mapItem(item);
      if (result) mapped.push(result);
    }
    next[slot] = mapped;
  }
  return next;
}

function updateData(updater: (prev: AppData) => AppData): void {
  saveData(updater(loadData()));
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const data = useSyncExternalStore(subscribeData, loadData, emptyData);

  useEffect(() => {
    void initData().finally(() => setReady(true));
  }, []);

  const addMember = useCallback(
    (input: {
      name: string;
      icon: MemberIcon;
      extraMealSlots: string[];
    }) => {
      const member: FamilyMember = {
        id: newId(),
        name: input.name.trim(),
        icon: input.icon,
        extraMealSlots: input.extraMealSlots
          .map((s) => s.trim())
          .filter(Boolean),
        createdAt: todayString(),
      };
      if (!member.name) return;
      updateData((prev) => ({
        ...prev,
        members: [...prev.members, member],
      }));
    },
    [],
  );

  const updateMember = useCallback(
    (id: string, patch: { icon: MemberIcon; extraMealSlots: string[] }) => {
      updateData((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          m.id === id
            ? {
                ...m,
                icon: patch.icon,
                extraMealSlots: patch.extraMealSlots
                  .map((s) => s.trim())
                  .filter(Boolean),
              }
            : m,
        ),
      }));
    },
    [],
  );

  const getMember = useCallback(
    (id: string) => data.members.find((m) => m.id === id),
    [data.members],
  );

  const getDayLog = useCallback(
    (memberId: string, date: string) =>
      data.dayLogs.find((l) => l.memberId === memberId && l.date === date),
    [data.dayLogs],
  );

  const addFoodItem = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateData((prev) => {
      if (
        prev.foodItems.some(
          (f) => f.toLowerCase() === trimmed.toLowerCase(),
        )
      ) {
        return prev;
      }
      return { ...prev, foodItems: [...prev.foodItems, trimmed] };
    });
  }, []);

  const renameFoodItem = useCallback((from: string, to: string): boolean => {
    const nextName = to.trim();
    const fromKey = mealItemKey(from);
    const toKey = mealItemKey(nextName);
    if (!fromKey || !toKey) return false;
    if (toKey !== fromKey && dishNameTaken(loadData(), toKey)) return false;
    updateData((prev) => ({
      ...prev,
      foodItems: replaceDishName(prev.foodItems, fromKey, nextName),
      dayLogs: prev.dayLogs.map((log) => ({
        ...log,
        meals: mapMeals(log.meals, (item) =>
          mealItemKey(item.name) === fromKey ? { ...item, name: nextName } : item,
        ),
      })),
    }));
    return true;
  }, []);

  const setMealItemRole = useCallback((name: string, role: MealRole) => {
    const key = mealItemKey(name);
    if (!key) return;
    updateData((prev) => ({
      ...prev,
      dayLogs: prev.dayLogs.map((log) => ({
        ...log,
        meals: mapMeals(log.meals, (item) =>
          mealItemKey(item.name) === key ? { ...item, role } : item,
        ),
      })),
    }));
  }, []);

  const deleteFoodItem = useCallback((name: string) => {
    const key = mealItemKey(name);
    if (!key) return;
    updateData((prev) => ({
      ...prev,
      foodItems: prev.foodItems.filter((item) => mealItemKey(item) !== key),
      dayLogs: prev.dayLogs.map((log) => ({
        ...log,
        meals: mapMeals(log.meals, (item) =>
          mealItemKey(item.name) === key ? null : item,
        ),
      })),
    }));
  }, []);

  const saveDayLog = useCallback(
    (
      memberId: string,
      date: string,
      meals: Record<string, MealItem[]>,
      applyToMemberIds: string[],
    ) => {
      updateData((prev) => {
        const targets = [
          memberId,
          ...applyToMemberIds.filter((id) => id !== memberId),
        ];
        const memberById = new Map(prev.members.map((m) => [m.id, m]));
        let dayLogs = [...prev.dayLogs];
        let foodItems = [...prev.foodItems];

        const ensureFood = (item: string) => {
          const t = item.trim();
          if (!t) return;
          if (!foodItems.some((f) => f.toLowerCase() === t.toLowerCase())) {
            foodItems = [...foodItems, t];
          }
        };

        for (const targetId of targets) {
          const member = memberById.get(targetId);
          if (!member) continue;

          const allowedSlots = new Set([
            "Breakfast",
            "Lunch",
            "Dinner",
            ...member.extraMealSlots,
          ]);
          const nextMeals: Record<string, MealItem[]> = {};
          for (const [slot, value] of Object.entries(meals)) {
            if (!allowedSlots.has(slot)) continue;
            const items = normalizeMealItems(value);
            nextMeals[slot] = items;
            for (const item of items) {
              ensureFood(item.name);
            }
          }

          const idx = dayLogs.findIndex(
            (l) => l.memberId === targetId && l.date === date,
          );
          const entry: DayLog = { memberId: targetId, date, meals: nextMeals };
          if (idx >= 0) {
            dayLogs[idx] = entry;
          } else {
            dayLogs = [...dayLogs, entry];
          }
        }

        return { ...prev, dayLogs, foodItems };
      });
    },
    [],
  );

  const value = useMemo(
    () => ({
      ready,
      data,
      addMember,
      updateMember,
      getMember,
      getDayLog,
      saveDayLog,
      addFoodItem,
      renameFoodItem,
      setMealItemRole,
      deleteFoodItem,
    }),
    [
      ready,
      data,
      addMember,
      updateMember,
      getMember,
      getDayLog,
      saveDayLog,
      addFoodItem,
      renameFoodItem,
      setMealItemRole,
      deleteFoodItem,
    ],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return ctx;
}
