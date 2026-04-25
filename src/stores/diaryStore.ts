import { create } from 'zustand';
import { formatDayLabel, shiftISODate, todayISO } from '@/lib/date';

interface DiaryStore {
  selectedDate: string;
  setDate: (iso: string) => void;
  goPrevDay: () => void;
  goNextDay: () => void;
  goToday: () => void;
}

export const useDiaryStore = create<DiaryStore>()((set) => ({
  selectedDate: todayISO(),
  setDate: (iso) => set({ selectedDate: iso }),
  goPrevDay: () =>
    set((s) => ({ selectedDate: shiftISODate(s.selectedDate, -1) })),
  goNextDay: () =>
    set((s) => {
      const today = todayISO();
      if (s.selectedDate >= today) return s;
      return { selectedDate: shiftISODate(s.selectedDate, 1) };
    }),
  goToday: () => set({ selectedDate: todayISO() }),
}));

export const getTodayISO = todayISO;
export { formatDayLabel };
