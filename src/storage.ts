import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Habit {
  id: string;
  name: string;
  color: string;
  goalNote?: string;
  createdAt: string; // ISO string
}

export interface ReminderSettings {
  enabled: boolean;
  hour: number; // 0-23 local
  minute: number; // 0-59 local
}

const HABITS_KEY = 'streakly.habits.v1';
const CHECKINS_KEY = 'streakly.checkins.v1';
const SETTINGS_KEY = 'streakly.settings.v1';

export const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  hour: 20,
  minute: 0,
};

export const COLOR_SWATCHES = [
  '#FF8C42', // warm orange
  '#FF5A3C', // flame red
  '#F2B705', // golden
  '#7BD389', // leaf green
  '#4ECDC4', // teal
  '#6C9EFF', // sky blue
  '#B388EB', // lavender
  '#FF7BAC', // rose
];

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // offline-first: storage failures are non-fatal
  }
}

export function loadHabits(): Promise<Habit[]> {
  return readJson<Habit[]>(HABITS_KEY, []);
}

export function saveHabits(habits: Habit[]): Promise<void> {
  return writeJson(HABITS_KEY, habits);
}

/** Map of habitId -> array of local YYYY-MM-DD check-in dates. */
export function loadCheckins(): Promise<Record<string, string[]>> {
  return readJson<Record<string, string[]>>(CHECKINS_KEY, {});
}

export function saveCheckins(checkins: Record<string, string[]>): Promise<void> {
  return writeJson(CHECKINS_KEY, checkins);
}

export async function loadSettings(): Promise<ReminderSettings> {
  const s = await readJson<Partial<ReminderSettings>>(SETTINGS_KEY, {});
  return { ...DEFAULT_SETTINGS, ...s };
}

export function saveSettings(settings: ReminderSettings): Promise<void> {
  return writeJson(SETTINGS_KEY, settings);
}
