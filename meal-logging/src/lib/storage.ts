import type { AppData } from "./types";

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

let cachedSnapshot: AppData = EMPTY_DATA;
let initPromise: Promise<void> | null = null;

function parseData(raw: unknown): AppData {
  if (!raw || typeof raw !== "object") return EMPTY_DATA;
  const parsed = raw as Partial<AppData>;
  return {
    members: Array.isArray(parsed.members) ? parsed.members : [],
    foodItems: Array.isArray(parsed.foodItems) ? parsed.foodItems : [],
    dayLogs: Array.isArray(parsed.dayLogs) ? parsed.dayLogs : [],
  };
}

function notifyChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function loadData(): AppData {
  return cachedSnapshot;
}

export function initData(): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const response = await fetch("/api/data");
      if (response.ok) {
        cachedSnapshot = parseData(await response.json());
      }
    } catch {
      // Keep the empty snapshot when the API is unavailable.
    }
    notifyChange();
  })();

  return initPromise;
}

export function saveData(data: AppData): void {
  cachedSnapshot = data;
  notifyChange();
  void fetch("/api/data", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function subscribeData(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener(CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
  };
}
