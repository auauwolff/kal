import { v } from 'convex/values';
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from './_generated/server';
import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';

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

const normalizeSearch = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const hasAny = (value: string, terms: string[]) =>
  terms.some((term) => value.includes(term));

const isEggQuery = (value: string) => /\beggs?\b/.test(value);

const sourcePriority: Record<IngestItem['source'], number> = {
  afcd: 40,
  ausnut: 35,
  branded_au: 18,
  chain: 16,
  user_contributed: 8,
  usda: 4,
  openfoodfacts_cache: 0,
};

const scoreFoodMatch = (
  food: {
    source: IngestItem['source'];
    name: string;
    brand?: string;
    searchText: string;
  },
  normalizedQuery: string,
): number => {
  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);
  const name = normalizeSearch(food.name);
  const brand = normalizeSearch(food.brand ?? '');
  const searchText = normalizeSearch(food.searchText);
  const searchable = `${name} ${brand} ${searchText}`;

  let score = sourcePriority[food.source] ?? 0;

  if (name === normalizedQuery) score += 1000;
  else if (brand && `${brand} ${name}` === normalizedQuery) score += 950;
  else if (name.startsWith(normalizedQuery)) score += 700;
  else if (brand && brand.startsWith(normalizedQuery)) score += 500;
  else if (searchText.startsWith(normalizedQuery)) score += 450;
  else if (name.includes(normalizedQuery)) score += 300;
  else if (brand && brand.includes(normalizedQuery)) score += 220;
  else if (searchText.includes(normalizedQuery)) score += 150;

  const singularQuery = normalizedQuery
    .replace(/\beggs\b/g, 'egg')
    .replace(/\bcrumpets\b/g, 'crumpet');
  if (singularQuery !== normalizedQuery) {
    if (name === singularQuery) score += 1000;
    else if (name.startsWith(singularQuery)) score += 650;
    else if (searchText.startsWith(singularQuery)) score += 450;
    else if (name.includes(singularQuery)) score += 260;
  }

  for (const term of queryTerms) {
    if (name === term) score += 100;
    else if (name.startsWith(term)) score += 50;
    else if (name.includes(term)) score += 24;

    if (brand === term) score += 70;
    else if (brand.startsWith(term)) score += 40;
    else if (brand.includes(term)) score += 18;

    if (searchText.includes(term)) score += 8;
  }

  if (queryTerms.length > 1 && queryTerms.every((term) => name.includes(term))) {
    score += 160;
  }
  if (
    queryTerms.length > 1 &&
    brand &&
    queryTerms.every((term) => `${brand} ${name}`.includes(term))
  ) {
    score += 90;
  }

  if (normalizedQuery.includes('coffee')) {
    if (
      hasAny(searchable, [
        'black',
        'espresso',
        'long black',
        'flat white',
        'latte',
        'cappuccino',
        'prepared',
      ])
    ) {
      score += 220;
    }
    if (hasAny(searchable, ['dry powder', 'granules'])) score -= 260;
  }

  if (normalizedQuery.includes('protein')) {
    if (
      hasAny(normalizedQuery, ['powder', 'whey']) &&
      hasAny(searchable, ['protein powder', 'whey'])
    ) {
      score += 300;
    }
    if (
      hasAny(normalizedQuery, ['shake', 'drink', 'beverage']) &&
      hasAny(searchable, ['prepared with water', 'ready to drink', 'drink', 'beverage'])
    ) {
      score += 300;
    }
  }

  if (
    normalizedQuery.includes('croissant') &&
    normalizedQuery.includes('ham') &&
    normalizedQuery.includes('cheese') &&
    hasAny(searchable, ['ham cheese', 'ham and cheese'])
  ) {
    score += 300;
  }

  if (isEggQuery(normalizedQuery)) {
    if (hasAny(searchable, ['egg chicken whole', 'egg whole', 'boiled egg', 'poached egg'])) {
      score += 280;
    }
    if (normalizedQuery.includes('boiled') && hasAny(searchable, ['hard boiled', 'hard-boiled'])) {
      score += 260;
    }
    if (normalizedQuery.includes('white') && hasAny(searchable, ['albumen', 'egg white'])) {
      score += 260;
    }
    if (normalizedQuery.includes('yolk') && searchable.includes('yolk')) {
      score += 260;
    }
    if ((normalizedQuery === 'egg' || normalizedQuery === 'eggs') && searchable.includes('benedict')) {
      score -= 900;
    }
  }

  if (normalizedQuery.includes('crumpet') && searchable.includes('crumpet')) {
    score += 300;
  }

  if (normalizedQuery.includes('sourdough') && searchable.includes('sourdough')) {
    score += 400;
  }

  if (normalizedQuery.includes('cheese')) {
    if (hasAny(normalizedQuery, ['shredded', 'grated']) && hasAny(searchable, ['shredded', 'grated'])) {
      score += 320;
    }
    if (normalizedQuery.includes('cheddar') && searchable.includes('cheddar')) {
      score += 220;
    }
  }

  return score;
};

const searchQueriesFor = (normalizedQuery: string): string[] => {
  const queries = [normalizedQuery];
  const addQuery = (query: string) => {
    if (query.trim()) queries.push(query);
  };

  if (isEggQuery(normalizedQuery)) {
    addQuery(normalizedQuery.replace(/\beggs\b/g, 'egg'));
    addQuery('egg chicken whole');
    if (normalizedQuery.includes('boiled')) addQuery('egg chicken whole hard boiled');
    if (normalizedQuery.includes('poached')) addQuery('egg chicken whole poached');
    if (normalizedQuery.includes('white')) addQuery('egg chicken white albumen');
    if (normalizedQuery.includes('yolk')) addQuery('egg chicken yolk');
  }

  if (normalizedQuery.includes('crumpets')) addQuery(normalizedQuery.replace(/\bcrumpets\b/g, 'crumpet'));
  if (normalizedQuery.includes('sourdough')) {
    addQuery('sourdough bread');
    addQuery('bread organic');
    addQuery('bread spelt');
  }

  if (normalizedQuery.includes('protein shake')) {
    addQuery('protein drink');
    addQuery('protein beverage');
    addQuery('protein prepared water');
  }
  if (normalizedQuery.includes('protein powder')) {
    addQuery('whey protein powder');
    addQuery('protein supplement powder');
  }
  if (normalizedQuery.includes('coffee')) {
    addQuery('coffee black');
    addQuery('coffee espresso');
    addQuery('coffee latte');
    addQuery('flat white');
  }
  if (
    normalizedQuery.includes('croissant') &&
    normalizedQuery.includes('ham') &&
    normalizedQuery.includes('cheese')
  ) {
    addQuery('croissant ham cheese');
    addQuery('croissant cheese');
  }
  if (normalizedQuery.includes('cheese')) {
    if (hasAny(normalizedQuery, ['shredded', 'grated'])) {
      addQuery('shredded cheese');
      addQuery('grated cheese');
      addQuery('cheddar cheese');
      addQuery('mozzarella cheese');
    }
    if (normalizedQuery.includes('slice')) addQuery('cheddar cheese slice');
  }

  return Array.from(new Set(queries));
};

export const searchFoods = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { query, limit }) => {
    const normalizedQuery = normalizeSearch(query);
    if (normalizedQuery.length === 0) return [];

    const requestedLimit = Math.max(1, Math.min(limit ?? 25, 50));
    const perQueryLimit = Math.min(requestedLimit * 3, 60);
    const candidateBatches = await Promise.all(
      searchQueriesFor(normalizedQuery).map((searchQuery) =>
        ctx.db
          .query('foods')
          .withSearchIndex('search_text', (qb) => qb.search('searchText', searchQuery))
          .take(perQueryLimit),
      ),
    );

    const candidatesById = new Map<Id<'foods'>, Doc<'foods'>>();
    for (const batch of candidateBatches) {
      for (const food of batch) candidatesById.set(food._id, food);
    }

    return Array.from(candidatesById.values())
      .map((food) => ({
        food,
        score: scoreFoodMatch(food, normalizedQuery),
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.food.name.localeCompare(b.food.name);
      })
      .slice(0, requestedLimit)
      .map(({ food }) => food);
  },
});

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
