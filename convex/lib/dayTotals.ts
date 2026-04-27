import type { Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';

export const australiaTodayISO = () => {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Brisbane',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
};

export const recomputeAndPatchDaySnapshot = async (
  ctx: MutationCtx,
  userId: Id<'users'>,
  date: string,
) => {
  if (date !== australiaTodayISO()) return;

  const logs = await ctx.db
    .query('meal_logs')
    .withIndex('by_userId_and_date', (q) =>
      q.eq('userId', userId).eq('date', date),
    )
    .take(500);

  const totals = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      proteinG: acc.proteinG + log.proteinG,
      carbsG: acc.carbsG + log.carbsG,
      fatG: acc.fatG + log.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );

  await ctx.db.patch(userId, {
    todayDate: date,
    todayCalories: totals.calories,
    todayProteinG: totals.proteinG,
    todayCarbsG: totals.carbsG,
    todayFatG: totals.fatG,
    updatedAt: Date.now(),
  });
};
