import { Card, CardContent, Stack, Typography, useTheme } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { getMockWeights, type StatsRange } from '@/lib/mockStats';

interface WeightTrendCardProps {
  range: StatsRange;
}

const rollingMean = (values: number[], window: number) =>
  values.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });

export const WeightTrendCard = ({ range }: WeightTrendCardProps) => {
  const theme = useTheme();
  const data = getMockWeights(range);
  const dates = data.map((d) => d.date);
  const weights = data.map((d) => d.weightKg);
  const trend = rollingMean(weights, 7).map((v) => Math.round(v * 10) / 10);

  const latest = weights[weights.length - 1];
  const weekAgo = weights[Math.max(0, weights.length - 8)];
  const delta = Math.round((latest - weekAgo) * 10) / 10;

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
            {latest.toFixed(1)} kg · {delta >= 0 ? '+' : ''}
            {delta.toFixed(1)} kg / 7d
          </Typography>
        </Stack>
        <ReactECharts option={option} style={{ height: 200 }} />
      </CardContent>
    </Card>
  );
};
