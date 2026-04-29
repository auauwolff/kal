import type { Doc } from '../../convex/_generated/dataModel';
import { todayISO } from '@/lib/date';
import { calorieTargetForGoal, macroTargets } from '@/lib/nutrition';
import type { UserProfile, UserTargets } from '@/lib/userTypes';

export const DEFAULT_TARGETS: UserTargets = {
  calories: { value: 2600, isOverride: false },
  proteinG: { value: 165, isOverride: false },
  carbsG: { value: 260, isOverride: false },
  fatG: { value: 85, isOverride: false },
};

export const profileFromUser = (
  user: Doc<'users'> | null | undefined,
): UserProfile => ({
  bodyStats: user?.bodyStats ?? null,
  goal: user?.goal ?? null,
  targets: user?.targets ?? DEFAULT_TARGETS,
});

interface AutoTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

const computeAutoTargets = (profile: UserProfile): AutoTargets | null => {
  const { bodyStats, goal } = profile;
  if (!bodyStats || !goal) return null;

  const targetWeightKg =
    goal.type === 'maintain' ? bodyStats.weightKg : goal.targetWeightKg;
  const { calories } = calorieTargetForGoal({
    ...bodyStats,
    targetWeightKg,
    targetDateISO: goal.targetDateISO,
    todayISO: todayISO(),
  });
  if (!Number.isFinite(calories)) return null;
  const macros = macroTargets({
    weightKg: bodyStats.weightKg,
    calorieTarget: calories,
    goal: goal.type,
  });
  // macroTargets may lift calories above the input when protein + min-fat +
  // min-carbs already exceed it; honour that lifted value as the calorie target
  // so the energy gauge matches the macro sum.
  return {
    calories: macros.effectiveCalories,
    proteinG: macros.proteinG,
    carbsG: macros.carbsG,
    fatG: macros.fatG,
  };
};

export const recalcProfileTargets = (profile: UserProfile): UserProfile => {
  const auto = computeAutoTargets(profile);
  if (!auto) return profile;

  const { targets } = profile;
  const next = (key: keyof UserTargets, autoValue: number) =>
    targets[key].isOverride
      ? targets[key]
      : { value: autoValue, isOverride: false };

  return {
    ...profile,
    targets: {
      calories: next('calories', auto.calories),
      proteinG: next('proteinG', auto.proteinG),
      carbsG: next('carbsG', auto.carbsG),
      fatG: next('fatG', auto.fatG),
    },
  };
};

export const autoTargetsForProfile = (profile: UserProfile) =>
  computeAutoTargets(profile);

export const dailyTargetsFromProfile = (profile: UserProfile) => ({
  calories: profile.targets.calories.value,
  proteinG: profile.targets.proteinG.value,
  carbsG: profile.targets.carbsG.value,
  fatG: profile.targets.fatG.value,
});
