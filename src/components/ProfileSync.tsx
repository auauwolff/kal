import { useEffect, useMemo, useRef } from 'react';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { useShallow } from 'zustand/react/shallow';
import { api } from '../../convex/_generated/api';
import type { Doc } from '../../convex/_generated/dataModel';
import type { UserProfile } from '@/lib/userTypes';
import { useUserStore } from '@/stores/userStore';

const profileFromUser = (user: Doc<'users'> | null | undefined): UserProfile | null => {
  if (!user || !user.bodyStats || !user.goal) return null;
  return {
    bodyStats: user.bodyStats,
    goal: user.goal,
    targets: user.targets,
  };
};

export const ProfileSync = () => {
  const { isAuthenticated } = useConvexAuth();
  const serverUser = useQuery(api.users.get, isAuthenticated ? {} : 'skip');
  const upsertProfile = useMutation(api.users.upsertProfile);
  const hydrateProfile = useUserStore((s) => s.hydrateProfile);
  const localProfile = useUserStore(
    useShallow((s) => ({
      bodyStats: s.bodyStats,
      goal: s.goal,
      targets: s.targets,
    })),
  );

  const serverProfile = useMemo(() => profileFromUser(serverUser), [serverUser]);
  const localProfileJson = useMemo(
    () => JSON.stringify(localProfile),
    [localProfile],
  );
  const serverProfileJson = useMemo(
    () => (serverProfile ? JSON.stringify(serverProfile) : null),
    [serverProfile],
  );
  const lastPushedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !serverProfile) return;
    if (localProfile.bodyStats || localProfile.goal) return;
    hydrateProfile(serverProfile);
  }, [hydrateProfile, isAuthenticated, localProfile, serverProfile]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const bodyStats = localProfile.bodyStats;
    const goal = localProfile.goal;
    if (!bodyStats || !goal) return;

    if (serverProfileJson === localProfileJson) {
      lastPushedRef.current = localProfileJson;
      return;
    }
    if (lastPushedRef.current === localProfileJson) return;

    lastPushedRef.current = localProfileJson;
    void upsertProfile({
      bodyStats,
      goal,
      targets: localProfile.targets,
    }).catch((error: unknown) => {
      lastPushedRef.current = null;
      console.error('Failed to sync profile to Convex', error);
    });
  }, [isAuthenticated, localProfile, localProfileJson, serverProfileJson, upsertProfile]);

  return null;
};
