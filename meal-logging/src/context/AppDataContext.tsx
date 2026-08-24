"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadData, saveData, emptyData } from "@/lib/storage";
import type {
  AppData,
  DayLog,
  FamilyMember,
  MemberIcon,
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
    meals: Record<string, string>,
    applyToMemberIds: string[],
  ) => void;
  addFoodItem: (name: string) => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

function newId(): string {
  return crypto.randomUUID();
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setData(loadData());
    setReady(true);
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
      setData((prev) => {
        const next = { ...prev, members: [...prev.members, member] };
        saveData(next);
        return next;
      });
    },
    [],
  );

  const updateMember = useCallback(
    (id: string, patch: { icon: MemberIcon; extraMealSlots: string[] }) => {
      setData((prev) => {
        const next = {
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
        };
        saveData(next);
        return next;
      });
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
    setData((prev) => {
      if (
        prev.foodItems.some((f) => f.toLowerCase() === trimmed.toLowerCase())
      ) {
        return prev;
      }
      const next = { ...prev, foodItems: [...prev.foodItems, trimmed] };
      saveData(next);
      return next;
    });
  }, []);

  const saveDayLog = useCallback(
    (
      memberId: string,
      date: string,
      meals: Record<string, string>,
      applyToMemberIds: string[],
    ) => {
      setData((prev) => {
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
          const nextMeals: Record<string, string> = {};
          for (const [slot, value] of Object.entries(meals)) {
            if (!allowedSlots.has(slot)) continue;
            const trimmed = value.trim();
            nextMeals[slot] = trimmed;
            ensureFood(trimmed);
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

        const next = { ...prev, dayLogs, foodItems };
        saveData(next);
        return next;
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
