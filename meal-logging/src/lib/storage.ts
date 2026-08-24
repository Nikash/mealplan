import type { AppData } from "./types";

const STORAGE_KEY = "meal-logging-data";
const CHANGE_EVENT = "meal-logging-change";

export const emptyData = (): AppData => ({
  members: [],
  foodItems: [],
  dayLogs: [],
});

export function loadData(): AppData {
  if (typeof window === "undefined") return emptyData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      members: Array.isArray(parsed.members) ? parsed.members : [],
      foodItems: Array.isArray(parsed.foodItems) ? parsed.foodItems : [],
      dayLogs: Array.isArray(parsed.dayLogs) ? parsed.dayLogs : [],
    };
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeData(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
