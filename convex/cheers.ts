import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { getAuthUserOrNull, requireAuth } from './lib/auth';
import { australiaTodayISO } from './lib/dateAEST';
import { canonicalPair } from './lib/social';
import { spendGems } from './lib/rewards';

export const CHEER_GEM_COST = 1;
export const CHEERS_PER_FRIEND_PER_DAY = 3;

interface CheerCountByFriend {
  friendUserId: Id<'users'>;
  count: number;
}

export const sendCheer = mutation({
  args: { toUserId: v.id('users') },
  handler: async (ctx, { toUserId }) => {
    const me = await requireAuth(ctx);
    if (me._id === toUserId) throw new Error('Cannot cheer yourself');

    const { userA, userB } = canonicalPair(me._id, toUserId);
    const friendship = await ctx.db
      .query('friendships')
      .withIndex('by_pair', (q) => q.eq('userA', userA).eq('userB', userB))
      .unique();
    if (!friendship || friendship.status !== 'accepted') {
      throw new Error('Not friends');
    }

    const today = australiaTodayISO();
    const existing = await ctx.db
      .query('cheers')
      .withIndex('by_fromUser_toUser_date', (q) =>
        q.eq('fromUser', me._id).eq('toUser', toUserId).eq('date', today),
      )
      .take(CHEERS_PER_FRIEND_PER_DAY + 1);

    if (existing.length >= CHEERS_PER_FRIEND_PER_DAY) {
      throw new Error('Daily cheer limit reached for this friend');
    }

    const remainingBalance = await spendGems(ctx, me._id, CHEER_GEM_COST);

    const cheerId = await ctx.db.insert('cheers', {
      fromUser: me._id,
      toUser: toUserId,
      date: today,
      createdAt: Date.now(),
    });

    return {
      cheerId,
      remainingBalance,
      sentTodayCount: existing.length + 1,
      dailyLimit: CHEERS_PER_FRIEND_PER_DAY,
    };
  },
});

export const listReceivedToday = query({
  args: {},
  handler: async (ctx): Promise<CheerCountByFriend[]> => {
    const me = await getAuthUserOrNull(ctx);
    if (!me) return [];

    const today = australiaTodayISO();
    const cheers = await ctx.db
      .query('cheers')
      .withIndex('by_toUser_date', (q) =>
        q.eq('toUser', me._id).eq('date', today),
      )
      .take(200);

    const counts = new Map<Id<'users'>, number>();
    for (const cheer of cheers) {
      counts.set(cheer.fromUser, (counts.get(cheer.fromUser) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([friendUserId, count]) => ({ friendUserId, count }))
      .sort((a, b) => b.count - a.count);
  },
});
