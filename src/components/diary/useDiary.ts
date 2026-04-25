import { useDiaryStore } from '@/stores/diaryStore';

export const useDiary = () => {
  const selectedDate = useDiaryStore((s) => s.selectedDate);
  const day = useDiaryStore((s) => s.days[selectedDate]);
  const addEntry = useDiaryStore((s) => s.addEntry);
  const moveEntry = useDiaryStore((s) => s.moveEntry);
  const deleteEntry = useDiaryStore((s) => s.deleteEntry);
  return { ...day, addEntry, moveEntry, deleteEntry };
};
