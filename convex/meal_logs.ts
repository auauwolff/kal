import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { ensureAuthUser, getAuthUserOrNull, requireAuth } from './lib/auth';
import { awardGems, GEMS_PER_LOG, isFirstMealEntryOfDay } from './lib/rewards';
import { recomputeAndPatchStreak } from './lib/streaks';
import { recomputeAndPatchDaySnapshot } from './lib/dayTotals';
import { mealTypeValidator } from './validators';

const round1 = (value: number) => Math.round(value * 10) / 10;

type MealType = Doc<'meal_logs'>['mealType'];

interface ClientMealLog {
  id: Id<'meal_logs'>;
  userId: Id<'users'>;
  date: string;
  mealType: MealType;
  loggedAt: number;
  foodId: Id<'foods'>;
  foodName: string;
  brand?: string;
  quantityG: number;
  servingLabel?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface ClientExerciseLog {
  id: Id<'exercise_logs'>;
  userId: Id<'users'>;
  date: string;
  type: Doc<'exercise_logs'>['type'];
  durationMin: number;
  intensity: Doc<'exercise_logs'>['intensity'];
  notes?: string;
  loggedAt: number;
}

const emptyMeals = (): Record<MealType, ClientMealLog[]> => ({
  breakfast: [],
  lunch: [],
  dinner: [],
  snack: [],
});

const toClientMealLog = (log: Doc<'meal_logs'>): ClientMealLog => ({
  id: log._id,
  userId: log.userId,
  date: log.date,
  mealType: log.mealType,
  loggedAt: log.loggedAt,
  foodId: log.foodId,
  foodName: log.foodName,
  ...(log.brand ? { brand: log.brand } : {}),
  quantityG: log.quantityG,
  ...(log.servingLabel ? { servingLabel: log.servingLabel } : {}),
  calories: log.calories,
  proteinG: log.proteinG,
  carbsG: log.carbsG,
  fatG: log.fatG,
});

const toClientExerciseLog = (log: Doc<'exercise_logs'>): ClientExerciseLog => ({
  id: log._id,
  userId: log.userId,
  date: log.date,
  type: log.type,
  durationMin: log.durationMin,
  intensity: log.intensity,
  ...(log.notes ? { notes: log.notes } : {}),
  loggedAt: log.loggedAt,
});

const assertPositiveQuantity = (quantityG: number) => {
  if (!Number.isFinite(quantityG) || quantityG <= 0) {
    throw new Error('Quantity must be greater than 0g');
  }
};

export const getByDate = query({
  args: { date: v.string() },
  handler: async (ctx, { date }) => {
    const user = await getAuthUserOrNull(ctx);
    const meals = emptyMeals();
    const totals = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };

    if (!user) return { date, totals, meals, exercise: [] };

    const [mealLogs, exerciseLogs] = await Promise.all([
      ctx.db
        .query('meal_logs')
        .withIndex('by_userId_and_date', (q) =>
          q.eq('userId', user._id).eq('date', date),
        )
        .take(200),
      ctx.db
        .query('exercise_logs')
        .withIndex('by_userId_and_date', (q) =>
          q.eq('userId', user._id).eq('date', date),
        )
        .take(100),
    ]);

    const sortedMealLogs = [...mealLogs].sort((a, b) => a.loggedAt - b.loggedAt);
    for (const log of sortedMealLogs) {
      const entry = toClientMealLog(log);
      meals[entry.mealType].push(entry);
      totals.calories += entry.calories;
      totals.proteinG += entry.proteinG;
      totals.carbsG += entry.carbsG;
      totals.fatG += entry.fatG;
    }

    const exercise = [...exerciseLogs]
      .sort((a, b) => a.loggedAt - b.loggedAt)
      .map(toClientExerciseLog);

    return { date, totals, meals, exercise };
  },
});

export const recentFoods = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const user = await getAuthUserOrNull(ctx);
    if (!user) return [];

    const requestedLimit = Math.max(1, Math.min(limit ?? 10, 25));
    const logs = await ctx.db
      .query('meal_logs')
      .withIndex('by_userId_and_loggedAt', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(100);

    const byFoodId = new Map<Id<'foods'>, ClientMealLog>();
    for (const log of logs) {
      if (!byFoodId.has(log.foodId)) byFoodId.set(log.foodId, toClientMealLog(log));
      if (byFoodId.size >= requestedLimit) break;
    }

    return Array.from(byFoodId.values());
  },
});

export const add = mutation({
  args: {
    date: v.string(),
    mealType: mealTypeValidator,
    foodId: v.id('foods'),
    quantityG: v.number(),
    servingLabel: v.optional(v.string()),
  },
  handler: async (ctx, { date, mealType, foodId, quantityG, servingLabel }) => {
    assertPositiveQuantity(quantityG);
    const user = await ensureAuthUser(ctx);
    const food = await ctx.db.get(foodId);
    if (!food) throw new Error('Food not found');

    const isFirst = await isFirstMealEntryOfDay(ctx, user._id, date, mealType);

    const scale = quantityG / 100;
    const logId = await ctx.db.insert('meal_logs', {
      userId: user._id,
      date,
      mealType,
      loggedAt: Date.now(),
      foodId,
      foodName: food.name,
      ...(food.brand ? { brand: food.brand } : {}),
      quantityG,
      ...(servingLabel ? { servingLabel } : {}),
      calories: Math.round(food.nutrientsPer100g.calories * scale),
      proteinG: round1(food.nutrientsPer100g.proteinG * scale),
      carbsG: round1(food.nutrientsPer100g.carbsG * scale),
      fatG: round1(food.nutrientsPer100g.fatG * scale),
    });

    await recomputeAndPatchDaySnapshot(ctx, user._id, date);
    await recomputeAndPatchStreak(ctx, user._id);
    let gemsAwarded = 0;
    if (isFirst) {
      await awardGems(ctx, user._id, GEMS_PER_LOG);
      gemsAwarded = GEMS_PER_LOG;
    }
    return { logId, gemsAwarded };
  },
});

export const relog = mutation({
  args: {
    sourceMealLogId: v.id('meal_logs'),
    date: v.string(),
    mealType: mealTypeValidator,
  },
  handler: async (ctx, { sourceMealLogId, date, mealType }) => {
    const user = await requireAuth(ctx);
    const source = await ctx.db.get(sourceMealLogId);
    if (!source || source.userId !== user._id) throw new Error('Meal log not found');

    const isFirst = await isFirstMealEntryOfDay(ctx, user._id, date, mealType);

    const logId = await ctx.db.insert('meal_logs', {
      userId: user._id,
      date,
      mealType,
      loggedAt: Date.now(),
      foodId: source.foodId,
      foodName: source.foodName,
      ...(source.brand ? { brand: source.brand } : {}),
      quantityG: source.quantityG,
      ...(source.servingLabel ? { servingLabel: source.servingLabel } : {}),
      calories: source.calories,
      proteinG: source.proteinG,
      carbsG: source.carbsG,
      fatG: source.fatG,
    });

    await recomputeAndPatchDaySnapshot(ctx, user._id, date);
    await recomputeAndPatchStreak(ctx, user._id);
    let gemsAwarded = 0;
    if (isFirst) {
      await awardGems(ctx, user._id, GEMS_PER_LOG);
      gemsAwarded = GEMS_PER_LOG;
    }
    return { logId, gemsAwarded };
  },
});

export const copyDay = mutation({
  args: {
    fromDate: v.string(),
    toDate: v.string(),
  },
  handler: async (ctx, { fromDate, toDate }) => {
    if (fromDate === toDate) throw new Error('Choose a different source day');

    const user = await requireAuth(ctx);
    const logs = await ctx.db
      .query('meal_logs')
      .withIndex('by_userId_and_date', (q) =>
        q.eq('userId', user._id).eq('date', fromDate),
      )
      .take(200);

    const now = Date.now();
    let copied = 0;
    for (const log of logs) {
      await ctx.db.insert('meal_logs', {
        userId: user._id,
        date: toDate,
        mealType: log.mealType,
        loggedAt: now + copied,
        foodId: log.foodId,
        foodName: log.foodName,
        ...(log.brand ? { brand: log.brand } : {}),
        quantityG: log.quantityG,
        ...(log.servingLabel ? { servingLabel: log.servingLabel } : {}),
        calories: log.calories,
        proteinG: log.proteinG,
        carbsG: log.carbsG,
        fatG: log.fatG,
      });
      copied++;
    }

    await recomputeAndPatchDaySnapshot(ctx, user._id, toDate);
    await recomputeAndPatchStreak(ctx, user._id);
    return { copied };
  },
});

export const move = mutation({
  args: {
    mealLogId: v.id('meal_logs'),
    mealType: mealTypeValidator,
  },
  handler: async (ctx, { mealLogId, mealType }) => {
    const user = await requireAuth(ctx);
    const log = await ctx.db.get(mealLogId);
    if (!log || log.userId !== user._id) throw new Error('Meal log not found');
    await ctx.db.patch(mealLogId, { mealType });
    return mealLogId;
  },
});

export const remove = mutation({
  args: { mealLogId: v.id('meal_logs') },
  handler: async (ctx, { mealLogId }) => {
    const user = await requireAuth(ctx);
    const log = await ctx.db.get(mealLogId);
    if (!log || log.userId !== user._id) throw new Error('Meal log not found');
    await ctx.db.delete(mealLogId);
    await recomputeAndPatchDaySnapshot(ctx, user._id, log.date);
    await recomputeAndPatchStreak(ctx, user._id);
    return mealLogId;
  },
});

export const update = mutation({
  args: {
    mealLogId: v.id('meal_logs'),
    quantityG: v.number(),
    servingLabel: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, { mealLogId, quantityG, servingLabel }) => {
    assertPositiveQuantity(quantityG);
    const user = await requireAuth(ctx);
    const log = await ctx.db.get(mealLogId);
    if (!log || log.userId !== user._id) throw new Error('Meal log not found');
    const food = await ctx.db.get(log.foodId);
    if (!food) throw new Error('Food not found');

    const scale = quantityG / 100;
    const patch: Partial<Doc<'meal_logs'>> = {
      quantityG,
      calories: Math.round(food.nutrientsPer100g.calories * scale),
      proteinG: round1(food.nutrientsPer100g.proteinG * scale),
      carbsG: round1(food.nutrientsPer100g.carbsG * scale),
      fatG: round1(food.nutrientsPer100g.fatG * scale),
    };
    if (servingLabel === null) patch.servingLabel = undefined;
    else if (typeof servingLabel === 'string') patch.servingLabel = servingLabel;

    await ctx.db.patch(mealLogId, patch);
    await recomputeAndPatchDaySnapshot(ctx, user._id, log.date);
    return mealLogId;
  },
});
