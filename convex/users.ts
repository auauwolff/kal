import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { ensureAuthUser, getAuthUserOrNull, requireAuth } from './lib/auth';
import { GEMS_PER_LOG } from './lib/rewards';
import {
  bodyStatsValidator,
  userTargetsValidator,
  weightGoalValidator,
} from './validators';

export const get = query({
  args: {},
  handler: async (ctx) => {
    return await getAuthUserOrNull(ctx);
  },
});

export const backfillMyGems = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    if (user.gemBalanceBackfilledAt) return user.gemBalance;

    const mealLogs = await ctx.db
      .query('meal_logs')
      .withIndex('by_userId_and_loggedAt', (q) => q.eq('userId', user._id))
      .take(5000);
    const mealCategoryDays = new Set<string>();
    for (const log of mealLogs) mealCategoryDays.add(`${log.date}|${log.mealType}`);

    const exerciseLogs = await ctx.db
      .query('exercise_logs')
      .withIndex('by_userId_and_loggedAt', (q) => q.eq('userId', user._id))
      .take(5000);
    const exerciseDays = new Set<string>();
    for (const log of exerciseLogs) exerciseDays.add(log.date);

    const backfilledBalance =
      (mealCategoryDays.size + exerciseDays.size) * GEMS_PER_LOG;
    const gemBalance = Math.max(user.gemBalance, backfilledBalance);

    await ctx.db.patch(user._id, {
      gemBalance,
      gemBalanceBackfilledAt: Date.now(),
      updatedAt: Date.now(),
    });

    return gemBalance;
  },
});

export const upsertProfile = mutation({
  args: {
    bodyStats: v.union(bodyStatsValidator, v.null()),
    goal: v.union(weightGoalValidator, v.null()),
    targets: userTargetsValidator,
  },
  handler: async (ctx, { bodyStats, goal, targets }) => {
    const user = await ensureAuthUser(ctx);
    const targetWeightKg = goal
      ? goal.type === 'maintain'
        ? bodyStats?.weightKg ?? goal.targetWeightKg
        : goal.targetWeightKg
      : null;

    await ctx.db.patch(user._id, {
      bodyStats,
      goal,
      targets,
      targetWeightKg,
      dailyCalorieTarget: targets.calories.value,
      dailyProteinG: targets.proteinG.value,
      dailyCarbsG: targets.carbsG.value,
      dailyFatG: targets.fatG.value,
      updatedAt: Date.now(),
    });

    return await ctx.db.get(user._id);
  },
});
