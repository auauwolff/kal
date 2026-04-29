import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';
import { australiaTodayISO, shiftISODate } from './dateAEST';

const MAX_FRIENDS_PER_BUMP = 200;

export const canonicalPair = (
  a: Id<'users'>,
  b: Id<'users'>,
): { userA: Id<'users'>; userB: Id<'users'> } => {
  if (a === b) throw new Error('Cannot pair a user with themselves');
  return a < b ? { userA: a, userB: b } : { userA: b, userB: a };
};

export const findFriendshipBetween = async (
  ctx: QueryCtx | MutationCtx,
  a: Id<'users'>,
  b: Id<'users'>,
) => {
  const { userA, userB } = canonicalPair(a, b);
  return await ctx.db
    .query('friendships')
    .withIndex('by_pair', (q) => q.eq('userA', userA).eq('userB', userB))
    .unique();
};

// Called after a user logs a meal or exercise. Marks them as active today and,
// for every accepted friendship where the other side has also logged today,
// extends the shared friend streak.
//
// Anchors on AEST "today" (matches solo streak math). Backfilled logs for
// older dates do not bump friend streaks — friend streaks are about
// both-people-here-today, not retroactive activity.
export const bumpFriendStreaksForLog = async (
  ctx: MutationCtx,
  userId: Id<'users'>,
) => {
  const today = australiaTodayISO();
  const yesterday = shiftISODate(today, -1);

  const user = await ctx.db.get(userId);
  if (!user) return;
  if (user.lastLoggedDate !== today) {
    await ctx.db.patch(userId, {
      lastLoggedDate: today,
      updatedAt: Date.now(),
    });
  }

  const [asA, asB] = await Promise.all([
    ctx.db
      .query('friendships')
      .withIndex('by_userA_status', (q) =>
        q.eq('userA', userId).eq('status', 'accepted'),
      )
      .take(MAX_FRIENDS_PER_BUMP),
    ctx.db
      .query('friendships')
      .withIndex('by_userB_status', (q) =>
        q.eq('userB', userId).eq('status', 'accepted'),
      )
      .take(MAX_FRIENDS_PER_BUMP),
  ]);

  for (const friendship of [...asA, ...asB]) {
    const otherUserId =
      friendship.userA === userId ? friendship.userB : friendship.userA;
    const otherUser = await ctx.db.get(otherUserId);
    if (!otherUser) continue;
    if (otherUser.lastLoggedDate !== today) continue;

    const { userA, userB } = canonicalPair(userId, otherUserId);
    const existing = await ctx.db
      .query('friend_streaks')
      .withIndex('by_pair', (q) => q.eq('userA', userA).eq('userB', userB))
      .unique();

    if (!existing) {
      await ctx.db.insert('friend_streaks', {
        userA,
        userB,
        currentDays: 1,
        longestDays: 1,
        lastBothLoggedDate: today,
      });
      continue;
    }

    if (existing.lastBothLoggedDate === today) continue;

    const nextCurrent =
      existing.lastBothLoggedDate === yesterday ? existing.currentDays + 1 : 1;

    await ctx.db.patch(existing._id, {
      currentDays: nextCurrent,
      longestDays: Math.max(existing.longestDays, nextCurrent),
      lastBothLoggedDate: today,
    });
  }
};

// Read-side: a friend streak is "alive" if both parties logged today or
// yesterday (one-day grace before display falls back to "ready to restart").
export const friendStreakDisplayDays = (
  lastBothLoggedDate: string | undefined,
  currentDays: number,
): number => {
  if (!lastBothLoggedDate) return 0;
  const today = australiaTodayISO();
  const yesterday = shiftISODate(today, -1);
  if (lastBothLoggedDate === today || lastBothLoggedDate === yesterday) {
    return currentDays;
  }
  return 0;
};
