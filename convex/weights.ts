import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { ensureAuthUser, getAuthUserOrNull, requireAuth } from './lib/auth';

const round1 = (value: number) => Math.round(value * 10) / 10;

const assertWeight = (weightKg: number) => {
  if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg >= 500) {
    throw new Error('Weight must be between 0 and 500 kg');
  }
};

const latestWeightForUser = async (
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
): Promise<Doc<'weights'> | null> => {
  const result = await ctx.db
    .query('weights')
    .withIndex('by_userId_and_loggedAt', (q) => q.eq('userId', userId))
    .order('desc')
    .first();
  return result ?? null;
};

const findEntryForDate = async (
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
  date: string,
): Promise<Doc<'weights'> | null> => {
  const result = await ctx.db
    .query('weights')
    .withIndex('by_userId_and_date', (q) => q.eq('userId', userId).eq('date', date))
    .first();
  return result ?? null;
};

export const upsertWeightRow = async (
  ctx: MutationCtx,
  userId: Id<'users'>,
  date: string,
  weightKg: number,
): Promise<{ weightId: Id<'weights'>; replaced: boolean }> => {
  const rounded = round1(weightKg);
  const existing = await findEntryForDate(ctx, userId, date);
  if (existing) {
    await ctx.db.patch(existing._id, { weightKg: rounded, loggedAt: Date.now() });
    return { weightId: existing._id, replaced: true };
  }
  const weightId = await ctx.db.insert('weights', {
    userId,
    date,
    weightKg: rounded,
    loggedAt: Date.now(),
  });
  return { weightId, replaced: false };
};

export const latest = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUserOrNull(ctx);
    if (!user) return null;
    const entry = await latestWeightForUser(ctx, user._id);
    if (!entry) return null;
    return {
      id: entry._id,
      date: entry.date,
      weightKg: entry.weightKg,
      loggedAt: entry.loggedAt,
    };
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const user = await getAuthUserOrNull(ctx);
    if (!user) return [];
    const requested = Math.max(1, Math.min(limit ?? 30, 100));
    const entries = await ctx.db
      .query('weights')
      .withIndex('by_userId_and_loggedAt', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(requested);
    return entries.map((entry) => ({
      id: entry._id,
      date: entry.date,
      weightKg: entry.weightKg,
      loggedAt: entry.loggedAt,
    }));
  },
});

export const logForDate = mutation({
  args: { date: v.string(), weightKg: v.number() },
  handler: async (ctx, { date, weightKg }) => {
    assertWeight(weightKg);
    const user = await ensureAuthUser(ctx);
    const result = await upsertWeightRow(ctx, user._id, date, weightKg);

    const newest = await latestWeightForUser(ctx, user._id);
    if (newest && newest.date === date && user.bodyStats) {
      await ctx.db.patch(user._id, {
        bodyStats: { ...user.bodyStats, weightKg: round1(weightKg) },
        updatedAt: Date.now(),
      });
    }

    return result;
  },
});

export const remove = mutation({
  args: { weightId: v.id('weights') },
  handler: async (ctx, { weightId }) => {
    const user = await requireAuth(ctx);
    const entry = await ctx.db.get(weightId);
    if (!entry || entry.userId !== user._id) throw new Error('Weight entry not found');

    await ctx.db.delete(weightId);

    const newest = await latestWeightForUser(ctx, user._id);
    if (newest && user.bodyStats && user.bodyStats.weightKg !== newest.weightKg) {
      await ctx.db.patch(user._id, {
        bodyStats: { ...user.bodyStats, weightKg: newest.weightKg },
        updatedAt: Date.now(),
      });
    }

    return weightId;
  },
});
