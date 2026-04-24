import { create } from 'zustand';

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

interface DiaryStore {
  selectedDate: string;
  setDate: (iso: string) => void;
  goPrevDay: () => void;
  goNextDay: () => void;
  goToday: () => void;
}

export const useDiaryStore = create<DiaryStore>()((set) => ({
  selectedDate: toISO(new Date()),
  setDate: (iso) => set({ selectedDate: iso }),
  goPrevDay: () => set((s) => ({ selectedDate: shift(s.selectedDate, -1) })),
  goNextDay: () => set((s) => ({ selectedDate: shift(s.selectedDate, 1) })),
  goToday: () => set({ selectedDate: toISO(new Date()) }),
}));

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
