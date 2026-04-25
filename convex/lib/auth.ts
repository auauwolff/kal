import type { Doc } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';

const DEFAULT_TARGETS = {
  calories: { value: 2600, isOverride: false },
  proteinG: { value: 165, isOverride: false },
  carbsG: { value: 260, isOverride: false },
  fatG: { value: 85, isOverride: false },
};

const slugifyUsername = (value: string): string => {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
  return slug.length > 0 ? slug : 'kal_user';
};

const usernameFromIdentity = (identity: { email?: string; tokenIdentifier: string }) => {
  const base = slugifyUsername(identity.email?.split('@')[0] ?? 'kal_user');
  const suffix = identity.tokenIdentifier
    .replace(/[^a-z0-9]/gi, '')
    .slice(-6)
    .toLowerCase();
  return suffix.length > 0 ? `${base}_${suffix}` : base;
};

const displayNameFromIdentity = (identity: { name?: string; email?: string }) =>
  identity.name ?? identity.email ?? 'Kal user';

export const getAuthUserOrNull = async (
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<'users'> | null> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query('users')
    .withIndex('by_authId', (q) => q.eq('authId', identity.tokenIdentifier))
    .unique();
};

export const requireAuth = async (
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<'users'>> => {
  const user = await getAuthUserOrNull(ctx);
  if (!user) throw new Error('Not authenticated');
  return user;
};

export const ensureAuthUser = async (ctx: MutationCtx): Promise<Doc<'users'>> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('Not authenticated');

  const existing = await ctx.db
    .query('users')
    .withIndex('by_authId', (q) => q.eq('authId', identity.tokenIdentifier))
    .unique();
  if (existing) return existing;

  const now = Date.now();
  const email = identity.email;
  const userId = await ctx.db.insert('users', {
    authId: identity.tokenIdentifier,
    username: usernameFromIdentity(identity),
    displayName: displayNameFromIdentity(identity),
    ...(email ? { email } : {}),
    createdAt: now,
    updatedAt: now,
    bodyStats: null,
    goal: null,
    targets: DEFAULT_TARGETS,
    targetWeightKg: null,
    dailyCalorieTarget: DEFAULT_TARGETS.calories.value,
    dailyProteinG: DEFAULT_TARGETS.proteinG.value,
    dailyCarbsG: DEFAULT_TARGETS.carbsG.value,
    dailyFatG: DEFAULT_TARGETS.fatG.value,
    todayDate: '',
    todayCalories: 0,
    todayProteinG: 0,
    todayCarbsG: 0,
    todayFatG: 0,
    currentStreak: 0,
    longestStreak: 0,
    graceDaysRemaining: 1,
    gemBalance: 0,
  });

  const created = await ctx.db.get(userId);
  if (!created) throw new Error('Failed to create user');
  return created;
};
