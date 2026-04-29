import { v } from 'convex/values';
import { query } from './_generated/server';
import type { Doc } from './_generated/dataModel';
import { getAuthUserOrNull } from './lib/auth';

const DEFAULT_TARGETS = {
  calories: 2600,
  proteinG: 165,
  carbsG: 260,
  fatG: 85,
};

const EXERCISE_TYPES: Doc<'exercise_logs'>['type'][] = [
  'strength',
  'cardio',
  'sports',
  'walk',
  'other',
];

const toISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shiftISO = (iso: string, days: number): string => {
  const date = new Date(`${iso}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toISO(date);
};

const datesBack = (days: number): string[] => {
  const today = new Date();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - index - 1));
    return toISO(date);
  });
};

const normalizeRangeDays = (days: number): 7 | 30 | 90 => {
  if (days <= 7) return 7;
  if (days <= 30) return 30;
  return 90;
};

const weekStartISO = (iso: string): string => {
  const date = new Date(`${iso}T00:00:00`);
  const day = date.getDay();
  const mondayOffset = (day + 6) % 7;
  date.setDate(date.getDate() - mondayOffset);
  return toISO(date);
};

const weekLabel = (iso: string): string => {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
};

const emptyExerciseMinutes = (): Record<Doc<'exercise_logs'>['type'], number> => ({
  strength: 0,
  cardio: 0,
  sports: 0,
  walk: 0,
  other: 0,
});

const targetSnapshot = (user: Doc<'users'> | null) => ({
  calories: user?.dailyCalorieTarget ?? DEFAULT_TARGETS.calories,
  proteinG: user?.dailyProteinG ?? DEFAULT_TARGETS.proteinG,
  carbsG: user?.dailyCarbsG ?? DEFAULT_TARGETS.carbsG,
  fatG: user?.dailyFatG ?? DEFAULT_TARGETS.fatG,
});

export const getRange = query({
  args: { days: v.number() },
  handler: async (ctx, { days }) => {
    const rangeDays = normalizeRangeDays(days);
    const dates = datesBack(rangeDays);
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    const user = await getAuthUserOrNull(ctx);
    const targets = targetSnapshot(user);

    const dayMap = new Map(
      dates.map((date) => [
        date,
        {
          date,
          calories: 0,
          proteinG: 0,
          carbsG: 0,
          fatG: 0,
          targetCalories: targets.calories,
          targetProteinG: targets.proteinG,
          targetCarbsG: targets.carbsG,
          targetFatG: targets.fatG,
          streakStatus: 0,
        },
      ]),
    );

    if (!user) {
      return {
        rangeDays,
        days: Array.from(dayMap.values()),
        weights: [],
        exerciseWeeks: [],
        currentStreak: 0,
        longestStreak: 0,
        currentWeightKg: null,
        goal: null,
        prevPeriodAverages: null,
      };
    }

    const prevEndDate = shiftISO(startDate, -1);
    const prevStartDate = shiftISO(startDate, -rangeDays);

    const [mealLogs, weightLogs, exerciseLogs, prevMealLogs] = await Promise.all([
      ctx.db
        .query('meal_logs')
        .withIndex('by_userId_and_date', (q) =>
          q.eq('userId', user._id).gte('date', startDate).lte('date', endDate),
        )
        .take(2000),
      ctx.db
        .query('weights')
        .withIndex('by_userId_and_date', (q) =>
          q.eq('userId', user._id).gte('date', startDate).lte('date', endDate),
        )
        .take(500),
      ctx.db
        .query('exercise_logs')
        .withIndex('by_userId_and_date', (q) =>
          q.eq('userId', user._id).gte('date', startDate).lte('date', endDate),
        )
        .take(1000),
      ctx.db
        .query('meal_logs')
        .withIndex('by_userId_and_date', (q) =>
          q.eq('userId', user._id).gte('date', prevStartDate).lte('date', prevEndDate),
        )
        .take(2000),
    ]);

    for (const log of mealLogs) {
      const day = dayMap.get(log.date);
      if (!day) continue;
      day.calories += log.calories;
      day.proteinG += log.proteinG;
      day.carbsG += log.carbsG;
      day.fatG += log.fatG;
    }

    for (const day of dayMap.values()) {
      const hasLogged = day.calories > 0;
      const calorieHit =
        day.targetCalories > 0 &&
        Math.abs(day.calories - day.targetCalories) / day.targetCalories <= 0.15;
      const proteinHit = day.proteinG >= day.targetProteinG;
      day.streakStatus = !hasLogged
        ? 0
        : calorieHit && proteinHit
          ? 3
          : calorieHit || proteinHit
            ? 2
            : 1;
    }

    const latestWeightByDate = new Map<string, Doc<'weights'>>();
    for (const log of weightLogs) {
      const current = latestWeightByDate.get(log.date);
      if (!current || log.loggedAt > current.loggedAt) {
        latestWeightByDate.set(log.date, log);
      }
    }
    const weights = Array.from(latestWeightByDate.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((log) => ({ date: log.date, weightKg: log.weightKg }));

    const weekStarts = Array.from(
      new Set(dates.map((date) => weekStartISO(date))),
    );
    const exerciseByWeek = new Map(
      weekStarts.map((weekStart) => [
        weekStart,
        {
          weekStart,
          weekLabel: weekLabel(weekStart),
          minutes: emptyExerciseMinutes(),
        },
      ]),
    );

    for (const log of exerciseLogs) {
      const week = exerciseByWeek.get(weekStartISO(log.date));
      if (!week) continue;
      week.minutes[log.type] += log.durationMin;
    }

    const exerciseWeeks = Array.from(exerciseByWeek.values()).filter(
      (week) =>
        EXERCISE_TYPES.some((type) => week.minutes[type] > 0) ||
        week.weekStart >= shiftISO(endDate, -Math.max(rangeDays, 28)),
    );

    const prevDayCount = new Set(prevMealLogs.map((log) => log.date)).size;
    let prevPeriodAverages = null;
    if (prevDayCount > 0) {
      const totals = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
      for (const log of prevMealLogs) {
        totals.calories += log.calories;
        totals.proteinG += log.proteinG;
        totals.carbsG += log.carbsG;
        totals.fatG += log.fatG;
      }
      prevPeriodAverages = {
        calories: Math.round(totals.calories / prevDayCount),
        proteinG: Math.round(totals.proteinG / prevDayCount),
        carbsG: Math.round(totals.carbsG / prevDayCount),
        fatG: Math.round(totals.fatG / prevDayCount),
        days: prevDayCount,
      };
    }

    return {
      rangeDays,
      days: Array.from(dayMap.values()),
      weights,
      exerciseWeeks,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      currentWeightKg: user.bodyStats?.weightKg ?? null,
      goal: user.goal ?? null,
      prevPeriodAverages,
    };
  },
});
