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
    gemBalanceBackfilledAt: v.optional(v.number()),

    lastLoggedDate: v.optional(v.string()),
  })
    .index('by_authId', ['authId'])
    .index('by_username', ['username']),

  friendships: defineTable({
    userA: v.id('users'),
    userB: v.id('users'),
    status: v.union(
      v.literal('pending'),
      v.literal('accepted'),
      v.literal('blocked'),
    ),
    initiatedBy: v.id('users'),
    acceptedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_userA_status', ['userA', 'status'])
    .index('by_userB_status', ['userB', 'status'])
    .index('by_pair', ['userA', 'userB']),

  friend_streaks: defineTable({
    userA: v.id('users'),
    userB: v.id('users'),
    currentDays: v.number(),
    longestDays: v.number(),
    lastBothLoggedDate: v.optional(v.string()),
  })
    .index('by_pair', ['userA', 'userB'])
    .index('by_userA', ['userA'])
    .index('by_userB', ['userB']),

  cheers: defineTable({
    fromUser: v.id('users'),
    toUser: v.id('users'),
    date: v.string(),
    createdAt: v.number(),
  })
    .index('by_toUser_date', ['toUser', 'date'])
    .index('by_fromUser_toUser_date', ['fromUser', 'toUser', 'date']),

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
    isPrimary: v.optional(v.boolean()),
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
        servingLabel: v.optional(v.string()),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_userId_and_updatedAt', ['userId', 'updatedAt']),
});
