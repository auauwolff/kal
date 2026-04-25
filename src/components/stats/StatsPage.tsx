import { useState } from 'react';
import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { WeightTrendCard } from '@/components/stats/WeightTrendCard';
import { CalorieIntakeCard } from '@/components/stats/CalorieIntakeCard';
import { MacroSplitCard } from '@/components/stats/MacroSplitCard';
import { StreakHeatmapCard } from '@/components/stats/StreakHeatmapCard';
import { ExerciseConsistencyCard } from '@/components/stats/ExerciseConsistencyCard';
import type { StatsRange } from '@/lib/mockStats';

export const StatsPage = () => {
  const [range, setRange] = useState<StatsRange>(30);

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

        <WeightTrendCard range={range} />
        <CalorieIntakeCard range={range} />
        <MacroSplitCard range={range} />
        <StreakHeatmapCard range={range} />
        <ExerciseConsistencyCard range={range} />

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: 'center', mt: 1 }}
        >
          Data is mock until the Convex schema + real queries land in the next task.
        </Typography>
      </Stack>
    </Box>
  );
};
