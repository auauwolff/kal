import { Card, CardContent, Stack, Typography, useTheme } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { getMockStreaks, type ReportRange } from '@/lib/mockReports';

interface StreakHeatmapCardProps {
  range: ReportRange;
}

export const StreakHeatmapCard = ({ range }: StreakHeatmapCardProps) => {
  const theme = useTheme();
  const data = getMockStreaks(range);
  const hits = data.filter((d) => d.status >= 2).length;

  const start = data[0]?.date ?? '';
  const end = data[data.length - 1]?.date ?? '';

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
      data: data.map((d) => [d.date, d.status]),
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
            {hits} / {data.length} days on target
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
