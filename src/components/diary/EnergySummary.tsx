import { Box, Typography, useTheme } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import type { DailyTargets, DailyTotals } from '@/types/diary';

interface EnergySummaryProps {
  totals: DailyTotals;
  targets: DailyTargets;
}

export const EnergySummary = ({ totals, targets }: EnergySummaryProps) => {
  const theme = useTheme();

  const consumed = totals.calories;
  const target = targets.calories;
  const pct = target > 0 ? consumed / target : 0;
  const remaining = Math.max(target - consumed, 0);
  const overBy = Math.max(consumed - target, 0);

  const zoneColor =
    pct < 0.9
      ? theme.palette.info.main
      : pct <= 1.1
        ? theme.palette.success.main
        : pct <= 1.2
          ? theme.palette.warning.main
          : theme.palette.error.main;

  const option = {
    series: [
      {
        type: 'gauge',
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: Math.max(target, consumed) * 1.1,
        splitNumber: 6,
        radius: '95%',
        progress: {
          show: true,
          width: 14,
          itemStyle: { color: zoneColor },
        },
        axisLine: {
          lineStyle: {
            width: 14,
            color: [[1, theme.palette.divider]],
          },
        },
        pointer: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        anchor: { show: false },
        title: { show: false },
        detail: {
          offsetCenter: [0, '-10%'],
          fontSize: 28,
          fontWeight: 700,
          color: theme.palette.text.primary,
          formatter: () => String(Math.round(consumed)),
        },
        data: [{ value: consumed }],
      },
    ],
  };

  return (
    <Box sx={{ position: 'relative', height: 180 }}>
      <ReactECharts option={option} style={{ height: '100%', width: '100%' }} />
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 8,
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {overBy > 0
            ? `${Math.round(overBy)} kcal over target`
            : `${Math.round(remaining)} kcal remaining of ${target}`}
        </Typography>
      </Box>
    </Box>
  );
};
