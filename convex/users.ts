import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { ensureAuthUser, getAuthUserOrNull } from './lib/auth';
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
