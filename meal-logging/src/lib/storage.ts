import type { AppData } from "./types";

const STORAGE_KEY = "meal-logging-data";
const CHANGE_EVENT = "meal-logging-change";

/** Stable empty snapshot for useSyncExternalStore (must be referentially equal). */
export const EMPTY_DATA: AppData = Object.freeze({
  members: [],
  foodItems: [],
  dayLogs: [],
});

export function emptyData(): AppData {
  return EMPTY_DATA;
}

let cachedRaw: string | null | undefined = undefined;
let cachedSnapshot: AppData = EMPTY_DATA;

function parseData(raw: string): AppData {
  try {
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      members: Array.isArray(parsed.members) ? parsed.members : [],
      foodItems: Array.isArray(parsed.foodItems) ? parsed.foodItems : [],
      dayLogs: Array.isArray(parsed.dayLogs) ? parsed.dayLogs : [],
    };
  } catch {
    return EMPTY_DATA;
  }
}

export function loadData(): AppData {
  if (typeof window === "undefined") return EMPTY_DATA;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedSnapshot;
  cachedRaw = raw;
  cachedSnapshot = raw ? parseData(raw) : EMPTY_DATA;
  return cachedSnapshot;
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(data);
  window.localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedSnapshot = data;
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
