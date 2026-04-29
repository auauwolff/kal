import type { ExerciseType } from '@/components/diary/types';
import type { WeightGoal } from '@/lib/userTypes';

export type StatsRange = 7 | 30 | 90;

export interface StatsDay {
  date: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  targetCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  streakStatus: 0 | 1 | 2 | 3;
}

export interface WeightPoint {
  date: string;
  weightKg: number;
}

export interface ExerciseWeek {
  weekStart: string;
  weekLabel: string;
  minutes: Record<ExerciseType, number>;
}

export interface PrevPeriodAverages {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  days: number;
}

export interface StatsData {
  rangeDays: StatsRange;
  days: StatsDay[];
  weights: WeightPoint[];
  exerciseWeeks: ExerciseWeek[];
  currentStreak: number;
  longestStreak: number;
  currentWeightKg: number | null;
  goal: WeightGoal | null;
  prevPeriodAverages: PrevPeriodAverages | null;
}
