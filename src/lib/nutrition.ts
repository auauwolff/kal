// Nutrition math — Mifflin-St Jeor BMR × activity multiplier, with a
// goal-rate calorie adjustment clamped to a clinically safe weekly delta.
// See KAL.md §5 for the policy this implements.

export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
} as const;

export type ActivityLevel = keyof typeof ACTIVITY_MULTIPLIERS;
export type Sex = 'male' | 'female';
export type GoalType = 'lose' | 'maintain' | 'gain' | 'recomp';

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary — desk job, no exercise',
  light: 'Light — 1–3 sessions / week',
  moderate: 'Moderate — 3–5 sessions / week',
  active: 'Active — 6–7 sessions / week',
  very_active: 'Very active — physical job + heavy training',
};

const KCAL_PER_KG_BODYWEIGHT = 7700;
const MAX_LOSS_RATE_PER_WEEK = 0.01;
const MAX_GAIN_RATE_PER_WEEK = 0.005;
const MIN_DAILY_CALORIES = 1500;

export interface BmrInput {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
}

export const bmr = ({ weightKg, heightCm, age, sex }: BmrInput): number =>
  10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161);

export interface TdeeInput extends BmrInput {
  activity: ActivityLevel;
}

export const tdee = (args: TdeeInput): number =>
  bmr(args) * ACTIVITY_MULTIPLIERS[args.activity];

export interface CalorieGoalInput extends TdeeInput {
  targetWeightKg: number;
  targetDateISO: string;
  todayISO: string;
}

export interface CalorieGoalResult {
  calories: number;
  maintenance: number;
  dailyDelta: number;
  weeklyDeltaKg: number;
  clamped: boolean;
}

export const calorieTargetForGoal = (
  p: CalorieGoalInput,
): CalorieGoalResult => {
  const maintenance = tdee(p);
  const deltaKg = p.targetWeightKg - p.weightKg;
  const days = Math.max(
    1,
    Math.round(
      (Date.parse(p.targetDateISO) - Date.parse(p.todayISO)) / 86_400_000,
    ),
  );
  const requiredDaily = (deltaKg * KCAL_PER_KG_BODYWEIGHT) / days;
  const maxLossPerDay =
    (p.weightKg * MAX_LOSS_RATE_PER_WEEK * KCAL_PER_KG_BODYWEIGHT) / 7;
  const maxGainPerDay =
    (p.weightKg * MAX_GAIN_RATE_PER_WEEK * KCAL_PER_KG_BODYWEIGHT) / 7;
  const clampedDelta = Math.max(
    -maxLossPerDay,
    Math.min(maxGainPerDay, requiredDaily),
  );
  const rawTarget = maintenance + clampedDelta;
  const calories = Math.max(
    MIN_DAILY_CALORIES,
    Math.round(rawTarget / 10) * 10,
  );
  const weeklyDeltaKg = (clampedDelta * 7) / KCAL_PER_KG_BODYWEIGHT;
  return {
    calories,
    maintenance: Math.round(maintenance),
    dailyDelta: Math.round(clampedDelta),
    weeklyDeltaKg: Math.round(weeklyDeltaKg * 100) / 100,
    clamped: clampedDelta !== requiredDaily,
  };
};

export interface MacroInput {
  weightKg: number;
  calorieTarget: number;
  goal: GoalType;
}

export interface MacroResult {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export const macroTargets = ({
  weightKg,
  calorieTarget,
  goal,
}: MacroInput): MacroResult => {
  const proteinPerKg = goal === 'lose' || goal === 'recomp' ? 2.2 : 1.8;
  const fatPerKg = 0.9;
  const proteinG = Math.round(weightKg * proteinPerKg);
  const fatG = Math.round(weightKg * fatPerKg);
  const carbsG = Math.max(
    0,
    Math.round((calorieTarget - proteinG * 4 - fatG * 9) / 4),
  );
  return { proteinG, carbsG, fatG };
};
