import { useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  LocalFireDepartment,
} from '@mui/icons-material';
import { formatDayLabel, getTodayISO, useDiaryStore } from '@/stores/diaryStore';
import { getMockDiary } from '@/lib/mockDiary';
import { EnergySummary } from '@/components/diary/EnergySummary';
import { MacroRings } from '@/components/diary/MacroRings';
import { MealSection } from '@/components/diary/MealSection';
import { ExerciseSection } from '@/components/diary/ExerciseSection';
import { DayActions } from '@/components/diary/DayActions';
import { MEAL_TYPES } from '@/types/diary';

export const DiaryPage = () => {
  const { selectedDate, goPrevDay, goNextDay, goToday } = useDiaryStore();
  const diary = useMemo(() => getMockDiary(selectedDate), [selectedDate]);

  const isToday = selectedDate === getTodayISO();
  const isFuture = selectedDate > getTodayISO();

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', width: '100%', p: { xs: 2, sm: 3 } }}>
      <Stack sx={{ gap: 2 }}>
        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <IconButton onClick={goPrevDay} size="small">
            <ChevronLeft />
          </IconButton>
          <Tooltip title={isToday ? '' : 'Jump to today'}>
            <Button
              variant="text"
              onClick={goToday}
              sx={{ fontWeight: 700, fontSize: 16, textTransform: 'none' }}
            >
              {formatDayLabel(selectedDate)}
            </Button>
          </Tooltip>
          <IconButton onClick={goNextDay} size="small" disabled={isFuture}>
            <ChevronRight />
          </IconButton>
        </Stack>

        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Chip
            icon={<LocalFireDepartment />}
            label="0-day streak"
            size="small"
            color="warning"
            variant="outlined"
          />
          <Chip
            label="1 grace day"
            size="small"
            variant="outlined"
            sx={{ color: 'text.secondary' }}
          />
        </Stack>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack sx={{ gap: 2 }}>
              <EnergySummary totals={diary.totals} targets={diary.targets} />
              <MacroRings totals={diary.totals} targets={diary.targets} />
            </Stack>
          </CardContent>
        </Card>

        {MEAL_TYPES.map((mealType) => (
          <MealSection
            key={mealType}
            mealType={mealType}
            entries={diary.meals[mealType]}
          />
        ))}

        <ExerciseSection entries={diary.exercise} />

        <DayActions />
      </Stack>
    </Box>
  );
};
