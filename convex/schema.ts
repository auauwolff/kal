import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import {
  bodyStatsValidator,
  exerciseIntensityValidator,
  exerciseTypeValidator,
  mealTypeValidator,
  userTargetsValidator,
  weightGoalValidator,
} from './validators';

export default defineSchema({
  users: defineTable({
    authId: v.string(),
    username: v.string(),
    displayName: v.string(),
    email: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),

    bodyStats: v.union(bodyStatsValidator, v.null()),
    goal: v.union(weightGoalValidator, v.null()),
    targets: userTargetsValidator,

    targetWeightKg: v.union(v.number(), v.null()),
    dailyCalorieTarget: v.number(),
    dailyProteinG: v.number(),
    dailyCarbsG: v.number(),
    dailyFatG: v.number(),

    todayDate: v.string(),
    todayCalories: v.number(),
    todayProteinG: v.number(),
    todayCarbsG: v.number(),
    todayFatG: v.number(),

    currentStreak: v.number(),
    longestStreak: v.number(),
    graceDaysRemaining: v.number(),
    gemBalance: v.number(),
  })
    .index('by_authId', ['authId'])
    .index('by_username', ['username']),

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
    .index('by_source_and_sourceId', ['source', 'sourceId'])
    .searchIndex('search_text', { searchField: 'searchText' }),

  meal_logs: defineTable({
    userId: v.id('users'),
    date: v.string(),
    mealType: mealTypeValidator,
    loggedAt: v.number(),
    foodId: v.id('foods'),
    foodName: v.string(),
    brand: v.optional(v.string()),
    quantityG: v.number(),
    servingLabel: v.optional(v.string()),
    calories: v.number(),
    proteinG: v.number(),
    carbsG: v.number(),
    fatG: v.number(),
  })
    .index('by_userId_and_date', ['userId', 'date'])
    .index('by_userId_and_loggedAt', ['userId', 'loggedAt']),

  exercise_logs: defineTable({
    userId: v.id('users'),
    date: v.string(),
    type: exerciseTypeValidator,
    durationMin: v.number(),
    intensity: exerciseIntensityValidator,
    notes: v.optional(v.string()),
    loggedAt: v.number(),
  })
    .index('by_userId_and_date', ['userId', 'date'])
    .index('by_userId_and_loggedAt', ['userId', 'loggedAt']),

  weights: defineTable({
    userId: v.id('users'),
    date: v.string(),
    weightKg: v.number(),
    loggedAt: v.number(),
  })
    .index('by_userId_and_date', ['userId', 'date'])
    .index('by_userId_and_loggedAt', ['userId', 'loggedAt']),

  favorites: defineTable({
    userId: v.id('users'),
    foodId: v.id('foods'),
    starredAt: v.number(),
  })
    .index('by_userId_and_foodId', ['userId', 'foodId'])
    .index('by_userId_and_starredAt', ['userId', 'starredAt']),

  meal_templates: defineTable({
    userId: v.id('users'),
    name: v.string(),
    items: v.array(
      v.object({
        foodId: v.id('foods'),
        quantityG: v.number(),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_userId', ['userId']),
});
