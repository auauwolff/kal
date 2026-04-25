import { useMemo } from 'react';
import { useDiaryStore } from '@/stores/diaryStore';
import { getMockDiary } from '@/lib/mockDiary';

export const useDiary = () => {
  const selectedDate = useDiaryStore((s) => s.selectedDate);
  return useMemo(() => getMockDiary(selectedDate), [selectedDate]);
};
