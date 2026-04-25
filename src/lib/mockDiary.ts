import type {
  DayDiary,
  ExerciseLog,
  MealLog,
  MealType,
} from '@/components/diary/types';

export interface FoodTemplate {
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

// Placeholder foods used by the Phase 2 "+" affordance until the real
// food-search flow lands. Picked at random so each tap surfaces a different
// item — useful for testing the celebration UX and the meal-card layouts.
export const PLACEHOLDER_FOODS: FoodTemplate[] = [
  { foodId: 'banana', foodName: 'Banana', quantityG: 120, servingLabel: '1 medium', calories: 105, proteinG: 1.3, carbsG: 27, fatG: 0.4 },
  { foodId: 'greek-yogurt', foodName: 'Greek yogurt, plain', brand: 'Chobani', quantityG: 170, servingLabel: '1 tub', calories: 100, proteinG: 17, carbsG: 6, fatG: 0 },
  { foodId: 'chicken-breast', foodName: 'Chicken breast, grilled', quantityG: 150, calories: 247, proteinG: 46, carbsG: 0, fatG: 5.4 },
  { foodId: 'apple', foodName: 'Apple', quantityG: 180, servingLabel: '1 large', calories: 95, proteinG: 0.5, carbsG: 25, fatG: 0.3 },
  { foodId: 'sourdough-toast', foodName: 'Sourdough toast', quantityG: 60, servingLabel: '2 slices', calories: 162, proteinG: 6, carbsG: 32, fatG: 1.2 },
  { foodId: 'egg-boiled', foodName: 'Egg, boiled', quantityG: 50, servingLabel: '1 large', calories: 78, proteinG: 6, carbsG: 0.6, fatG: 5 },
  { foodId: 'oatmeal', foodName: 'Oatmeal, plain', quantityG: 200, servingLabel: '1 bowl', calories: 150, proteinG: 5, carbsG: 27, fatG: 3 },
  { foodId: 'almonds', foodName: 'Almonds', quantityG: 30, servingLabel: '1 small handful', calories: 174, proteinG: 6.4, carbsG: 6.5, fatG: 15 },
  { foodId: 'avocado', foodName: 'Avocado', quantityG: 100, servingLabel: '½ large', calories: 160, proteinG: 2, carbsG: 9, fatG: 15 },
  { foodId: 'salmon', foodName: 'Salmon fillet, baked', quantityG: 120, calories: 250, proteinG: 25, carbsG: 0, fatG: 16 },
];

export const pickPlaceholderFood = (): FoodTemplate =>
  PLACEHOLDER_FOODS[Math.floor(Math.random() * PLACEHOLDER_FOODS.length)];

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

  return { date, totals, meals, exercise };
};
