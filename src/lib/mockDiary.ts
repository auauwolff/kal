import type {
  DayDiary,
  ExerciseLog,
  MealLog,
  MealType,
} from '@/components/diary/types';

export const getMockDiary = (date: string): DayDiary => {
  const meals: Record<MealType, MealLog[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };

  const exercise: ExerciseLog[] = [
    {
      id: `${date}-ex-1`,
      userId: 'mock-user',
      date,
      type: 'strength',
      durationMin: 55,
      intensity: 'hard',
      notes: 'Push day — bench, OHP, triceps',
      loggedAt: Date.parse(`${date}T18:30:00`),
    },
  ];

  const totals = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };

  return { date, totals, meals, exercise };
};
