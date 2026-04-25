import { Box, Stack } from '@mui/material';
import { DiaryDateHeader } from '@/components/diary/DiaryDateHeader';
import { DiarySummaryCard } from '@/components/diary/DiarySummaryCard';
import { MealSection } from '@/components/diary/MealSection';
import { ExerciseSection } from '@/components/diary/ExerciseSection';
import { MEAL_TYPES } from './types';

export const DiaryPage = () => (
  <Box sx={{ maxWidth: 720, mx: 'auto', width: '100%', p: { xs: 2, sm: 3 } }}>
    <Stack sx={{ gap: 2 }}>
      <DiaryDateHeader />
      <DiarySummaryCard />
      {MEAL_TYPES.map((mealType) => (
        <MealSection key={mealType} mealType={mealType} />
      ))}
      <ExerciseSection />
    </Stack>
  </Box>
);
