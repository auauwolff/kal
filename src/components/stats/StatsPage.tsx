import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { WeightTrendCard } from '@/components/stats/WeightTrendCard';
import { CalorieIntakeCard } from '@/components/stats/CalorieIntakeCard';
import { MacroSplitCard } from '@/components/stats/MacroSplitCard';
import { StreakHeatmapCard } from '@/components/stats/StreakHeatmapCard';
import { ExerciseConsistencyCard } from '@/components/stats/ExerciseConsistencyCard';
import type { StatsRange } from '@/components/stats/types';
import { useStatsStore } from '@/stores/statsStore';

export const StatsPage = () => {
  const range = useStatsStore((s) => s.range);
  const setRange = useStatsStore((s) => s.setRange);

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', width: '100%', p: { xs: 2, sm: 3 } }}>
      <Stack sx={{ gap: 2 }}>
        <Stack direction="row" sx={{ justifyContent: 'center' }}>
          <ToggleButtonGroup
            value={range}
            exclusive
            size="small"
            onChange={(_, v: StatsRange | null) => v && setRange(v)}
          >
            <ToggleButton value={7}>7d</ToggleButton>
            <ToggleButton value={30}>30d</ToggleButton>
            <ToggleButton value={90}>90d</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <WeightTrendCard />
        <CalorieIntakeCard />
        <MacroSplitCard />
        <StreakHeatmapCard />
        <ExerciseConsistencyCard />
      </Stack>
    </Box>
  );
};
