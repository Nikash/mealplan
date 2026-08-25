import fs from "fs/promises";
import path from "path";
import { normalizeDayLogs, type AppData } from "./types";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "meal-logging-data.json");

export const EMPTY_APP_DATA: AppData = {
  members: [],
  foodItems: [],
  dayLogs: [],
};

function parseData(raw: string): AppData {
  try {
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      members: Array.isArray(parsed.members) ? parsed.members : [],
      foodItems: Array.isArray(parsed.foodItems) ? parsed.foodItems : [],
      dayLogs: normalizeDayLogs(parsed.dayLogs),
    };
  } catch {
    return EMPTY_APP_DATA;
  }
}

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readAppData(): Promise<AppData> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return parseData(raw);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return EMPTY_APP_DATA;
    }
    throw error;
  }
}

export async function writeAppData(data: AppData): Promise<void> {
  await ensureDataDir();
  const tmp = `${DATA_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tmp, DATA_FILE);
}
