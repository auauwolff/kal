import { Card, CardContent, Stack, Typography, useTheme } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { getMockCalories, type ReportRange } from '@/lib/mockReports';

interface CalorieIntakeCardProps {
  range: ReportRange;
}

export const CalorieIntakeCard = ({ range }: CalorieIntakeCardProps) => {
  const theme = useTheme();
  const data = getMockCalories(range);
  const dates = data.map((d) => d.date);
  const calories = data.map((d) => d.calories);
  const target = data[0]?.target ?? 2600;
  const avg = Math.round(calories.reduce((a, b) => a + b, 0) / calories.length);

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
        data: calories.map((v) => ({
          value: v,
          itemStyle: {
            color:
              Math.abs(v - target) / target <= 0.1
                ? theme.palette.success.main
                : v > target
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
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack
          direction="row"
          sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Calorie intake
          </Typography>
          <Typography variant="caption" color="text.secondary">
            avg {avg} / target {target} kcal
          </Typography>
        </Stack>
        <ReactECharts option={option} style={{ height: 200 }} />
      </CardContent>
    </Card>
  );
};
