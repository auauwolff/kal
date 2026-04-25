import { Card, CardContent, Stack, Typography, useTheme } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { useStatsData } from '@/hooks/useStatsData';
import { rollingMean } from './statsUtils';

export const WeightTrendCard = () => {
  const theme = useTheme();
  const stats = useStatsData();
  const data = stats?.weights ?? [];
  const dates = data.map((d) => d.date);
  const weights = data.map((d) => d.weightKg);
  const trend = rollingMean(weights, 7).map((v) => Math.round(v * 10) / 10);

  const latest = weights[weights.length - 1];
  const weekAgo = weights[Math.max(0, weights.length - 8)];
  const delta =
    latest === undefined || weekAgo === undefined
      ? null
      : Math.round((latest - weekAgo) * 10) / 10;

  const option = {
    grid: { top: 20, right: 12, bottom: 24, left: 40 },
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
      scale: true,
      axisLabel: { color: theme.palette.text.secondary },
      splitLine: { lineStyle: { color: theme.palette.divider } },
    },
    series: [
      {
        name: 'Weight',
        type: 'line',
        data: weights,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { color: theme.palette.info.main, width: 1.5 },
        itemStyle: { color: theme.palette.info.main },
      },
      {
        name: '7-day trend',
        type: 'line',
        data: trend,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: theme.palette.primary.main, width: 2.5 },
      },
    ],
  };

  const subtitle = !stats
    ? 'Loading…'
    : latest === undefined || delta === null
      ? 'No weights logged yet'
      : `${latest.toFixed(1)} kg · ${delta >= 0 ? '+' : ''}${delta.toFixed(1)} kg / 7d`;

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Weight
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        </Stack>
        <ReactECharts option={option} style={{ height: 200 }} />
      </CardContent>
    </Card>
  );
};
