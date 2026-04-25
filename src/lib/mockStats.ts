import type { ExerciseType } from '@/components/diary/types';

export type StatsRange = 7 | 30 | 90;

const toISO = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const daysBack = (range: StatsRange) => {
  const out: string[] = [];
  const today = new Date();
  for (let i = range - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(toISO(d));
  }
  return out;
};

// Deterministic pseudo-random so charts don't flicker between renders.
const prng = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

export interface WeightPoint {
  date: string;
  weightKg: number;
}

export const getMockWeights = (range: StatsRange): WeightPoint[] => {
  const rnd = prng(42);
  const dates = daysBack(range);
  let weight = 82;
  return dates.map((date) => {
    weight += (rnd() - 0.52) * 0.5;
    return { date, weightKg: Math.round(weight * 10) / 10 };
  });
};

export interface CaloriePoint {
  date: string;
  calories: number;
  target: number;
}

export const getMockCalories = (range: StatsRange): CaloriePoint[] => {
  const rnd = prng(1337);
  return daysBack(range).map((date) => ({
    date,
    calories: Math.round(2400 + (rnd() - 0.5) * 700),
    target: 2600,
  }));
};

export interface MacroPoint {
  date: string;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export const getMockMacros = (range: StatsRange): MacroPoint[] => {
  const rnd = prng(99);
  return daysBack(range).map((date) => ({
    date,
    proteinG: Math.round(150 + (rnd() - 0.5) * 40),
    carbsG: Math.round(250 + (rnd() - 0.5) * 80),
    fatG: Math.round(80 + (rnd() - 0.5) * 30),
  }));
};

export interface StreakPoint {
  date: string;
  status: 0 | 1 | 2 | 3; // 0 = miss, 1 = logged, 2 = hit target, 3 = perfect
}

export const getMockStreaks = (range: StatsRange): StreakPoint[] => {
  const rnd = prng(7);
  return daysBack(range).map((date) => {
    const r = rnd();
    const status: 0 | 1 | 2 | 3 =
      r < 0.08 ? 0 : r < 0.3 ? 1 : r < 0.75 ? 2 : 3;
    return { date, status };
  });
};

export interface ExerciseWeek {
  weekLabel: string;
  minutes: Record<ExerciseType, number>;
}

const weeksBack = (range: StatsRange): { start: string; label: string }[] => {
  const count = range <= 7 ? 4 : range <= 30 ? 6 : 13;
  const out: { start: string; label: string }[] = [];
  const today = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i * 7);
    out.push({
      start: toISO(d),
      label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
    });
  }
  return out;
};

export const getMockExercise = (range: StatsRange): ExerciseWeek[] => {
  const rnd = prng(311);
  return weeksBack(range).map((w) => ({
    weekLabel: w.label,
    minutes: {
      strength: Math.round(rnd() * 180),
      cardio: Math.round(rnd() * 120),
      sports: Math.round(rnd() * 90),
      walk: Math.round(rnd() * 150),
      other: Math.round(rnd() * 40),
    },
  }));
};
