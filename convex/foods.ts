import { v } from 'convex/values';
import { internalMutation, query } from './_generated/server';
import { AU_FOODS_SEED, type FoodSeedItem } from './foodsSeed';

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

export const seed = internalMutation({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, { force }) => {
    const existing = await ctx.db.query('foods').take(1);
    if (existing.length > 0) {
      if (!force) {
        return { inserted: 0, cleared: 0, skipped: true as const };
      }
      // Clear in batches to respect transaction limits (59 rows is fine).
      let cleared = 0;
      for await (const row of ctx.db.query('foods')) {
        await ctx.db.delete(row._id);
        cleared++;
      }
      for (const f of AU_FOODS_SEED) {
        const { aliases: _aliases, ...rest } = f;
        await ctx.db.insert('foods', { ...rest, searchText: buildSearchText(f) });
      }
      return { inserted: AU_FOODS_SEED.length, cleared, skipped: false as const };
    }
    for (const f of AU_FOODS_SEED) {
      const { aliases: _aliases, ...rest } = f;
      await ctx.db.insert('foods', { ...rest, searchText: buildSearchText(f) });
    }
    return { inserted: AU_FOODS_SEED.length, cleared: 0, skipped: false as const };
  },
});
