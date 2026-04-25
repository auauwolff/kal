import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { StatsData } from '@/components/stats/types';
import { useStatsStore } from '@/stores/statsStore';

export const useStatsData = (): StatsData | undefined => {
  const range = useStatsStore((s) => s.range);
  return useQuery(api.stats.getRange, { days: range }) as StatsData | undefined;
};
