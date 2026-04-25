import { Card, CardContent, Stack, Typography, useTheme } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { EXERCISE_LABELS, type ExerciseType } from '@/components/diary/types';
import { useStatsData } from '@/hooks/useStatsData';
import { EXERCISE_STACK_TYPES, totalExerciseMinutes } from './statsUtils';

export const ExerciseConsistencyCard = () => {
  const theme = useTheme();
  const stats = useStatsData();
  const data = stats?.exerciseWeeks ?? [];
  const weekLabels = data.map((week) => week.weekLabel);
  const totalMin = totalExerciseMinutes(data);

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
    series: EXERCISE_STACK_TYPES.map((type) => ({
      name: EXERCISE_LABELS[type],
      type: 'bar',
      stack: 'total',
      itemStyle: { color: colors[type] },
      data: data.map((week) => week.minutes[type]),
      barMaxWidth: 28,
    })),
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Exercise consistency
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {stats ? `${totalMin} min across ${data.length} weeks` : 'Loading…'}
          </Typography>
        </Stack>
        <ReactECharts option={option} style={{ height: 220 }} />
      </CardContent>
    </Card>
  );
};
