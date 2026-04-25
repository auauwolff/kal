import type { ActivityLevel, GoalType, Sex } from '@/lib/nutrition';
import type { BodyStats, UserTargets, WeightGoal } from '@/lib/userTypes';

export const ACTIVITY_ORDER: ActivityLevel[] = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
];

export const GOAL_OPTIONS: { value: GoalType; label: string }[] = [
  { value: 'lose', label: 'Lose' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'gain', label: 'Gain' },
  { value: 'recomp', label: 'Recomp' },
];

export interface DailyTargetFieldDef {
  key: keyof UserTargets;
  label: string;
  unit: string;
}

export const DAILY_TARGET_FIELDS: DailyTargetFieldDef[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'proteinG', label: 'Protein', unit: 'g' },
  { key: 'carbsG', label: 'Carbs', unit: 'g' },
  { key: 'fatG', label: 'Fat', unit: 'g' },
];

export interface BodyStatsFormState {
  heightCm: string;
  weightKg: string;
  age: string;
  sex: Sex;
  activity: ActivityLevel;
}

const toFieldString = (value: number | undefined): string =>
  value === undefined || Number.isNaN(value) ? '' : String(value);

export const bodyStatsToForm = (stats: BodyStats | null): BodyStatsFormState => ({
  heightCm: toFieldString(stats?.heightCm),
  weightKg: toFieldString(stats?.weightKg),
  age: toFieldString(stats?.age),
  sex: stats?.sex ?? 'male',
  activity: stats?.activity ?? 'moderate',
});

export const bodyStatsFromForm = (
  form: BodyStatsFormState,
): BodyStats | null => {
  const heightCm = Number(form.heightCm);
  const weightKg = Number(form.weightKg);
  const age = Number(form.age);
  if (
    !Number.isFinite(heightCm) ||
    !Number.isFinite(weightKg) ||
    !Number.isFinite(age) ||
    heightCm <= 0 ||
    weightKg <= 0 ||
    age <= 0
  ) {
    return null;
  }
  return { heightCm, weightKg, age, sex: form.sex, activity: form.activity };
};

export const bodyStatsSourceKey = (stats: BodyStats | null): string =>
  `${stats?.heightCm}|${stats?.weightKg}|${stats?.age}|${stats?.sex}|${stats?.activity}`;

export interface WeightGoalFormState {
  type: GoalType;
  targetWeightKg: string;
  targetDateISO: string;
}

export interface WeightGoalSource {
  goal: WeightGoal | null;
  currentWeightKg: number | undefined;
}

export const defaultTargetDate = (): string => {
  const date = new Date();
  date.setMonth(date.getMonth() + 6);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const weightGoalToForm = ({
  goal,
  currentWeightKg,
}: WeightGoalSource): WeightGoalFormState => ({
  type: goal?.type ?? 'maintain',
  targetWeightKg: goal?.targetWeightKg
    ? String(goal.targetWeightKg)
    : currentWeightKg
      ? String(currentWeightKg)
      : '',
  targetDateISO: goal?.targetDateISO ?? defaultTargetDate(),
});

export const weightGoalFromForm =
  (currentWeightKg: number | undefined) =>
  (form: WeightGoalFormState): WeightGoal | null => {
    if (!form.targetDateISO) return null;
    if (form.type === 'maintain') {
      return {
        type: 'maintain',
        targetWeightKg: currentWeightKg ?? 0,
        targetDateISO: form.targetDateISO,
      };
    }

    const targetWeightKg = Number(form.targetWeightKg);
    if (!Number.isFinite(targetWeightKg) || targetWeightKg <= 0) return null;
    return { type: form.type, targetWeightKg, targetDateISO: form.targetDateISO };
  };

export const weightGoalSourceKey = ({
  goal,
  currentWeightKg,
}: WeightGoalSource): string =>
  `${goal?.type}|${goal?.targetWeightKg}|${goal?.targetDateISO}|${currentWeightKg}`;

export const targetsKey = (targets: UserTargets): string =>
  `${targets.calories.value}|${targets.proteinG.value}|${targets.carbsG.value}|${targets.fatG.value}`;

export const targetsDraftFromTargets = (
  targets: UserTargets,
): Record<keyof UserTargets, string> => ({
  calories: String(targets.calories.value),
  proteinG: String(targets.proteinG.value),
  carbsG: String(targets.carbsG.value),
  fatG: String(targets.fatG.value),
});
