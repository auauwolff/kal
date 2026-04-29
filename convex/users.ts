import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { ensureAuthUser, getAuthUserOrNull, requireAuth } from './lib/auth';
import { GEMS_PER_EXERCISE_LOG, GEMS_PER_MEAL_LOG } from './lib/rewards';
import { canonicalPair } from './lib/social';
import {
  bodyStatsValidator,
  userTargetsValidator,
  weightGoalValidator,
} from './validators';
import { upsertWeightRow } from './weights';

interface PublicProfile {
  _id: Id<'users'>;
  username: string;
  displayName: string;
  currentStreak: number;
  longestStreak: number;
  gemBalance: number;
  joinedAt: number;
}

const toPublicProfile = (user: Doc<'users'>): PublicProfile => ({
  _id: user._id,
  username: user.username,
  displayName: user.displayName,
  currentStreak: user.currentStreak,
  longestStreak: user.longestStreak,
  gemBalance: user.gemBalance,
  joinedAt: user.createdAt,
});

const todayISO = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
      mealCategoryDays.size * GEMS_PER_MEAL_LOG +
      exerciseDays.size * GEMS_PER_EXERCISE_LOG;
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
    const previousWeightKg = user.bodyStats?.weightKg ?? null;
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

    if (bodyStats && bodyStats.weightKg !== previousWeightKg) {
      await upsertWeightRow(ctx, user._id, todayISO(), bodyStats.weightKg);
    }

    return await ctx.db.get(user._id);
  },
});

const SEARCH_USERNAME_LIMIT = 10;

export const searchByUsername = query({
  args: { query: v.string() },
  handler: async (ctx, { query: rawQuery }): Promise<PublicProfile[]> => {
    const me = await getAuthUserOrNull(ctx);
    if (!me) return [];

    const prefix = rawQuery.trim().toLowerCase();
    if (prefix.length < 2) return [];

    const results = await ctx.db
      .query('users')
      .withIndex('by_username', (q) =>
        q.gte('username', prefix).lt('username', `${prefix}￿`),
      )
      .take(SEARCH_USERNAME_LIMIT * 3);

    const profiles: PublicProfile[] = [];
    for (const user of results) {
      if (user._id === me._id) continue;
      const { userA, userB } = canonicalPair(me._id, user._id);
      const friendship = await ctx.db
        .query('friendships')
        .withIndex('by_pair', (q) => q.eq('userA', userA).eq('userB', userB))
        .unique();
      if (friendship?.status === 'blocked') continue;
      profiles.push(toPublicProfile(user));
      if (profiles.length >= SEARCH_USERNAME_LIMIT) break;
    }
    return profiles;
  },
});

export const getPublicProfile = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }): Promise<PublicProfile | null> => {
    const me = await getAuthUserOrNull(ctx);
    if (!me) return null;
    if (me._id === userId) return toPublicProfile(me);

    const target = await ctx.db.get(userId);
    if (!target) return null;

    const { userA, userB } = canonicalPair(me._id, userId);
    const friendship = await ctx.db
      .query('friendships')
      .withIndex('by_pair', (q) => q.eq('userA', userA).eq('userB', userB))
      .unique();
    if (friendship?.status === 'blocked') return null;

    return toPublicProfile(target);
  },
});
