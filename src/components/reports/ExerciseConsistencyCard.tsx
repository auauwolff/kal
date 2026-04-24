import { Card, CardContent, Stack, Typography, useTheme } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { getMockExercise, type ReportRange } from '@/lib/mockReports';
import { EXERCISE_LABELS, type ExerciseType } from '@/types/diary';

interface ExerciseConsistencyCardProps {
  range: ReportRange;
}

const TYPES: ExerciseType[] = ['strength', 'cardio', 'sports', 'walk', 'other'];

export const ExerciseConsistencyCard = ({ range }: ExerciseConsistencyCardProps) => {
  const theme = useTheme();
  const data = getMockExercise(range);
  const weekLabels = data.map((w) => w.weekLabel);
  const totalMin = data.reduce(
    (acc, w) =>
      acc +
      TYPES.reduce((inner, t) => inner + w.minutes[t], 0),
    0,
  );

  const colors: Record<ExerciseType, string> = {
    strength: theme.palette.primary.main,
    cardio: theme.palette.info.main,
    sports: theme.palette.warning.main,
    walk: theme.palette.success.main,
    other: theme.palette.secondary.main,
  };

  const option = {
    grid: { top: 30, right: 12, bottom: 24, left: 40 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      top: 0,
      icon: 'circle',
      textStyle: { color: theme.palette.text.secondary, fontSize: 11 },
    },
    xAxis: {
      type: 'category',
      data: weekLabels,
      axisLabel: { color: theme.palette.text.secondary },
      axisLine: { lineStyle: { color: theme.palette.divider } },
    },
    yAxis: {
      type: 'value',
      name: 'min',
      nameTextStyle: { color: theme.palette.text.secondary },
      axisLabel: { color: theme.palette.text.secondary },
      splitLine: { lineStyle: { color: theme.palette.divider } },
    },
    series: TYPES.map((type) => ({
      name: EXERCISE_LABELS[type],
      type: 'bar',
      stack: 'total',
      itemStyle: { color: colors[type] },
      data: data.map((w) => w.minutes[type]),
      barMaxWidth: 28,
    })),
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack
          direction="row"
          sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Exercise consistency
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {totalMin} min across {data.length} weeks
          </Typography>
        </Stack>
        <ReactECharts option={option} style={{ height: 220 }} />
      </CardContent>
    </Card>
  );
};
