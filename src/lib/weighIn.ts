import { shiftISODate } from './date';

export type WeighInStatus =
  | { kind: 'never' }
  | { kind: 'recent'; daysSince: number }
  | { kind: 'due_today'; daysSince: number }
  | { kind: 'due_soon'; daysSince: number }
  | { kind: 'overdue'; daysSince: number };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const parseISO = (iso: string): Date => new Date(`${iso}T00:00:00`);

export const isSunday = (iso: string): boolean => parseISO(iso).getDay() === 0;

export const daysBetween = (fromISO: string, toISO: string): number => {
  const diffMs = parseISO(toISO).getTime() - parseISO(fromISO).getTime();
  return Math.round(diffMs / MS_PER_DAY);
};

export const lastSundayISO = (today: string): string => {
  const day = parseISO(today).getDay();
  return day === 0 ? today : shiftISODate(today, -day);
};

export const getWeighInStatus = (
  latestDate: string | null,
  today: string,
): WeighInStatus => {
  if (!latestDate) return { kind: 'never' };
  const daysSince = Math.max(0, daysBetween(latestDate, today));
  if (daysSince === 0) return { kind: 'recent', daysSince };
  if (isSunday(today)) return { kind: 'due_today', daysSince };
  if (daysSince >= 7) return { kind: 'overdue', daysSince };
  if (daysSince >= 5) return { kind: 'due_soon', daysSince };
  return { kind: 'recent', daysSince };
};

export const humanizeDaysSince = (daysSince: number): string => {
  if (daysSince <= 0) return 'today';
  if (daysSince === 1) return 'yesterday';
  return `${daysSince} days ago`;
};
