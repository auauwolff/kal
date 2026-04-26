import type { Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';

export const GEMS_PER_LOG = 5;

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
