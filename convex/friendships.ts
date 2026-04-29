import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';
import { getAuthUserOrNull, requireAuth } from './lib/auth';
import { australiaTodayISO } from './lib/dateAEST';
import { canonicalPair, friendStreakDisplayDays } from './lib/social';

const FRIEND_LIST_LIMIT = 50;
const REQUEST_LIST_LIMIT = 50;

interface PublicFriendProfile {
  _id: Id<'users'>;
  username: string;
  displayName: string;
  currentStreak: number;
  longestStreak: number;
  gemBalance: number;
  joinedAt: number;
}

interface FriendStreakSummary {
  currentDays: number;
  longestDays: number;
  lastBothLoggedDate?: string;
  alive: boolean;
  bothLoggedToday: boolean;
}

interface FriendListEntry {
  friendshipId: Id<'friendships'>;
  acceptedAt?: number;
  friend: PublicFriendProfile;
  streak: FriendStreakSummary | null;
  cheersSentToday: number;
}

interface FriendRequestEntry {
  friendshipId: Id<'friendships'>;
  createdAt: number;
  user: PublicFriendProfile;
}

const toPublicFriendProfile = (user: Doc<'users'>): PublicFriendProfile => ({
  _id: user._id,
  username: user.username,
  displayName: user.displayName,
  currentStreak: user.currentStreak,
  longestStreak: user.longestStreak,
  gemBalance: user.gemBalance,
  joinedAt: user.createdAt,
});

const otherUserId = (
  friendship: Doc<'friendships'>,
  meId: Id<'users'>,
): Id<'users'> =>
  friendship.userA === meId ? friendship.userB : friendship.userA;

export const listFriends = query({
  args: {},
  handler: async (ctx): Promise<FriendListEntry[]> => {
    const me = await getAuthUserOrNull(ctx);
    if (!me) return [];

    const today = australiaTodayISO();
    const [asA, asB] = await Promise.all([
      ctx.db
        .query('friendships')
        .withIndex('by_userA_status', (q) =>
          q.eq('userA', me._id).eq('status', 'accepted'),
        )
        .take(FRIEND_LIST_LIMIT),
      ctx.db
        .query('friendships')
        .withIndex('by_userB_status', (q) =>
          q.eq('userB', me._id).eq('status', 'accepted'),
        )
        .take(FRIEND_LIST_LIMIT),
    ]);

    const friendships = [...asA, ...asB];
    const entries: FriendListEntry[] = [];

    for (const friendship of friendships) {
      const friendId = otherUserId(friendship, me._id);
      const friend = await ctx.db.get(friendId);
      if (!friend) continue;

      const { userA, userB } = canonicalPair(me._id, friendId);
      const streakRow = await ctx.db
        .query('friend_streaks')
        .withIndex('by_pair', (q) => q.eq('userA', userA).eq('userB', userB))
        .unique();

      let streak: FriendStreakSummary | null = null;
      if (streakRow) {
        const aliveDays = friendStreakDisplayDays(
          streakRow.lastBothLoggedDate,
          streakRow.currentDays,
        );
        streak = {
          currentDays: aliveDays,
          longestDays: streakRow.longestDays,
          ...(streakRow.lastBothLoggedDate
            ? { lastBothLoggedDate: streakRow.lastBothLoggedDate }
            : {}),
          alive: aliveDays > 0,
          bothLoggedToday: streakRow.lastBothLoggedDate === today,
        };
      }

      const cheersToday = await ctx.db
        .query('cheers')
        .withIndex('by_fromUser_toUser_date', (q) =>
          q
            .eq('fromUser', me._id)
            .eq('toUser', friendId)
            .eq('date', today),
        )
        .take(10);

      entries.push({
        friendshipId: friendship._id,
        ...(friendship.acceptedAt ? { acceptedAt: friendship.acceptedAt } : {}),
        friend: toPublicFriendProfile(friend),
        streak,
        cheersSentToday: cheersToday.length,
      });
    }

    entries.sort((a, b) => {
      const aDays = a.streak?.currentDays ?? 0;
      const bDays = b.streak?.currentDays ?? 0;
      if (aDays !== bDays) return bDays - aDays;
      return a.friend.displayName.localeCompare(b.friend.displayName);
    });

    return entries;
  },
});

export const listPendingRequests = query({
  args: {},
  handler: async (
    ctx,
  ): Promise<{ incoming: FriendRequestEntry[]; outgoing: FriendRequestEntry[] }> => {
    const me = await getAuthUserOrNull(ctx);
    if (!me) return { incoming: [], outgoing: [] };

    const [asA, asB] = await Promise.all([
      ctx.db
        .query('friendships')
        .withIndex('by_userA_status', (q) =>
          q.eq('userA', me._id).eq('status', 'pending'),
        )
        .take(REQUEST_LIST_LIMIT),
      ctx.db
        .query('friendships')
        .withIndex('by_userB_status', (q) =>
          q.eq('userB', me._id).eq('status', 'pending'),
        )
        .take(REQUEST_LIST_LIMIT),
    ]);

    const incoming: FriendRequestEntry[] = [];
    const outgoing: FriendRequestEntry[] = [];

    for (const friendship of [...asA, ...asB]) {
      const otherId = otherUserId(friendship, me._id);
      const other = await ctx.db.get(otherId);
      if (!other) continue;
      const entry: FriendRequestEntry = {
        friendshipId: friendship._id,
        createdAt: friendship.createdAt,
        user: toPublicFriendProfile(other),
      };
      if (friendship.initiatedBy === me._id) outgoing.push(entry);
      else incoming.push(entry);
    }

    incoming.sort((a, b) => b.createdAt - a.createdAt);
    outgoing.sort((a, b) => b.createdAt - a.createdAt);
    return { incoming, outgoing };
  },
});

export const sendRequest = mutation({
  args: { toUserId: v.id('users') },
  handler: async (ctx, { toUserId }) => {
    const me = await requireAuth(ctx);
    if (me._id === toUserId) throw new Error('Cannot friend yourself');

    const target = await ctx.db.get(toUserId);
    if (!target) throw new Error('User not found');

    const { userA, userB } = canonicalPair(me._id, toUserId);
    const existing = await ctx.db
      .query('friendships')
      .withIndex('by_pair', (q) => q.eq('userA', userA).eq('userB', userB))
      .unique();

    if (existing) {
      if (existing.status === 'blocked') {
        throw new Error('Cannot send request to this user');
      }
      if (existing.status === 'accepted') {
        return { friendshipId: existing._id, status: 'accepted' as const };
      }
      // Pending: if the other user already requested me, auto-accept.
      if (existing.initiatedBy !== me._id) {
        await ctx.db.patch(existing._id, {
          status: 'accepted',
          acceptedAt: Date.now(),
        });
        return { friendshipId: existing._id, status: 'accepted' as const };
      }
      return { friendshipId: existing._id, status: 'pending' as const };
    }

    const friendshipId = await ctx.db.insert('friendships', {
      userA,
      userB,
      status: 'pending',
      initiatedBy: me._id,
      createdAt: Date.now(),
    });
    return { friendshipId, status: 'pending' as const };
  },
});

const requireRequestParticipant = async (
  ctx: MutationCtx,
  friendshipId: Id<'friendships'>,
  meId: Id<'users'>,
): Promise<Doc<'friendships'>> => {
  const friendship = await ctx.db.get(friendshipId);
  if (!friendship) throw new Error('Friendship not found');
  if (friendship.userA !== meId && friendship.userB !== meId) {
    throw new Error('Not your friendship');
  }
  return friendship;
};

export const acceptRequest = mutation({
  args: { friendshipId: v.id('friendships') },
  handler: async (ctx, { friendshipId }) => {
    const me = await requireAuth(ctx);
    const friendship = await requireRequestParticipant(ctx, friendshipId, me._id);

    if (friendship.status !== 'pending') {
      throw new Error('Request is not pending');
    }
    if (friendship.initiatedBy === me._id) {
      throw new Error('Cannot accept your own request');
    }

    await ctx.db.patch(friendshipId, {
      status: 'accepted',
      acceptedAt: Date.now(),
    });
    return friendshipId;
  },
});

export const declineRequest = mutation({
  args: { friendshipId: v.id('friendships') },
  handler: async (ctx, { friendshipId }) => {
    const me = await requireAuth(ctx);
    const friendship = await requireRequestParticipant(ctx, friendshipId, me._id);

    if (friendship.status !== 'pending') {
      throw new Error('Request is not pending');
    }
    // Same handler covers an outgoing-request cancel and an incoming decline.
    await ctx.db.delete(friendshipId);
    return friendshipId;
  },
});

const deleteFriendStreak = async (
  ctx: MutationCtx,
  a: Id<'users'>,
  b: Id<'users'>,
) => {
  const { userA, userB } = canonicalPair(a, b);
  const row = await ctx.db
    .query('friend_streaks')
    .withIndex('by_pair', (q) => q.eq('userA', userA).eq('userB', userB))
    .unique();
  if (row) await ctx.db.delete(row._id);
};

export const removeFriend = mutation({
  args: { friendshipId: v.id('friendships') },
  handler: async (ctx, { friendshipId }) => {
    const me = await requireAuth(ctx);
    const friendship = await requireRequestParticipant(ctx, friendshipId, me._id);

    if (friendship.status !== 'accepted') {
      throw new Error('Not currently friends');
    }

    const otherId = otherUserId(friendship, me._id);
    await deleteFriendStreak(ctx, me._id, otherId);
    await ctx.db.delete(friendshipId);
    return friendshipId;
  },
});

export const block = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const me = await requireAuth(ctx);
    if (me._id === userId) throw new Error('Cannot block yourself');

    const target = await ctx.db.get(userId);
    if (!target) throw new Error('User not found');

    const { userA, userB } = canonicalPair(me._id, userId);
    const existing = await ctx.db
      .query('friendships')
      .withIndex('by_pair', (q) => q.eq('userA', userA).eq('userB', userB))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: 'blocked',
        initiatedBy: me._id,
        acceptedAt: undefined,
      });
      await deleteFriendStreak(ctx, me._id, userId);
      return existing._id;
    }

    const friendshipId = await ctx.db.insert('friendships', {
      userA,
      userB,
      status: 'blocked',
      initiatedBy: me._id,
      createdAt: Date.now(),
    });
    return friendshipId;
  },
});

export const unblock = mutation({
  args: { friendshipId: v.id('friendships') },
  handler: async (ctx, { friendshipId }) => {
    const me = await requireAuth(ctx);
    const friendship = await ctx.db.get(friendshipId);
    if (!friendship) throw new Error('Friendship not found');
    if (friendship.status !== 'blocked') throw new Error('Not blocked');
    if (friendship.initiatedBy !== me._id) {
      throw new Error('Only the blocker can unblock');
    }
    await ctx.db.delete(friendshipId);
    return friendshipId;
  },
});
