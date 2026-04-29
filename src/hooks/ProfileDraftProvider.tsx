import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type {
  BodyStats,
  UserProfile,
  UserTargets,
  WeightGoal,
} from '@/lib/userTypes';
import {
  autoTargetsForProfile,
  profileFromUser,
  recalcProfileTargets,
} from '@/lib/profile';
import { ProfileDraftContext, type ProfileDraftValue } from './useProfileDraft';

const profileKey = (p: UserProfile): string => JSON.stringify(p);

export const ProfileDraftProvider = ({ children }: { children: ReactNode }) => {
  const user = useQuery(api.users.get, {});
  const upsertProfile = useMutation(api.users.upsertProfile);
  const saved = useMemo(() => profileFromUser(user), [user]);

  const [draft, setDraft] = useState<UserProfile>(saved);
  // The saved-key the draft is checkpointed against. When draft equals base,
  // isDirty=false.
  const [draftBaseKey, setDraftBaseKey] = useState<string>(profileKey(saved));
  // Last savedKey we observed, so we resync only on actual change in saved
  // rather than every divergence from base. Prevents a post-save flicker where
  // the new base briefly differs from the still-stale Convex query result.
  const [lastSavedKey, setLastSavedKey] = useState<string>(profileKey(saved));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<Error | null>(null);

  const draftKey = profileKey(draft);
  const savedKey = profileKey(saved);
  const isDirty = draftKey !== draftBaseKey;

  // Resync from Convex when saved changes from outside (multi-tab edit, post-save
  // push) AND the user has no local edits. If the user is mid-edit, keep their
  // typing — see useFormDraft for the same "adjust state during render" pattern.
  if (savedKey !== lastSavedKey) {
    setLastSavedKey(savedKey);
    if (!isDirty) {
      setDraft(saved);
      setDraftBaseKey(savedKey);
    }
  }

  const setBodyStats = useCallback((bodyStats: BodyStats) => {
    setDraft((prev) => recalcProfileTargets({ ...prev, bodyStats }));
  }, []);

  const setGoal = useCallback((goal: WeightGoal) => {
    setDraft((prev) => recalcProfileTargets({ ...prev, goal }));
  }, []);

  const setTarget = useCallback(
    (key: keyof UserTargets, value: number) => {
      setDraft((prev) => ({
        ...prev,
        targets: {
          ...prev.targets,
          [key]: { value, isOverride: true },
        },
      }));
    },
    [],
  );

  const resetTargetsToAuto = useCallback(() => {
    setDraft((prev) =>
      recalcProfileTargets({
        ...prev,
        targets: {
          calories: { ...prev.targets.calories, isOverride: false },
          proteinG: { ...prev.targets.proteinG, isOverride: false },
          carbsG: { ...prev.targets.carbsG, isOverride: false },
          fatG: { ...prev.targets.fatG, isOverride: false },
        },
      }),
    );
  }, []);

  const save = useCallback(() => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(null);
    const sentDraft = draft;
    const sentKey = profileKey(sentDraft);
    upsertProfile({
      bodyStats: sentDraft.bodyStats,
      goal: sentDraft.goal,
      targets: sentDraft.targets,
    })
      .then(() => {
        // Bump the base so the page goes back to clean. If the user typed more
        // between dispatch and resolve, draft != sentKey so isDirty stays true
        // against the new base — exactly what we want.
        setDraftBaseKey(sentKey);
      })
      .catch((err: unknown) => {
        setSaveError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        setIsSaving(false);
      });
  }, [draft, isSaving, upsertProfile]);

  const discard = useCallback(() => {
    setDraft(saved);
    setDraftBaseKey(savedKey);
    setSaveError(null);
  }, [saved, savedKey]);

  const value: ProfileDraftValue = useMemo(
    () => ({
      bodyStats: draft.bodyStats,
      goal: draft.goal,
      targets: draft.targets,
      autoTargets: autoTargetsForProfile(draft),
      setBodyStats,
      setGoal,
      setTarget,
      resetTargetsToAuto,
      isDirty,
      isSaving,
      saveError,
      save,
      discard,
    }),
    [
      draft,
      setBodyStats,
      setGoal,
      setTarget,
      resetTargetsToAuto,
      isDirty,
      isSaving,
      saveError,
      save,
      discard,
    ],
  );

  return (
    <ProfileDraftContext.Provider value={value}>
      {children}
    </ProfileDraftContext.Provider>
  );
};
