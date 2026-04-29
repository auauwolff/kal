import { Card, CardContent, Stack, Typography, useTheme } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { useStatsData } from '@/hooks/useStatsData';
import { useStatsStore } from '@/stores/statsStore';
import { shiftISODate, todayISO } from '@/lib/date';

export const StreakHeatmapCard = () => {
  const theme = useTheme();
  const range = useStatsStore((s) => s.range);
  const stats = useStatsData();
  const data = stats?.days ?? [];
  const hits = data.filter((d) => d.streakStatus >= 2).length;
  const longestStreak = stats?.longestStreak ?? 0;

  const end = data[data.length - 1]?.date ?? todayISO();
  const start = data[0]?.date ?? shiftISODate(end, -(range - 1));

  const option = {
    tooltip: {
      position: 'top',
      formatter: (params: { value: [string, number] }) => {
        const statusLabel = ['Miss', 'Logged', 'Target hit', 'Perfect'][
          params.value[1]
        ];
        return `${params.value[0]}<br/><b>${statusLabel}</b>`;
      },
    },
    visualMap: {
      show: false,
      min: 0,
      max: 3,
      inRange: {
        color: [
          theme.palette.divider,
          theme.palette.info.light,
          theme.palette.success.main,
          theme.palette.primary.main,
        ],
      },
    },
    calendar: {
      top: 20,
      left: 30,
      right: 10,
      cellSize: ['auto', 14],
      range: [start, end],
      dayLabel: {
        color: theme.palette.text.secondary,
        firstDay: 1,
        nameMap: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      },
      monthLabel: { color: theme.palette.text.secondary },
      yearLabel: { show: false },
      itemStyle: {
        color: 'transparent',
        borderWidth: 2,
        borderColor: theme.palette.background.paper,
      },
      splitLine: { show: false },
    },
    series: {
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: data.map((d) => [d.date, d.streakStatus]),
    },
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Streak history
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {!stats
              ? 'Loading…'
              : `${hits} / ${data.length} days on target${longestStreak > 0 ? ` · best ${longestStreak}d` : ''}`}
          </Typography>
        </Stack>
        <ReactECharts
          option={option}
          style={{ height: range <= 7 ? 120 : range <= 30 ? 150 : 200 }}
        />
      </CardContent>
    </Card>
  );
};
