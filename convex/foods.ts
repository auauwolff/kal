import { v } from 'convex/values';
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from './_generated/server';
import { internal } from './_generated/api';
import { AU_FOODS_SEED, type FoodSeedItem } from './foodsSeed';

const foodSourceValidator = v.union(
  v.literal('ausnut'),
  v.literal('afcd'),
  v.literal('branded_au'),
  v.literal('usda'),
  v.literal('chain'),
  v.literal('user_contributed'),
  v.literal('openfoodfacts_cache'),
);

const nutrientsValidator = v.object({
  calories: v.number(),
  proteinG: v.number(),
  carbsG: v.number(),
  fatG: v.number(),
  fiberG: v.optional(v.number()),
  sugarG: v.optional(v.number()),
  sodiumMg: v.optional(v.number()),
});

const portionsValidator = v.array(
  v.object({ label: v.string(), grams: v.number() }),
);

const ingestItemValidator = v.object({
  source: foodSourceValidator,
  sourceId: v.string(),
  name: v.string(),
  brand: v.optional(v.string()),
  barcode: v.optional(v.string()),
  defaultServingG: v.number(),
  nutrientsPer100g: nutrientsValidator,
  commonPortions: portionsValidator,
});

type IngestItem = {
  source:
    | 'ausnut'
    | 'afcd'
    | 'branded_au'
    | 'usda'
    | 'chain'
    | 'user_contributed'
    | 'openfoodfacts_cache';
  sourceId: string;
  name: string;
  brand?: string;
  barcode?: string;
  defaultServingG: number;
  nutrientsPer100g: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG?: number;
    sugarG?: number;
    sodiumMg?: number;
  };
  commonPortions: { label: string; grams: number }[];
};

export const searchFoods = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query, limit }) => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];
    return await ctx.db
      .query('foods')
      .withSearchIndex('search_text', (qb) => qb.search('searchText', q))
      .take(limit ?? 25);
  },
});

const buildSearchText = (f: FoodSeedItem): string =>
  [f.name, f.brand ?? '', ...(f.aliases ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const buildIngestSearchText = (item: IngestItem): string =>
  [item.name, item.brand ?? ''].filter(Boolean).join(' ').toLowerCase().trim();

const ingestBatchHandler = async (
  ctx: MutationCtx,
  items: IngestItem[],
): Promise<{ inserted: number; updated: number }> => {
  let inserted = 0;
  let updated = 0;
  for (const item of items) {
    const existing = await ctx.db
      .query('foods')
      .withIndex('by_source_and_sourceId', (q) =>
        q.eq('source', item.source).eq('sourceId', item.sourceId),
      )
      .unique();
    const searchText = buildIngestSearchText(item);
    if (existing) {
      await ctx.db.patch(existing._id, { ...item, searchText });
      updated++;
    } else {
      await ctx.db.insert('foods', { ...item, searchText });
      inserted++;
    }
  }
  return { inserted, updated };
};

// Hand-curated seed for chain restaurants and AU-specific brands. Whole-food
// nutrition comes from the AUSNUT/AFCD ETL (`scripts/seedFoods.ts`). The clear
// loop below only deletes `chain` and `branded_au` rows so a `seed --force`
// run never wipes the ~7K ETL'd rows.
export const seed = internalMutation({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, { force }) => {
    const existing = await ctx.db.query('foods').take(1);
    if (existing.length > 0 && !force) {
      return { inserted: 0, cleared: 0, skipped: true as const };
    }
    let cleared = 0;
    if (existing.length > 0) {
      for await (const row of ctx.db.query('foods')) {
        if (row.source !== 'chain' && row.source !== 'branded_au') continue;
        await ctx.db.delete(row._id);
        cleared++;
      }
    }
    for (const f of AU_FOODS_SEED) {
      const { aliases: _aliases, ...rest } = f;
      await ctx.db.insert('foods', { ...rest, searchText: buildSearchText(f) });
    }
    return {
      inserted: AU_FOODS_SEED.length,
      cleared,
      skipped: false as const,
    };
  },
});

export const ingestBatch = internalMutation({
  args: { items: v.array(ingestItemValidator) },
  handler: async (ctx, { items }) => ingestBatchHandler(ctx, items),
});

export const clearSourceData = internalMutation({
  args: { cursor: v.optional(v.union(v.string(), v.null())) },
  handler: async (ctx, { cursor }) => {
    const result = await ctx.db
      .query('foods')
      .paginate({ numItems: 500, cursor: cursor ?? null });
    let deleted = 0;
    for (const row of result.page) {
      if (row.source === 'ausnut' || row.source === 'afcd') {
        await ctx.db.delete(row._id);
        deleted++;
      }
    }
    if (!result.isDone) {
      await ctx.scheduler.runAfter(0, internal.foods.clearSourceData, {
        cursor: result.continueCursor,
      });
    }
    return { deleted, isDone: result.isDone };
  },
});

const requireAdmin = (secret: string) => {
  const expected = process.env.FOODS_ADMIN_SECRET;
  if (!expected || secret !== expected) {
    throw new Error('Unauthorized');
  }
};

export const adminIngest = mutation({
  args: { secret: v.string(), items: v.array(ingestItemValidator) },
  handler: async (ctx, { secret, items }) => {
    requireAdmin(secret);
    return ingestBatchHandler(ctx, items);
  },
});

export const adminClearSourceData = mutation({
  args: { secret: v.string() },
  handler: async (ctx, { secret }) => {
    requireAdmin(secret);
    await ctx.scheduler.runAfter(0, internal.foods.clearSourceData, {});
    return { scheduled: true as const };
  },
});

export const countBySource = query({
  args: { secret: v.string() },
  handler: async (ctx, { secret }) => {
    requireAdmin(secret);
    const rows = await ctx.db.query('foods').take(20000);
    const counts: Record<string, number> = {
      ausnut: 0,
      afcd: 0,
      branded_au: 0,
      usda: 0,
      chain: 0,
      user_contributed: 0,
      openfoodfacts_cache: 0,
    };
    for (const r of rows) counts[r.source] = (counts[r.source] ?? 0) + 1;
    return { total: rows.length, bySource: counts };
  },
});
