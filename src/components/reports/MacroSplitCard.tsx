import { Card, CardContent, Stack, Typography, useTheme } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { getMockMacros, type ReportRange } from '@/lib/mockReports';

interface MacroSplitCardProps {
  range: ReportRange;
}

export const MacroSplitCard = ({ range }: MacroSplitCardProps) => {
  const theme = useTheme();
  const data = getMockMacros(range);
  const dates = data.map((d) => d.date);

  // Convert to kcal for honest stacked comparison (4/4/9 rule).
  const proteinKcal = data.map((d) => d.proteinG * 4);
  const carbsKcal = data.map((d) => d.carbsG * 4);
  const fatKcal = data.map((d) => d.fatG * 9);

  const option = {
    grid: { top: 30, right: 12, bottom: 24, left: 48 },
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      textStyle: { color: theme.palette.text.secondary, fontSize: 11 },
      icon: 'circle',
    },
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
      axisLabel: {
        color: theme.palette.text.secondary,
        formatter: '{value}',
      },
      splitLine: { lineStyle: { color: theme.palette.divider } },
    },
    series: [
      {
        name: 'Protein',
        type: 'line',
        stack: 'macros',
        smooth: true,
        symbol: 'none',
        areaStyle: { opacity: 0.6, color: theme.palette.success.main },
        lineStyle: { width: 0 },
        data: proteinKcal,
      },
      {
        name: 'Carbs',
        type: 'line',
        stack: 'macros',
        smooth: true,
        symbol: 'none',
        areaStyle: { opacity: 0.6, color: theme.palette.warning.main },
        lineStyle: { width: 0 },
        data: carbsKcal,
      },
      {
        name: 'Fat',
        type: 'line',
        stack: 'macros',
        smooth: true,
        symbol: 'none',
        areaStyle: { opacity: 0.6, color: theme.palette.secondary.main },
        lineStyle: { width: 0 },
        data: fatKcal,
      },
    ],
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack sx={{ mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Macro split
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Stacked kcal from protein / carbs / fat per day
          </Typography>
        </Stack>
        <ReactECharts option={option} style={{ height: 220 }} />
      </CardContent>
    </Card>
  );
};
