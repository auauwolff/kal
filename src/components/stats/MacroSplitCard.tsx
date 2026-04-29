import { Card, CardContent, Stack, Typography, useTheme, type Theme } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { useStatsData } from '@/hooks/useStatsData';
import { average } from './statsUtils';

const TOLERANCE = 0.1;
const ROW_HEIGHT = 56;
const ROW_GAP = 28;

type MacroKey = 'protein' | 'carbs' | 'fat';

interface MacroRow {
  key: MacroKey;
  label: string;
  values: number[];
  target: number;
  avg: number;
  prevAvg: number | null;
  baseColor: string;
}

const formatDelta = (delta: number): string => {
  const rounded = Math.round(delta);
  if (rounded === 0) return 'flat vs prev';
  return `${rounded > 0 ? '↑' : '↓'} ${Math.abs(rounded)} g vs prev`;
};

const colorBar = (value: number, target: number, baseColor: string, theme: Theme): string => {
  if (target <= 0) return baseColor;
  const ratio = Math.abs(value - target) / target;
  if (ratio <= TOLERANCE) return theme.palette.success.main;
  if (value > target) return theme.palette.warning.main;
  return theme.palette.info.light;
};

export const MacroSplitCard = () => {
  const theme = useTheme();
  const stats = useStatsData();
  const data = stats?.days ?? [];
  const dates = data.map((d) => d.date);
  const prev = stats?.prevPeriodAverages ?? null;

  const rows: MacroRow[] = [
    {
      key: 'protein',
      label: 'Protein',
      values: data.map((d) => Math.round(d.proteinG)),
      target: data[0]?.targetProteinG ?? 0,
      avg: 0,
      prevAvg: prev?.proteinG ?? null,
      baseColor: theme.palette.success.main,
    },
    {
      key: 'carbs',
      label: 'Carbs',
      values: data.map((d) => Math.round(d.carbsG)),
      target: data[0]?.targetCarbsG ?? 0,
      avg: 0,
      prevAvg: prev?.carbsG ?? null,
      baseColor: theme.palette.warning.main,
    },
    {
      key: 'fat',
      label: 'Fat',
      values: data.map((d) => Math.round(d.fatG)),
      target: data[0]?.targetFatG ?? 0,
      avg: 0,
      prevAvg: prev?.fatG ?? null,
      baseColor: theme.palette.secondary.main,
    },
  ].map((row) => ({ ...row, avg: average(row.values) }));

  const grids = rows.map((_, i) => ({
    left: 56,
    right: 12,
    top: 24 + i * (ROW_HEIGHT + ROW_GAP),
    height: ROW_HEIGHT,
  }));

  const xAxes = rows.map((_, i) => ({
    type: 'category' as const,
    gridIndex: i,
    data: dates,
    axisLabel: {
      show: i === rows.length - 1,
      color: theme.palette.text.secondary,
      formatter: (v: string) => v.slice(5),
      interval: Math.max(0, Math.floor(dates.length / 6) - 1),
      fontSize: 10,
    },
    axisTick: { show: false },
    axisLine: { lineStyle: { color: theme.palette.divider } },
  }));

  const yAxes = rows.map((row, i) => ({
    type: 'value' as const,
    gridIndex: i,
    name: row.label,
    nameLocation: 'middle' as const,
    nameGap: 38,
    nameTextStyle: { color: theme.palette.text.primary, fontSize: 11, fontWeight: 600 },
    axisLabel: { color: theme.palette.text.secondary, fontSize: 9 },
    splitLine: { lineStyle: { color: theme.palette.divider } },
    splitNumber: 2,
  }));

  const series = rows.map((row, i) => ({
    name: row.label,
    type: 'bar' as const,
    xAxisIndex: i,
    yAxisIndex: i,
    barMaxWidth: 16,
    data: row.values.map((v) => ({
      value: v,
      itemStyle: {
        color: colorBar(v, row.target, row.baseColor, theme),
        borderRadius: [3, 3, 0, 0] as [number, number, number, number],
      },
    })),
    markLine:
      row.target > 0
        ? {
            silent: true,
            symbol: 'none' as const,
            label: { show: false },
            lineStyle: {
              color: theme.palette.text.secondary,
              type: 'dashed' as const,
              opacity: 0.6,
            },
            data: [{ yAxis: row.target }],
          }
        : undefined,
  }));

  const option = {
    grid: grids,
    tooltip: {
      trigger: 'item' as const,
      formatter: (params: { seriesName?: string; name?: string; value?: number }) =>
        `${params.name ?? ''}<br/><b>${params.seriesName ?? ''}</b>: ${params.value ?? 0} g`,
    },
    xAxis: xAxes,
    yAxis: yAxes,
    series,
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack sx={{ mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Macros vs target
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {stats ? 'Daily protein, carbs and fat — dashed line is your target' : 'Loading…'}
          </Typography>
        </Stack>
        <ReactECharts option={option} style={{ height: 280 }} />
        <Stack sx={{ mt: 1, gap: 0.5 }}>
          {rows.map((row) => {
            const deltaText = row.prevAvg === null ? null : formatDelta(row.avg - row.prevAvg);
            const onTrack =
              row.target > 0 && Math.abs(row.avg - row.target) / row.target <= TOLERANCE;
            return (
              <Stack
                key={row.key}
                direction="row"
                sx={{ alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600, color: row.baseColor }}>
                  {row.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  avg {row.avg} g · target {row.target} g
                  {deltaText && ` · ${deltaText}`}
                  {onTrack && ' · on target'}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
};
