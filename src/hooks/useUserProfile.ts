import { useCallback, useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { BodyStats, UserProfile, UserTargets, WeightGoal } from '@/lib/userTypes';
import {
  autoTargetsForProfile,
  dailyTargetsFromProfile,
  profileFromUser,
  recalcProfileTargets,
} from '@/lib/profile';

const reportProfileSaveError = (error: unknown) => {
  console.error('Failed to save profile', error);
};

export const useUserProfile = () => {
  const user = useQuery(api.users.get, {});
  const upsertProfile = useMutation(api.users.upsertProfile);
  const profile = useMemo(() => profileFromUser(user), [user]);

  const saveProfile = useCallback(
    (nextProfile: UserProfile) => {
      void upsertProfile({
        bodyStats: nextProfile.bodyStats,
        goal: nextProfile.goal,
        targets: nextProfile.targets,
      }).catch(reportProfileSaveError);
    },
    [upsertProfile],
  );

  const setBodyStats = useCallback(
    (bodyStats: BodyStats) => {
      saveProfile(recalcProfileTargets({ ...profile, bodyStats }));
    },
    [profile, saveProfile],
  );

  const setGoal = useCallback(
    (goal: WeightGoal) => {
      saveProfile(recalcProfileTargets({ ...profile, goal }));
    },
    [profile, saveProfile],
  );

  const setTarget = useCallback(
    (key: keyof UserTargets, value: number) => {
      saveProfile({
        ...profile,
        targets: {
          ...profile.targets,
          [key]: { value, isOverride: true },
        },
      });
    },
    [profile, saveProfile],
  );

  const resetTargetsToAuto = useCallback(() => {
    saveProfile(
      recalcProfileTargets({
        ...profile,
        targets: {
          calories: { ...profile.targets.calories, isOverride: false },
          proteinG: { ...profile.targets.proteinG, isOverride: false },
          carbsG: { ...profile.targets.carbsG, isOverride: false },
          fatG: { ...profile.targets.fatG, isOverride: false },
        },
      }),
    );
  }, [profile, saveProfile]);

  return {
    user,
    isLoading: user === undefined,
    profile,
    bodyStats: profile.bodyStats,
    goal: profile.goal,
    targets: profile.targets,
    dailyTargets: dailyTargetsFromProfile(profile),
    autoTargets: autoTargetsForProfile(profile),
    setBodyStats,
    setGoal,
    setTarget,
    resetTargetsToAuto,
  };
};
