import { addDays, todayString } from './dates';

/**
 * Current streak: consecutive calendar days ending today. If today is not yet
 * checked in, the streak stays alive from yesterday (yesterday's streak is not
 * broken until the day after a miss).
 */
export function currentStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  let cursor = todayString();
  if (!set.has(cursor)) {
    cursor = addDays(cursor, -1);
  }
  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Longest run of consecutive check-in days anywhere in the habit's history. */
export function bestStreakEver(dates: string[]): number {
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  let best = 0;
  for (const d of set) {
    if (!set.has(addDays(d, -1))) {
      // d starts a run; walk it forward
      let len = 0;
      let c = d;
      while (set.has(c)) {
        len += 1;
        c = addDays(c, 1);
      }
      if (len > best) best = len;
    }
  }
  return best;
}
