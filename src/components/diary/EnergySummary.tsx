import { Box, Stack, Typography, useTheme } from '@mui/material';
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

  const macroBarSegments = [
    {
      label: 'P',
      value: totals.proteinG,
      target: targets.proteinG,
      color: theme.palette.success.main,
    },
    {
      label: 'C',
      value: totals.carbsG,
      target: targets.carbsG,
      color: theme.palette.warning.main,
    },
    {
      label: 'F',
      value: totals.fatG,
      target: targets.fatG,
      color: theme.palette.secondary.main,
    },
  ];

  return (
    <Stack sx={{ gap: 1 }}>
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

      <Stack direction="row" sx={{ gap: 1, width: '100%' }}>
        {macroBarSegments.map((seg) => {
          const pctBar = seg.target > 0 ? Math.min(seg.value / seg.target, 1.2) : 0;
          return (
            <Stack key={seg.label} sx={{ flex: 1, gap: 0.25 }}>
              <Box
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'divider',
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    width: `${Math.min(pctBar * 100, 100)}%`,
                    height: '100%',
                    bgcolor: seg.color,
                    transition: 'width 0.4s ease',
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                {seg.label} {Math.round(seg.value)}/{Math.round(seg.target)} g
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
};
