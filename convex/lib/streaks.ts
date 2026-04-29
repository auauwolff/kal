import type { Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import { australiaTodayISO, isISODate, shiftISODate } from './dateAEST';

const MAX_LOGS_TO_SCAN_PER_TABLE = 1000;

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
