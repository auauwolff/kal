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

export const recalcProfileTargets = (profile: UserProfile): UserProfile => {
  const { bodyStats, goal, targets } = profile;
  if (!bodyStats || !goal) return profile;

  const targetWeightKg =
    goal.type === 'maintain' ? bodyStats.weightKg : goal.targetWeightKg;
  const { calories } = calorieTargetForGoal({
    ...bodyStats,
    targetWeightKg,
    targetDateISO: goal.targetDateISO,
    todayISO: todayISO(),
  });
  const macros = macroTargets({
    weightKg: bodyStats.weightKg,
    calorieTarget: calories,
    goal: goal.type,
  });

  const next = (key: keyof UserTargets, autoValue: number) =>
    targets[key].isOverride
      ? targets[key]
      : { value: autoValue, isOverride: false };

  return {
    ...profile,
    targets: {
      calories: next('calories', calories),
      proteinG: next('proteinG', macros.proteinG),
      carbsG: next('carbsG', macros.carbsG),
      fatG: next('fatG', macros.fatG),
    },
  };
};

export const autoTargetsForProfile = (profile: UserProfile) => {
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
  const macros = macroTargets({
    weightKg: bodyStats.weightKg,
    calorieTarget: calories,
    goal: goal.type,
  });

  return {
    calories,
    proteinG: macros.proteinG,
    carbsG: macros.carbsG,
    fatG: macros.fatG,
  };
};

export const dailyTargetsFromProfile = (profile: UserProfile) => ({
  calories: profile.targets.calories.value,
  proteinG: profile.targets.proteinG.value,
  carbsG: profile.targets.carbsG.value,
  fatG: profile.targets.fatG.value,
});
