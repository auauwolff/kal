import { createContext, useContext } from 'react';
import type {
  BodyStats,
  UserTargets,
  WeightGoal,
} from '@/lib/userTypes';
import type { autoTargetsForProfile } from '@/lib/profile';

export interface ProfileDraftValue {
  bodyStats: BodyStats | null;
  goal: WeightGoal | null;
  targets: UserTargets;
  autoTargets: ReturnType<typeof autoTargetsForProfile>;
  setBodyStats: (bodyStats: BodyStats) => void;
  setGoal: (goal: WeightGoal) => void;
  setTarget: (key: keyof UserTargets, value: number) => void;
  resetTargetsToAuto: () => void;
  isDirty: boolean;
  isSaving: boolean;
  saveError: Error | null;
  save: () => void;
  discard: () => void;
}

export const ProfileDraftContext = createContext<ProfileDraftValue | null>(
  null,
);

export const useProfileDraft = (): ProfileDraftValue => {
  const ctx = useContext(ProfileDraftContext);
  if (!ctx) {
    throw new Error(
      'useProfileDraft must be used inside a <ProfileDraftProvider>',
    );
  }
  return ctx;
};
