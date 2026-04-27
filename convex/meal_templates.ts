import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Doc, Id } from './_generated/dataModel';
import { getAuthUserOrNull, requireAuth } from './lib/auth';
import { awardGems, GEMS_PER_MEAL_LOG, isFirstMealEntryOfDay } from './lib/rewards';
import { recomputeAndPatchStreak } from './lib/streaks';
import { recomputeAndPatchDaySnapshot } from './lib/dayTotals';
import { mealTypeValidator } from './validators';

const round1 = (value: number) => Math.round(value * 10) / 10;

const MAX_TEMPLATES_PER_USER = 50;
const MAX_ITEMS_PER_TEMPLATE = 30;
const NAME_MIN = 1;
const NAME_MAX = 60;

const itemValidator = v.object({
  foodId: v.id('foods'),
  quantityG: v.number(),
  servingLabel: v.optional(v.string()),
});

const cleanName = (raw: string): string => {
  const trimmed = raw.trim();
  if (trimmed.length < NAME_MIN) throw new Error('Meal name is required');
  if (trimmed.length > NAME_MAX) throw new Error(`Meal name must be ≤ ${NAME_MAX} characters`);
  return trimmed;
};

const validateItems = (items: { foodId: Id<'foods'>; quantityG: number }[]) => {
  if (items.length === 0) throw new Error('A meal needs at least 1 ingredient');
  if (items.length > MAX_ITEMS_PER_TEMPLATE) {
    throw new Error(`A meal can have at most ${MAX_ITEMS_PER_TEMPLATE} ingredients`);
  }
  for (const item of items) {
    if (!Number.isFinite(item.quantityG) || item.quantityG <= 0) {
      throw new Error('Every ingredient needs a quantity > 0g');
    }
  }
};

interface ClientItem {
  foodId: Id<'foods'>;
  foodName: string;
  brand?: string;
  quantityG: number;
  servingLabel?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  missing?: boolean;
}

interface ClientTemplate {
  id: Id<'meal_templates'>;
  name: string;
  items: ClientItem[];
  totals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
  createdAt: number;
  updatedAt: number;
}

export const list = query({
  args: {},
  handler: async (ctx): Promise<ClientTemplate[]> => {
    const user = await getAuthUserOrNull(ctx);
    if (!user) return [];

    const templates = await ctx.db
      .query('meal_templates')
      .withIndex('by_userId_and_updatedAt', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(MAX_TEMPLATES_PER_USER);

    const foodIds = new Set<Id<'foods'>>();
    for (const template of templates) {
      for (const item of template.items) foodIds.add(item.foodId);
    }
    const foods = await Promise.all(Array.from(foodIds).map((id) => ctx.db.get(id)));
    const foodById = new Map<Id<'foods'>, Doc<'foods'>>();
    for (const food of foods) {
      if (food) foodById.set(food._id, food);
    }

    return templates.map((template) => {
      const items: ClientItem[] = template.items.map((item) => {
        const food = foodById.get(item.foodId);
        if (!food) {
          return {
            foodId: item.foodId,
            foodName: 'Removed food',
            quantityG: item.quantityG,
            ...(item.servingLabel ? { servingLabel: item.servingLabel } : {}),
            calories: 0,
            proteinG: 0,
            carbsG: 0,
            fatG: 0,
            missing: true,
          };
        }
        const scale = item.quantityG / 100;
        return {
          foodId: item.foodId,
          foodName: food.name,
          ...(food.brand ? { brand: food.brand } : {}),
          quantityG: item.quantityG,
          ...(item.servingLabel ? { servingLabel: item.servingLabel } : {}),
          calories: Math.round(food.nutrientsPer100g.calories * scale),
          proteinG: round1(food.nutrientsPer100g.proteinG * scale),
          carbsG: round1(food.nutrientsPer100g.carbsG * scale),
          fatG: round1(food.nutrientsPer100g.fatG * scale),
        };
      });

      const totals = items.reduce(
        (acc, item) => ({
          calories: acc.calories + item.calories,
          proteinG: round1(acc.proteinG + item.proteinG),
          carbsG: round1(acc.carbsG + item.carbsG),
          fatG: round1(acc.fatG + item.fatG),
        }),
        { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
      );

      return {
        id: template._id,
        name: template.name,
        items,
        totals,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      };
    });
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    items: v.array(itemValidator),
  },
  handler: async (ctx, { name, items }) => {
    const user = await requireAuth(ctx);
    const trimmed = cleanName(name);
    validateItems(items);

    const now = Date.now();
    return await ctx.db.insert('meal_templates', {
      userId: user._id,
      name: trimmed,
      items: items.map((item) => ({
        foodId: item.foodId,
        quantityG: item.quantityG,
        ...(item.servingLabel ? { servingLabel: item.servingLabel } : {}),
      })),
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id('meal_templates'),
    name: v.optional(v.string()),
    items: v.optional(v.array(itemValidator)),
  },
  handler: async (ctx, { id, name, items }) => {
    const user = await requireAuth(ctx);
    const template = await ctx.db.get(id);
    if (!template || template.userId !== user._id) throw new Error('Meal not found');

    const patch: Partial<Doc<'meal_templates'>> = { updatedAt: Date.now() };
    if (name !== undefined) patch.name = cleanName(name);
    if (items !== undefined) {
      validateItems(items);
      patch.items = items.map((item) => ({
        foodId: item.foodId,
        quantityG: item.quantityG,
        ...(item.servingLabel ? { servingLabel: item.servingLabel } : {}),
      }));
    }

    await ctx.db.patch(id, patch);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id('meal_templates') },
  handler: async (ctx, { id }) => {
    const user = await requireAuth(ctx);
    const template = await ctx.db.get(id);
    if (!template || template.userId !== user._id) throw new Error('Meal not found');
    await ctx.db.delete(id);
    return id;
  },
});

export const createFromSection = mutation({
  args: {
    name: v.string(),
    date: v.string(),
    mealType: mealTypeValidator,
  },
  handler: async (ctx, { name, date, mealType }) => {
    const user = await requireAuth(ctx);
    const trimmed = cleanName(name);

    const logs = await ctx.db
      .query('meal_logs')
      .withIndex('by_userId_and_date', (q) =>
        q.eq('userId', user._id).eq('date', date),
      )
      .take(200);

    const sectionLogs = logs
      .filter((log) => log.mealType === mealType)
      .sort((a, b) => a.loggedAt - b.loggedAt);

    if (sectionLogs.length === 0) {
      throw new Error('Add some food to this section before saving it as a meal');
    }

    const items = sectionLogs.map((log) => ({
      foodId: log.foodId,
      quantityG: log.quantityG,
      ...(log.servingLabel ? { servingLabel: log.servingLabel } : {}),
    }));
    validateItems(items);

    const now = Date.now();
    return await ctx.db.insert('meal_templates', {
      userId: user._id,
      name: trimmed,
      items,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const log = mutation({
  args: {
    id: v.id('meal_templates'),
    date: v.string(),
    mealType: mealTypeValidator,
  },
  handler: async (ctx, { id, date, mealType }) => {
    const user = await requireAuth(ctx);
    const template = await ctx.db.get(id);
    if (!template || template.userId !== user._id) throw new Error('Meal not found');

    const isFirst = await isFirstMealEntryOfDay(ctx, user._id, date, mealType);

    let loggedCount = 0;
    let missingCount = 0;
    const baseTime = Date.now();

    for (let i = 0; i < template.items.length; i++) {
      const item = template.items[i];
      if (!item) continue;
      const food = await ctx.db.get(item.foodId);
      if (!food) {
        missingCount++;
        continue;
      }

      const scale = item.quantityG / 100;
      await ctx.db.insert('meal_logs', {
        userId: user._id,
        date,
        mealType,
        loggedAt: baseTime + i,
        foodId: item.foodId,
        foodName: food.name,
        ...(food.brand ? { brand: food.brand } : {}),
        quantityG: item.quantityG,
        ...(item.servingLabel ? { servingLabel: item.servingLabel } : {}),
        calories: Math.round(food.nutrientsPer100g.calories * scale),
        proteinG: round1(food.nutrientsPer100g.proteinG * scale),
        carbsG: round1(food.nutrientsPer100g.carbsG * scale),
        fatG: round1(food.nutrientsPer100g.fatG * scale),
      });
      loggedCount++;
    }

    if (loggedCount === 0) {
      throw new Error('All ingredients in this meal have been removed');
    }

    await ctx.db.patch(id, { updatedAt: Date.now() });
    await recomputeAndPatchDaySnapshot(ctx, user._id, date);
    await recomputeAndPatchStreak(ctx, user._id);
    let gemsAwarded = 0;
    if (isFirst) {
      await awardGems(ctx, user._id, GEMS_PER_MEAL_LOG);
      gemsAwarded = GEMS_PER_MEAL_LOG;
    }

    return { loggedCount, missingCount, gemsAwarded };
  },
});
