import { v } from 'convex/values';

export const mealTypeValidator = v.union(
  v.literal('breakfast'),
  v.literal('lunch'),
  v.literal('dinner'),
  v.literal('snack'),
);

export const exerciseTypeValidator = v.union(
  v.literal('strength'),
  v.literal('cardio'),
  v.literal('sports'),
  v.literal('walk'),
  v.literal('other'),
);

export const exerciseIntensityValidator = v.union(
  v.literal('light'),
  v.literal('moderate'),
  v.literal('hard'),
);

export const activityLevelValidator = v.union(
  v.literal('sedentary'),
  v.literal('light'),
  v.literal('moderate'),
  v.literal('active'),
  v.literal('very_active'),
);

export const sexValidator = v.union(v.literal('male'), v.literal('female'));

export const goalTypeValidator = v.union(
  v.literal('lose'),
  v.literal('maintain'),
  v.literal('gain'),
  v.literal('recomp'),
);

export const bodyStatsValidator = v.object({
  heightCm: v.number(),
  weightKg: v.number(),
  age: v.number(),
  sex: sexValidator,
  activity: activityLevelValidator,
});

export const weightGoalValidator = v.object({
  type: goalTypeValidator,
  targetWeightKg: v.number(),
  targetDateISO: v.string(),
});

export const overridableTargetValidator = v.object({
  value: v.number(),
  isOverride: v.boolean(),
});

export const userTargetsValidator = v.object({
  calories: overridableTargetValidator,
  proteinG: overridableTargetValidator,
  carbsG: overridableTargetValidator,
  fatG: overridableTargetValidator,
});
