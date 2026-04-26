import type { Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';

const MAX_LOGS_TO_SCAN_PER_TABLE = 1000;

const australiaTodayISO = () => {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Brisbane',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
};

const shiftISODate = (iso: string, days: number): string => {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isISODate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const currentStreakFromDates = (loggedDates: Set<string>, today: string): number => {
  // Before the user logs today, keep showing the streak they carried into today.
  let cursor = loggedDates.has(today) ? today : shiftISODate(today, -1);
  let streak = 0;

  while (loggedDates.has(cursor)) {
    streak++;
    cursor = shiftISODate(cursor, -1);
  }

  return streak;
};

const longestStreakFromDates = (loggedDates: Set<string>): number => {
  const dates = Array.from(loggedDates).sort();
  let longest = 0;
  let run = 0;
  let previous: string | null = null;

  for (const date of dates) {
    run = previous && date === shiftISODate(previous, 1) ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }

  return longest;
};

export const recomputeAndPatchStreak = async (
  ctx: MutationCtx,
  userId: Id<'users'>,
) => {
  const user = await ctx.db.get(userId);
  if (!user) return;

  const today = australiaTodayISO();
  const [mealLogs, exerciseLogs] = await Promise.all([
    ctx.db
      .query('meal_logs')
      .withIndex('by_userId_and_date', (q) => q.eq('userId', userId))
      .order('desc')
      .take(MAX_LOGS_TO_SCAN_PER_TABLE),
    ctx.db
      .query('exercise_logs')
      .withIndex('by_userId_and_date', (q) => q.eq('userId', userId))
      .order('desc')
      .take(MAX_LOGS_TO_SCAN_PER_TABLE),
  ]);

  const loggedDates = new Set<string>();
  for (const log of [...mealLogs, ...exerciseLogs]) {
    if (isISODate(log.date) && log.date <= today) {
      loggedDates.add(log.date);
    }
  }

  const currentStreak = currentStreakFromDates(loggedDates, today);
  const longestStreak = Math.max(
    user.longestStreak,
    currentStreak,
    longestStreakFromDates(loggedDates),
  );

  await ctx.db.patch(userId, {
    currentStreak,
    longestStreak,
    updatedAt: Date.now(),
  });
};
