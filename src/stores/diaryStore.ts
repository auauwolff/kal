import { create } from 'zustand';
import { todayISO } from '@/lib/date';

const shift = (iso: string, days: number) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
    set((s) => ({ selectedDate: shift(s.selectedDate, -1) })),
  goNextDay: () =>
    set((s) => {
      const today = todayISO();
      if (s.selectedDate >= today) return s;
      return { selectedDate: shift(s.selectedDate, 1) };
    }),
  goToday: () => set({ selectedDate: todayISO() }),
}));

export const getTodayISO = todayISO;

export const formatDayLabel = (iso: string) => {
  const today = todayISO();
  const yesterday = shift(today, -1);
  if (iso === today) return 'Today';
  if (iso === yesterday) return 'Yesterday';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};
