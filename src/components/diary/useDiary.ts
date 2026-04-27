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

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

const fireGemAnimation = (gemsAwarded: number) => {
  if (gemsAwarded <= 0) return;
  useGemsStore
    .getState()
    .addGems(gemsAwarded, { stagger: !prefersReducedMotion() });
};

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

interface MealTemplateItemInput {
  foodId: string;
  quantityG: number;
  servingLabel?: string;
}

interface AddExerciseArgs {
  type: ExerciseType;
  durationMin: number;
  intensity: ExerciseIntensity;
  notes?: string;
}

const toBackendItems = (items: MealTemplateItemInput[]) =>
  items.map((item) => ({
    foodId: item.foodId as Id<'foods'>,
    quantityG: item.quantityG,
    ...(item.servingLabel ? { servingLabel: item.servingLabel } : {}),
  }));

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
  const mealTemplatesQuery = useQuery(api.meal_templates.list, {});
  const addMealLog = useMutation(api.meal_logs.add);
  const relogMealLog = useMutation(api.meal_logs.relog);
  const moveMealLog = useMutation(api.meal_logs.move);
  const removeMealLog = useMutation(api.meal_logs.remove);
  const updateMealLog = useMutation(api.meal_logs.update);
  const addExerciseLog = useMutation(api.exercise_logs.add);
  const removeExerciseLog = useMutation(api.exercise_logs.remove);
  const createTemplate = useMutation(api.meal_templates.create);
  const updateTemplate = useMutation(api.meal_templates.update);
  const removeTemplate = useMutation(api.meal_templates.remove);
  const createTemplateFromSection = useMutation(api.meal_templates.createFromSection);
  const logTemplate = useMutation(api.meal_templates.log);
  const targets = dailyTargetsFromProfile(profileFromUser(userQuery));

  const addEntry = useCallback(
    async ({ mealType, foodId, quantityG, servingLabel }: AddEntryArgs) => {
      const result = await addMealLog({
        date: selectedDate,
        mealType,
        foodId: foodId as Id<'foods'>,
        quantityG,
        ...(servingLabel ? { servingLabel } : {}),
      });
      fireGemAnimation(result.gemsAwarded);
    },
    [addMealLog, selectedDate],
  );

  const relogEntry = useCallback(
    async (mealType: MealType, source: MealLog) => {
      const result = await relogMealLog({
        sourceMealLogId: source.id as Id<'meal_logs'>,
        date: selectedDate,
        mealType,
      });
      fireGemAnimation(result.gemsAwarded);
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
      const result = await addExerciseLog({
        date: selectedDate,
        type,
        durationMin,
        intensity,
        ...(notes ? { notes } : {}),
      });
      fireGemAnimation(result.gemsAwarded);
    },
    [addExerciseLog, selectedDate],
  );

  const deleteExercise = useCallback(
    async (entryId: string) => {
      await removeExerciseLog({ exerciseLogId: entryId as Id<'exercise_logs'> });
    },
    [removeExerciseLog],
  );

  const createMealTemplate = useCallback(
    async ({ name, items }: { name: string; items: MealTemplateItemInput[] }) =>
      createTemplate({ name, items: toBackendItems(items) }),
    [createTemplate],
  );

  const updateMealTemplate = useCallback(
    async (
      id: string,
      patch: { name?: string; items?: MealTemplateItemInput[] },
    ) => {
      await updateTemplate({
        id: id as Id<'meal_templates'>,
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.items !== undefined ? { items: toBackendItems(patch.items) } : {}),
      });
    },
    [updateTemplate],
  );

  const deleteMealTemplate = useCallback(
    async (id: string) => {
      await removeTemplate({ id: id as Id<'meal_templates'> });
    },
    [removeTemplate],
  );

  const saveSectionAsMealTemplate = useCallback(
    async ({ name, mealType }: { name: string; mealType: MealType }) =>
      createTemplateFromSection({ name, date: selectedDate, mealType }),
    [createTemplateFromSection, selectedDate],
  );

  const logMealTemplate = useCallback(
    async (mealType: MealType, templateId: string) => {
      const result = await logTemplate({
        id: templateId as Id<'meal_templates'>,
        date: selectedDate,
        mealType,
      });
      fireGemAnimation(result.gemsAwarded);
      return result;
    },
    [logTemplate, selectedDate],
  );

  return {
    ...(dayQuery ?? emptyDay(selectedDate)),
    targets,
    recentFoods: recentFoodsQuery ?? [],
    mealTemplates: mealTemplatesQuery ?? [],
    addEntry,
    relogEntry,
    moveEntry,
    deleteEntry,
    updateEntry,
    addExercise,
    deleteExercise,
    createMealTemplate,
    updateMealTemplate,
    deleteMealTemplate,
    saveSectionAsMealTemplate,
    logMealTemplate,
  };
};
