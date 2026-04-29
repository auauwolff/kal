import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';

export const GEMS_PER_MEAL_LOG = 1;
export const GEMS_PER_EXERCISE_LOG = 5;

export const awardGems = async (
  ctx: MutationCtx,
  userId: Id<'users'>,
  amount: number,
) => {
  if (!Number.isFinite(amount) || amount <= 0) return;

  const user = await ctx.db.get(userId);
  if (!user) throw new Error('User not found');

  await ctx.db.patch(userId, {
    gemBalance: Math.max(0, user.gemBalance + amount),
    updatedAt: Date.now(),
  });
};

export const spendGems = async (
  ctx: MutationCtx,
  userId: Id<'users'>,
  amount: number,
): Promise<number> => {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Spend amount must be positive');
  }

  const user = await ctx.db.get(userId);
  if (!user) throw new Error('User not found');
  if (user.gemBalance < amount) {
    throw new Error('Not enough gems');
  }

  const nextBalance = user.gemBalance - amount;
  await ctx.db.patch(userId, {
    gemBalance: nextBalance,
    updatedAt: Date.now(),
  });
  return nextBalance;
};

export const isFirstMealEntryOfDay = async (
  ctx: MutationCtx,
  userId: Id<'users'>,
  date: string,
  mealType: Doc<'meal_logs'>['mealType'],
) => {
  for await (const log of ctx.db
    .query('meal_logs')
    .withIndex('by_userId_and_date', (q) =>
      q.eq('userId', userId).eq('date', date),
    )) {
    if (log.mealType === mealType) return false;
  }
  return true;
};

export const isFirstExerciseEntryOfDay = async (
  ctx: MutationCtx,
  userId: Id<'users'>,
  date: string,
) => {
  const existing = await ctx.db
    .query('exercise_logs')
    .withIndex('by_userId_and_date', (q) =>
      q.eq('userId', userId).eq('date', date),
    )
    .first();
  return existing === null;
};
