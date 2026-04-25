import { create } from 'zustand';
import type { StatsRange } from '@/components/stats/types';

interface StatsStore {
  range: StatsRange;
  setRange: (range: StatsRange) => void;
}

export const useStatsStore = create<StatsStore>()((set) => ({
  range: 30,
  setRange: (range) => set({ range }),
}));
