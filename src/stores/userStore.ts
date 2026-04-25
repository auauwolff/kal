import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calorieTargetForGoal, macroTargets } from '@/lib/nutrition';
import type {
  BodyStats,
  UserProfile,
  UserTargets,
  WeightGoal,
} from '@/lib/userTypes';

const DEFAULT_TARGETS: UserTargets = {
  calories: { value: 2600, isOverride: false },
  proteinG: { value: 165, isOverride: false },
  carbsG: { value: 260, isOverride: false },
  fatG: { value: 85, isOverride: false },
};

const todayISO = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface UserStore extends UserProfile {
  setBodyStats: (stats: BodyStats) => void;
  setGoal: (goal: WeightGoal) => void;
  setTarget: (key: keyof UserTargets, value: number) => void;
  recalcTargets: () => void;
  resetTargetsToAuto: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      bodyStats: null,
      goal: null,
      targets: DEFAULT_TARGETS,

      setBodyStats: (bodyStats) => {
        set({ bodyStats });
        get().recalcTargets();
      },

      setGoal: (goal) => {
        set({ goal });
        get().recalcTargets();
      },

      setTarget: (key, value) =>
        set((s) => ({
          targets: { ...s.targets, [key]: { value, isOverride: true } },
        })),

      recalcTargets: () => {
        const { bodyStats, goal, targets } = get();
        if (!bodyStats || !goal) return;
        // For maintain, target weight is implicitly the current weight.
        const targetWeightKg =
          goal.type === 'maintain' ? bodyStats.weightKg : goal.targetWeightKg;
        const { calories } = calorieTargetForGoal({
          ...bodyStats,
          targetWeightKg,
          targetDateISO: goal.targetDateISO,
          todayISO: todayISO(),
        });
        const macros = macroTargets({
          weightKg: bodyStats.weightKg,
          calorieTarget: calories,
          goal: goal.type,
        });
        const next = (
          k: keyof UserTargets,
          autoVal: number,
        ): { value: number; isOverride: boolean } =>
          targets[k].isOverride
            ? targets[k]
            : { value: autoVal, isOverride: false };
        set({
          targets: {
            calories: next('calories', calories),
            proteinG: next('proteinG', macros.proteinG),
            carbsG: next('carbsG', macros.carbsG),
            fatG: next('fatG', macros.fatG),
          },
        });
      },

      resetTargetsToAuto: () => {
        set((s) => ({
          targets: {
            calories: { ...s.targets.calories, isOverride: false },
            proteinG: { ...s.targets.proteinG, isOverride: false },
            carbsG: { ...s.targets.carbsG, isOverride: false },
            fatG: { ...s.targets.fatG, isOverride: false },
          },
        }));
        get().recalcTargets();
      },
    }),
    { name: 'kal-profile', version: 1 },
  ),
);

// Projects the override-aware targets to the legacy DailyTargets shape used
// by the Diary's energy gauge and macro rings.
export const selectDailyTargets = (s: UserStore) => ({
  calories: s.targets.calories.value,
  proteinG: s.targets.proteinG.value,
  carbsG: s.targets.carbsG.value,
  fatG: s.targets.fatG.value,
});
