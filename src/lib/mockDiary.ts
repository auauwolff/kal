import type {
  DayDiary,
  ExerciseLog,
  MealLog,
  MealType,
} from '@/components/diary/types';

const makeMeal = (
  date: string,
  mealType: MealType,
  foodId: string,
  foodName: string,
  quantityG: number,
  macros: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  },
  brand?: string,
  servingLabel?: string,
): MealLog => ({
  id: `${date}-${mealType}-${foodId}`,
  userId: 'mock-user',
  date,
  mealType,
  loggedAt: Date.parse(`${date}T08:00:00`),
  foodId,
  foodName,
  brand,
  quantityG,
  servingLabel,
  ...macros,
});

export const getMockDiary = (date: string): DayDiary => {
  const targets = {
    calories: 2600,
    proteinG: 165,
    carbsG: 260,
    fatG: 85,
  };

  const meals: Record<MealType, MealLog[]> = {
    breakfast: [
      makeMeal(
        date,
        'breakfast',
        'weetbix',
        'Weet-Bix',
        45,
        { calories: 160, proteinG: 5, carbsG: 30, fatG: 1 },
        'Sanitarium',
        '3 biscuits',
      ),
      makeMeal(
        date,
        'breakfast',
        'milk',
        'Milk, full cream',
        200,
        { calories: 132, proteinG: 6.8, carbsG: 9.4, fatG: 7.4 },
        undefined,
        '1 cup',
      ),
    ],
    lunch: [
      makeMeal(
        date,
        'lunch',
        'chicken-wrap',
        'GYG Chicken Mini Burrito',
        280,
        { calories: 540, proteinG: 34, carbsG: 58, fatG: 18 },
        "Guzman y Gomez",
      ),
    ],
    dinner: [
      makeMeal(
        date,
        'dinner',
        'barramundi',
        'Barramundi fillet',
        180,
        { calories: 198, proteinG: 37, carbsG: 0, fatG: 4.5 },
      ),
      makeMeal(
        date,
        'dinner',
        'rice',
        'Jasmine rice, cooked',
        200,
        { calories: 260, proteinG: 5, carbsG: 57, fatG: 0.5 },
      ),
    ],
    snack: [
      makeMeal(
        date,
        'snack',
        'tim-tam',
        'Tim Tam Original',
        36,
        { calories: 188, proteinG: 2, carbsG: 24, fatG: 9.5 },
        'Arnott\'s',
        '2 biscuits',
      ),
    ],
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

  const totals = Object.values(meals)
    .flat()
    .reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        proteinG: acc.proteinG + m.proteinG,
        carbsG: acc.carbsG + m.carbsG,
        fatG: acc.fatG + m.fatG,
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    );

  return { date, targets, totals, meals, exercise };
};
