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
// Brain-glucose floor — never drop computed carbs below this.
const MIN_CARB_FLOOR_G = 50;
// Lower clinical floor for essential-fatty-acid intake.
const MIN_FAT_PER_KG = 0.6;

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
  const targetMs = Date.parse(p.targetDateISO);
  const todayMs = Date.parse(p.todayISO);
  if (!Number.isFinite(targetMs) || !Number.isFinite(todayMs)) {
    // Invalid date — fall back to maintenance so the UI never shows NaN.
    const calories = Math.max(
      MIN_DAILY_CALORIES,
      Math.round(maintenance / 10) * 10,
    );
    return {
      calories,
      maintenance: Math.round(maintenance),
      dailyDelta: 0,
      weeklyDeltaKg: 0,
      clamped: false,
    };
  }
  const deltaKg = p.targetWeightKg - p.weightKg;
  const days = Math.max(1, Math.round((targetMs - todayMs) / 86_400_000));
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
  // The calorie total the macros actually sum to. Equals the input
  // `calorieTarget` in the common case, but can be higher when protein + a
  // minimum-viable fat + the carb floor exceed the input — in that corner the
  // 1500 kcal floor must yield so macros stay coherent. KAL.md §5 calls out
  // that under-eating risk outweighs over-eating risk, so lifting calories
  // here is intentional.
  effectiveCalories: number;
}

export const macroTargets = ({
  weightKg,
  calorieTarget,
  goal,
}: MacroInput): MacroResult => {
  const proteinPerKg = goal === 'lose' || goal === 'recomp' ? 2.2 : 1.8;
  const proteinG = Math.round(weightKg * proteinPerKg);
  const minFatG = Math.round(weightKg * MIN_FAT_PER_KG);
  const proteinKcal = proteinG * 4;
  const minCarbKcal = MIN_CARB_FLOOR_G * 4;
  const minViableCalories = proteinKcal + minFatG * 9 + minCarbKcal;
  const effectiveCalories = Math.max(calorieTarget, minViableCalories);

  let fatG = Math.round(weightKg * 0.9);
  let carbsG = Math.round((effectiveCalories - proteinKcal - fatG * 9) / 4);

  if (carbsG < MIN_CARB_FLOOR_G) {
    const remainingForFat = effectiveCalories - proteinKcal - minCarbKcal;
    fatG = Math.max(minFatG, Math.floor(remainingForFat / 9));
    carbsG = Math.max(
      MIN_CARB_FLOOR_G,
      Math.round((effectiveCalories - proteinKcal - fatG * 9) / 4),
    );
  }

  return { proteinG, carbsG, fatG, effectiveCalories };
};
