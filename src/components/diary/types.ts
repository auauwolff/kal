export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type ExerciseType = 'strength' | 'cardio' | 'sports' | 'walk' | 'other';

export type ExerciseIntensity = 'light' | 'moderate' | 'hard';

export interface MealLog {
  id: string;
  userId: string;
  date: string;
  mealType: MealType;
  loggedAt: number;
  foodId: string;
  foodName: string;
  brand?: string;
  quantityG: number;
  servingLabel?: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface ExerciseLog {
  id: string;
  userId: string;
  date: string;
  type: ExerciseType;
  durationMin: number;
  intensity: ExerciseIntensity;
  notes?: string;
  loggedAt: number;
}

export interface DailyTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface DailyTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface DayDiary {
  date: string;
  targets: DailyTargets;
  totals: DailyTotals;
  meals: Record<MealType, MealLog[]>;
  exercise: ExerciseLog[];
}

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export const EXERCISE_LABELS: Record<ExerciseType, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  sports: 'Sports',
  walk: 'Walk',
  other: 'Other',
};
