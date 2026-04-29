import type { ExerciseType } from '@/components/diary/types';
import { toISODate } from '@/lib/date';
import type { GoalType } from '@/lib/nutrition';
import type { ExerciseWeek } from './types';

const MS_PER_DAY = 86_400_000;
const isoToMs = (iso: string): number => Date.parse(`${iso}T00:00:00`);

export const EXERCISE_STACK_TYPES: ExerciseType[] = [
  'strength',
  'cardio',
  'sports',
  'walk',
  'other',
];

export const average = (values: number[]): number => {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
};

export const rollingMean = (values: number[], window: number): number[] =>
  values.map((_, index) => {
    const start = Math.max(0, index - window + 1);
    const slice = values.slice(start, index + 1);
    return slice.reduce((total, value) => total + value, 0) / slice.length;
  });

export const totalExerciseMinutes = (weeks: ExerciseWeek[]): number =>
  weeks.reduce(
    (total, week) =>
      total +
      EXERCISE_STACK_TYPES.reduce(
        (weekTotal, type) => weekTotal + week.minutes[type],
        0,
      ),
    0,
  );

// Exponentially-weighted moving average. Higher alpha = more weight on recent
// values. 0.1 is a reasonable default for daily weigh-ins; emphasises the last
// ~14 days more than older data without being too jumpy.
export const ewma = (values: number[], alpha = 0.1): number[] => {
  if (values.length === 0) return [];
  const result: number[] = [values[0]];
  for (let i = 1; i < values.length; i += 1) {
    result.push(alpha * values[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
};

export interface ProjectETAResult {
  etaISO: string | null;
  status: 'on_track' | 'wrong_direction' | 'holding' | 'reached';
  weeklyKg: number;
}

// Project an ETA to reach `targetKg` from a series of recent EWMA values.
// Uses the last `windowDays` (or whatever's available) to fit a simple slope,
// then linearly extrapolates. Returns status flags so callers can render a
// human-readable label without re-deriving the same logic.
export const projectETA = (
  series: { dates: string[]; values: number[] },
  targetKg: number,
  goalType: GoalType,
  windowDays = 14,
): ProjectETAResult => {
  const { dates, values } = series;
  const n = values.length;
  const latest = values[n - 1];
  if (n === 0 || latest === undefined) {
    return { etaISO: null, status: 'holding', weeklyKg: 0 };
  }

  const reached =
    (goalType === 'lose' && latest <= targetKg) ||
    (goalType === 'gain' && latest >= targetKg);
  if (reached) return { etaISO: null, status: 'reached', weeklyKg: 0 };

  const windowStart = Math.max(0, n - windowDays);
  const windowValues = values.slice(windowStart);
  const windowDates = dates.slice(windowStart);
  if (windowValues.length < 2) {
    return { etaISO: null, status: 'holding', weeklyKg: 0 };
  }

  const firstMs = isoToMs(windowDates[0]);
  const lastMs = isoToMs(windowDates[windowDates.length - 1]);
  const days = Math.max(1, (lastMs - firstMs) / MS_PER_DAY);
  const slopePerDay = (windowValues[windowValues.length - 1] - windowValues[0]) / days;
  const weeklyKg = Math.round(slopePerDay * 7 * 100) / 100;

  if (Math.abs(slopePerDay) < 0.005) {
    return { etaISO: null, status: 'holding', weeklyKg: 0 };
  }

  const remaining = targetKg - latest;
  const wrongDirection =
    (goalType === 'lose' && slopePerDay > 0) ||
    (goalType === 'gain' && slopePerDay < 0) ||
    Math.sign(remaining) !== Math.sign(slopePerDay);
  if (wrongDirection) {
    return { etaISO: null, status: 'wrong_direction', weeklyKg };
  }

  const daysToTarget = remaining / slopePerDay;
  if (!Number.isFinite(daysToTarget) || daysToTarget <= 0) {
    return { etaISO: null, status: 'holding', weeklyKg };
  }

  const etaMs = isoToMs(dates[n - 1]) + daysToTarget * MS_PER_DAY;
  return { etaISO: toISODate(new Date(etaMs)), status: 'on_track', weeklyKg };
};

