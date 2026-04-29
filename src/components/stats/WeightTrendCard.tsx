import { useState } from 'react';
import { Card, CardContent, IconButton, Stack, Tooltip, Typography, useTheme } from '@mui/material';
import { Add } from '@mui/icons-material';
import ReactECharts from 'echarts-for-react';
import { useStatsData } from '@/hooks/useStatsData';
import { WeightLogDialog } from '@/components/weight/WeightLogDialog';
import type { WeightGoal } from '@/lib/userTypes';
import { ewma, projectETA, type ProjectETAResult } from './statsUtils';

const MS_PER_DAY = 86_400_000;
const isoToMs = (iso: string): number => Date.parse(`${iso}T00:00:00`);

const formatETA = (iso: string): string =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });

const signedKg = (n: number): string => `${n >= 0 ? '+' : ''}${n.toFixed(1)} kg`;

interface SubtitleArgs {
  latest: number | undefined;
  goal: WeightGoal | null;
  delta7d: number | null;
  eta: ProjectETAResult | null;
  loaded: boolean;
}

const buildSubtitle = ({ latest, goal, delta7d, eta, loaded }: SubtitleArgs): string => {
  if (!loaded) return 'Loading…';
  if (latest === undefined) return 'No weights logged yet';
  const latestStr = `${latest.toFixed(1)} kg`;
  const deltaStr = delta7d === null ? '' : ` · ${signedKg(delta7d)} / 7d`;

  if (!goal) return `${latestStr}${deltaStr}`;
  if (goal.type === 'recomp') return `${latestStr} · recomp${deltaStr}`;
  if (goal.type === 'maintain') {
    return `${latestStr} · ${signedKg(latest - goal.targetWeightKg)} from target`;
  }
  const arrow = `${latestStr} → ${goal.targetWeightKg.toFixed(1)} kg`;
  if (eta?.status === 'reached') return `${arrow} · Goal reached`;
  if (eta?.status === 'on_track' && eta.etaISO) return `${arrow} · ETA ${formatETA(eta.etaISO)}`;
  if (eta?.status === 'wrong_direction') return `${arrow} · trend off`;
  return `${arrow} · holding`;
};

// Linearly interpolate from first weigh to (targetWeight, targetDate),
// sampled at each visible weigh-in date so the diagonal renders on the
// same category x-axis as the weight series.
const buildPaceLine = (
  data: ReadonlyArray<{ date: string; weightKg: number }>,
  goal: WeightGoal | null,
): number[] => {
  if (!goal || goal.type === 'recomp' || goal.type === 'maintain' || data.length === 0) return [];
  const firstMs = isoToMs(data[0].date);
  const targetMs = isoToMs(goal.targetDateISO);
  const totalDays = (targetMs - firstMs) / MS_PER_DAY;
  if (!(totalDays > 0)) return [];
  const firstKg = data[0].weightKg;
  return data.map((d) => {
    const t = (isoToMs(d.date) - firstMs) / MS_PER_DAY / totalDays;
    return Math.round((firstKg + (goal.targetWeightKg - firstKg) * t) * 10) / 10;
  });
};

export const WeightTrendCard = () => {
  const theme = useTheme();
  const stats = useStatsData();
  const [dialogOpen, setDialogOpen] = useState(false);

  const data = stats?.weights ?? [];
  const dates = data.map((d) => d.date);
  const weights = data.map((d) => d.weightKg);
  const trend = ewma(weights, 0.1).map((v) => Math.round(v * 10) / 10);

  const goal = stats?.goal ?? null;
  const showTarget = goal !== null && goal.type !== 'recomp';
  const paceLine = buildPaceLine(data, goal);

  const latest = weights[weights.length - 1];
  const weekAgo = weights[Math.max(0, weights.length - 8)];
  const delta7d =
    latest === undefined || weekAgo === undefined || weights.length < 2
      ? null
      : Math.round((latest - weekAgo) * 10) / 10;

  const eta =
    goal && weights.length >= 2
      ? projectETA({ dates, values: trend }, goal.targetWeightKg, goal.type)
      : null;

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
        lineStyle: { color: theme.palette.info.main, width: 1.5, opacity: 0.55 },
        itemStyle: { color: theme.palette.info.main, opacity: 0.7 },
      },
      {
        name: 'Trend',
        type: 'line',
        data: trend,
        smooth: true,
        symbol: 'none',
        lineStyle: { color: theme.palette.primary.main, width: 2.5 },
        markLine:
          showTarget && goal
            ? {
                silent: true,
                symbol: 'none' as const,
                data: [
                  {
                    yAxis: goal.targetWeightKg,
                    label: {
                      formatter: `Target ${goal.targetWeightKg.toFixed(1)} kg`,
                      color: theme.palette.text.secondary,
                      fontSize: 10,
                    },
                    lineStyle: {
                      color: theme.palette.primary.main,
                      type: 'dashed' as const,
                      width: 1.5,
                    },
                  },
                ],
              }
            : undefined,
      },
      ...(paceLine.length > 0
        ? [
            {
              name: 'Goal pace',
              type: 'line',
              data: paceLine,
              symbol: 'none',
              lineStyle: {
                color: theme.palette.text.secondary,
                width: 1.5,
                type: 'dotted' as const,
                opacity: 0.7,
              },
            },
          ]
        : []),
    ],
  };

  const subtitle = buildSubtitle({
    latest,
    goal,
    delta7d,
    eta,
    loaded: stats !== undefined,
  });

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 1 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Weight
          </Typography>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
            <Tooltip title="Log weight">
              <IconButton size="small" color="primary" onClick={() => setDialogOpen(true)}>
                <Add fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
        <ReactECharts option={option} style={{ height: 200 }} />
      </CardContent>
      <WeightLogDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        defaultWeightKg={latest ?? null}
      />
    </Card>
  );
};
