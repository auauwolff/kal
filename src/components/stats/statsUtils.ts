import type { ExerciseType } from '@/components/diary/types';
import type { ExerciseWeek } from './types';

export const EXERCISE_STACK_TYPES: ExerciseType[] = [
  'strength',
  'cardio',
  'sports',
  'walk',
  'other',
];

export const average = (values: number[]): number => {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
};

export const rollingMean = (values: number[], window: number): number[] =>
  values.map((_, index) => {
    const start = Math.max(0, index - window + 1);
    const slice = values.slice(start, index + 1);
    return slice.reduce((total, value) => total + value, 0) / slice.length;
  });

export const totalExerciseMinutes = (weeks: ExerciseWeek[]): number =>
  weeks.reduce(
    (total, week) =>
      total +
      EXERCISE_STACK_TYPES.reduce(
        (weekTotal, type) => weekTotal + week.minutes[type],
        0,
      ),
    0,
  );
