import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  foods: defineTable({
    source: v.union(
      v.literal('ausnut'),
      v.literal('afcd'),
      v.literal('branded_au'),
      v.literal('usda'),
      v.literal('chain'),
      v.literal('user_contributed'),
      v.literal('openfoodfacts_cache'),
    ),
    sourceId: v.string(),
    name: v.string(),
    brand: v.optional(v.string()),
    barcode: v.optional(v.string()),
    defaultServingG: v.number(),
    nutrientsPer100g: v.object({
      calories: v.number(),
      proteinG: v.number(),
      carbsG: v.number(),
      fatG: v.number(),
      fiberG: v.optional(v.number()),
      sugarG: v.optional(v.number()),
      sodiumMg: v.optional(v.number()),
    }),
    commonPortions: v.array(
      v.object({
        label: v.string(),
        grams: v.number(),
      }),
    ),
    searchText: v.string(),
  })
    .index('by_barcode', ['barcode'])
    .searchIndex('search_text', { searchField: 'searchText' }),
});
