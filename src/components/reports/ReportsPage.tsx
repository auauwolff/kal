import { useState } from 'react';
import {
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { WeightTrendCard } from '@/components/reports/WeightTrendCard';
import { CalorieIntakeCard } from '@/components/reports/CalorieIntakeCard';
import { MacroSplitCard } from '@/components/reports/MacroSplitCard';
import { StreakHeatmapCard } from '@/components/reports/StreakHeatmapCard';
import { ExerciseConsistencyCard } from '@/components/reports/ExerciseConsistencyCard';
import type { ReportRange } from '@/lib/mockReports';

export const ReportsPage = () => {
  const [range, setRange] = useState<ReportRange>(30);

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', width: '100%', p: { xs: 2, sm: 3 } }}>
      <Stack sx={{ gap: 2 }}>
        <Stack direction="row" sx={{ justifyContent: 'center' }}>
          <ToggleButtonGroup
            value={range}
            exclusive
            size="small"
            onChange={(_, v: ReportRange | null) => v && setRange(v)}
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
