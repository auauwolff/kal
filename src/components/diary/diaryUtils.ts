import type { DailyTotals, ExerciseIntensity, ExerciseLog, ExerciseType, MealLog, MealType } from './types';
import { MEAL_TYPES } from './types';

export const EXERCISE_TYPES: ExerciseType[] = [
  'strength',
  'cardio',
  'sports',
  'walk',
  'other',
];

export const EXERCISE_INTENSITIES: ExerciseIntensity[] = [
  'light',
  'moderate',
  'hard',
];

export const emptyDailyTotals = (): DailyTotals => ({
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
});

export const mealTotals = (entries: MealLog[]): DailyTotals =>
  entries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      proteinG: totals.proteinG + entry.proteinG,
      carbsG: totals.carbsG + entry.carbsG,
      fatG: totals.fatG + entry.fatG,
    }),
    emptyDailyTotals(),
  );

export const otherMealTypes = (mealType: MealType): MealType[] =>
  MEAL_TYPES.filter((candidate) => candidate !== mealType);

export const totalExerciseMinutes = (entries: ExerciseLog[]): number =>
  entries.reduce((total, entry) => total + entry.durationMin, 0);

export const parsedExerciseDuration = (durationMin: string): number | null => {
  const parsed = Number(durationMin);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.round(parsed);
};
