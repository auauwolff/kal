import { useShallow } from 'zustand/react/shallow';
import { useDiaryStore } from '@/stores/diaryStore';
import { selectDailyTargets, useUserStore } from '@/stores/userStore';

export const useDiary = () => {
  const selectedDate = useDiaryStore((s) => s.selectedDate);
  const day = useDiaryStore((s) => s.days[selectedDate]);
  const targets = useUserStore(useShallow(selectDailyTargets));
  const addEntry = useDiaryStore((s) => s.addEntry);
  const moveEntry = useDiaryStore((s) => s.moveEntry);
  const deleteEntry = useDiaryStore((s) => s.deleteEntry);
  return { ...day, targets, addEntry, moveEntry, deleteEntry };
};
