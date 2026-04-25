import { create } from 'zustand';
import { getMockDiary } from '@/lib/mockDiary';
import type { DayDiary, MealLog, MealType } from '@/components/diary/types';
import { MEAL_TYPES } from '@/components/diary/types';
import { useGemsStore } from '@/stores/gemsStore';

// Gems awarded per new log entry. Phase 2 placeholder; Phase 3 earn rules
// (KAL.md §8) will replace this with target/streak-based awards.
const GEMS_PER_LOG = 5;

const toISO = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shift = (iso: string, days: number) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toISO(d);
};

const recomputeTotals = (day: DayDiary): DayDiary => {
  const totals = Object.values(day.meals)
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
  return { ...day, totals };
};

const seedDay = (
  days: Record<string, DayDiary>,
  iso: string,
): Record<string, DayDiary> =>
  days[iso] ? days : { ...days, [iso]: getMockDiary(iso) };

const findAndRemove = (
  meals: Record<MealType, MealLog[]>,
  entryId: string,
): { meals: Record<MealType, MealLog[]>; removed?: MealLog } => {
  const next: Record<MealType, MealLog[]> = {
    breakfast: meals.breakfast,
    lunch: meals.lunch,
    dinner: meals.dinner,
    snack: meals.snack,
  };
  for (const type of MEAL_TYPES) {
    const idx = next[type].findIndex((e) => e.id === entryId);
    if (idx !== -1) {
      const removed = next[type][idx];
      next[type] = [...next[type].slice(0, idx), ...next[type].slice(idx + 1)];
      return { meals: next, removed };
    }
  }
  return { meals: next };
};

export interface AddEntryArgs {
  mealType: MealType;
  foodId: string;
  foodName: string;
  brand?: string;
  quantityG: number;
  servingLabel?: string;
  nutrientsPer100g: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}

interface DiaryStore {
  selectedDate: string;
  days: Record<string, DayDiary>;
  setDate: (iso: string) => void;
  goPrevDay: () => void;
  goNextDay: () => void;
  goToday: () => void;
  addEntry: (args: AddEntryArgs) => void;
  relogEntry: (mealType: MealType, source: MealLog) => void;
  moveEntry: (entryId: string, to: MealType) => void;
  deleteEntry: (entryId: string) => void;
}

const todayISO = toISO(new Date());

export const useDiaryStore = create<DiaryStore>()((set, get) => ({
  selectedDate: todayISO,
  days: { [todayISO]: getMockDiary(todayISO) },
  setDate: (iso) =>
    set((s) => ({ selectedDate: iso, days: seedDay(s.days, iso) })),
  goPrevDay: () =>
    set((s) => {
      const iso = shift(s.selectedDate, -1);
      return { selectedDate: iso, days: seedDay(s.days, iso) };
    }),
  goNextDay: () =>
    set((s) => {
      const iso = shift(s.selectedDate, 1);
      return { selectedDate: iso, days: seedDay(s.days, iso) };
    }),
  goToday: () =>
    set((s) => {
      const iso = toISO(new Date());
      return { selectedDate: iso, days: seedDay(s.days, iso) };
    }),
  addEntry: (args) => {
    const iso = get().selectedDate;
    const now = Date.now();
    const scale = args.quantityG / 100;
    const n = args.nutrientsPer100g;
    const newEntry: MealLog = {
      id: `${iso}-${args.mealType}-${args.foodId}-${now}`,
      userId: 'mock-user',
      date: iso,
      mealType: args.mealType,
      loggedAt: now,
      foodId: args.foodId,
      foodName: args.foodName,
      brand: args.brand,
      quantityG: args.quantityG,
      servingLabel: args.servingLabel,
      calories: Math.round(n.calories * scale),
      proteinG: Math.round(n.proteinG * scale * 10) / 10,
      carbsG: Math.round(n.carbsG * scale * 10) / 10,
      fatG: Math.round(n.fatG * scale * 10) / 10,
    };
    set((s) => {
      const day = s.days[iso];
      if (!day) return s;
      const meals = {
        ...day.meals,
        [args.mealType]: [...day.meals[args.mealType], newEntry],
      };
      return {
        days: { ...s.days, [iso]: recomputeTotals({ ...day, meals }) },
      };
    });
    useGemsStore.getState().addGems(GEMS_PER_LOG);
  },
  relogEntry: (mealType, source) => {
    const iso = get().selectedDate;
    const now = Date.now();
    const newEntry: MealLog = {
      ...source,
      id: `${iso}-${mealType}-${source.foodId}-${now}`,
      date: iso,
      mealType,
      loggedAt: now,
    };
    set((s) => {
      const day = s.days[iso];
      if (!day) return s;
      const meals = {
        ...day.meals,
        [mealType]: [...day.meals[mealType], newEntry],
      };
      return {
        days: { ...s.days, [iso]: recomputeTotals({ ...day, meals }) },
      };
    });
    useGemsStore.getState().addGems(GEMS_PER_LOG);
  },
  moveEntry: (entryId, to) =>
    set((s) => {
      const iso = s.selectedDate;
      const day = s.days[iso];
      if (!day) return s;
      const { meals, removed } = findAndRemove(day.meals, entryId);
      if (!removed || removed.mealType === to) return s;
      const moved: MealLog = { ...removed, mealType: to };
      meals[to] = [...meals[to], moved].sort((a, b) => a.loggedAt - b.loggedAt);
      return {
        days: { ...s.days, [iso]: recomputeTotals({ ...day, meals }) },
      };
    }),
  deleteEntry: (entryId) =>
    set((s) => {
      const iso = s.selectedDate;
      const day = s.days[iso];
      if (!day) return s;
      const { meals, removed } = findAndRemove(day.meals, entryId);
      if (!removed) return s;
      return {
        days: { ...s.days, [iso]: recomputeTotals({ ...day, meals }) },
      };
    }),
}));

export const selectRecentFoods = (state: DiaryStore): MealLog[] => {
  const all = Object.values(state.days).flatMap((d) =>
    Object.values(d.meals).flat(),
  );
  const byFoodId = new Map<string, MealLog>();
  for (const entry of [...all].sort((a, b) => b.loggedAt - a.loggedAt)) {
    if (!byFoodId.has(entry.foodId)) byFoodId.set(entry.foodId, entry);
  }
  return Array.from(byFoodId.values()).slice(0, 10);
};

export const getTodayISO = () => toISO(new Date());

export const formatDayLabel = (iso: string) => {
  const today = toISO(new Date());
  const yesterday = shift(today, -1);
  const tomorrow = shift(today, 1);
  if (iso === today) return 'Today';
  if (iso === yesterday) return 'Yesterday';
  if (iso === tomorrow) return 'Tomorrow';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};
