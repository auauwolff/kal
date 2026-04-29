import { Card, CardContent, Stack, Typography, useTheme } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { useStatsData } from '@/hooks/useStatsData';
import { average } from './statsUtils';

export const CalorieIntakeCard = () => {
  const theme = useTheme();
  const stats = useStatsData();
  const data = stats?.days ?? [];
  const dates = data.map((d) => d.date);
  const calories = data.map((d) => d.calories);
  const target = data[0]?.targetCalories ?? 2600;
  const avg = average(calories);
  const prevAvg = stats?.prevPeriodAverages?.calories ?? null;
  const rangeDays = stats?.rangeDays ?? 7;
  const prevDelta = prevAvg !== null ? avg - prevAvg : null;

  const option = {
    grid: { top: 20, right: 12, bottom: 24, left: 48 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        color: theme.palette.text.secondary,
        formatter: (v: string) => v.slice(5),
        interval: Math.max(0, Math.floor(dates.length / 6) - 1),
      },
      axisLine: { lineStyle: { color: theme.palette.divider } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: theme.palette.text.secondary },
      splitLine: { lineStyle: { color: theme.palette.divider } },
    },
    series: [
      {
        name: 'Calories',
        type: 'bar',
        data: calories.map((value) => ({
          value,
          itemStyle: {
            color:
              target > 0 && Math.abs(value - target) / target <= 0.1
                ? theme.palette.success.main
                : value > target
                  ? theme.palette.warning.main
                  : theme.palette.info.main,
            borderRadius: [4, 4, 0, 0],
          },
        })),
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: theme.palette.text.secondary, type: 'dashed' },
          data: [{ yAxis: target, name: 'Target' }],
        },
      },
    ],
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Calorie intake
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {!stats
              ? 'Loading…'
              : prevDelta === null
                ? `avg ${avg} / target ${target} kcal`
                : `avg ${avg} / target ${target} kcal · ${prevDelta === 0 ? 'flat' : `${prevDelta > 0 ? '↑' : '↓'} ${Math.abs(prevDelta)}`} vs prev ${rangeDays}d`}
          </Typography>
        </Stack>
        <ReactECharts option={option} style={{ height: 200 }} />
      </CardContent>
    </Card>
  );
};
