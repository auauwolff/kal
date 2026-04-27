import { useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import type {
  DayDiary,
  ExerciseIntensity,
  ExerciseType,
  MealLog,
  MealType,
} from './types';
import { useGemsStore } from '@/stores/gemsStore';
import { useDiaryStore } from '@/stores/diaryStore';
import { dailyTargetsFromProfile, profileFromUser } from '@/lib/profile';

const GEMS_PER_LOG = 5;

interface AddEntryArgs {
  mealType: MealType;
  foodId: string;
  quantityG: number;
  servingLabel?: string;
}

interface UpdateEntryArgs {
  quantityG: number;
  servingLabel?: string | null;
}

interface AddExerciseArgs {
  type: ExerciseType;
  durationMin: number;
  intensity: ExerciseIntensity;
  notes?: string;
}

const emptyDay = (date: string): DayDiary => ({
  date,
  totals: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  meals: { breakfast: [], lunch: [], dinner: [], snack: [] },
  exercise: [],
});

export const useDiary = () => {
  const selectedDate = useDiaryStore((s) => s.selectedDate);
  const dayQuery = useQuery(api.meal_logs.getByDate, { date: selectedDate }) as
    | DayDiary
    | undefined;
  const recentFoodsQuery = useQuery(api.meal_logs.recentFoods, { limit: 10 }) as
    | MealLog[]
    | undefined;
  const userQuery = useQuery(api.users.get, {});
  const addMealLog = useMutation(api.meal_logs.add);
  const relogMealLog = useMutation(api.meal_logs.relog);
  const moveMealLog = useMutation(api.meal_logs.move);
  const removeMealLog = useMutation(api.meal_logs.remove);
  const updateMealLog = useMutation(api.meal_logs.update);
  const addExerciseLog = useMutation(api.exercise_logs.add);
  const removeExerciseLog = useMutation(api.exercise_logs.remove);
  const targets = dailyTargetsFromProfile(profileFromUser(userQuery));

  const addEntry = useCallback(
    async ({ mealType, foodId, quantityG, servingLabel }: AddEntryArgs) => {
      await addMealLog({
        date: selectedDate,
        mealType,
        foodId: foodId as Id<'foods'>,
        quantityG,
        ...(servingLabel ? { servingLabel } : {}),
      });
      useGemsStore.getState().addGems(GEMS_PER_LOG);
    },
    [addMealLog, selectedDate],
  );

  const relogEntry = useCallback(
    async (mealType: MealType, source: MealLog) => {
      await relogMealLog({
        sourceMealLogId: source.id as Id<'meal_logs'>,
        date: selectedDate,
        mealType,
      });
      useGemsStore.getState().addGems(GEMS_PER_LOG);
    },
    [relogMealLog, selectedDate],
  );

  const moveEntry = useCallback(
    async (entryId: string, to: MealType) => {
      await moveMealLog({
        mealLogId: entryId as Id<'meal_logs'>,
        mealType: to,
      });
    },
    [moveMealLog],
  );

  const deleteEntry = useCallback(
    async (entryId: string) => {
      await removeMealLog({ mealLogId: entryId as Id<'meal_logs'> });
    },
    [removeMealLog],
  );

  const updateEntry = useCallback(
    async (entryId: string, { quantityG, servingLabel }: UpdateEntryArgs) => {
      await updateMealLog({
        mealLogId: entryId as Id<'meal_logs'>,
        quantityG,
        ...(servingLabel === undefined ? {} : { servingLabel }),
      });
    },
    [updateMealLog],
  );

  const addExercise = useCallback(
    async ({ type, durationMin, intensity, notes }: AddExerciseArgs) => {
      await addExerciseLog({
        date: selectedDate,
        type,
        durationMin,
        intensity,
        ...(notes ? { notes } : {}),
      });
    },
    [addExerciseLog, selectedDate],
  );

  const deleteExercise = useCallback(
    async (entryId: string) => {
      await removeExerciseLog({ exerciseLogId: entryId as Id<'exercise_logs'> });
    },
    [removeExerciseLog],
  );

  return {
    ...(dayQuery ?? emptyDay(selectedDate)),
    targets,
    recentFoods: recentFoodsQuery ?? [],
    addEntry,
    relogEntry,
    moveEntry,
    deleteEntry,
    updateEntry,
    addExercise,
    deleteExercise,
  };
};
