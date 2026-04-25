import type { ActivityLevel, GoalType, Sex } from '@/lib/nutrition';

export interface BodyStats {
  heightCm: number;
  weightKg: number;
  age: number;
  sex: Sex;
  activity: ActivityLevel;
}

export interface WeightGoal {
  type: GoalType;
  targetWeightKg: number;
  targetDateISO: string;
}

export interface OverridableTarget {
  value: number;
  isOverride: boolean;
}

export interface UserTargets {
  calories: OverridableTarget;
  proteinG: OverridableTarget;
  carbsG: OverridableTarget;
  fatG: OverridableTarget;
}

export interface UserProfile {
  bodyStats: BodyStats | null;
  goal: WeightGoal | null;
  targets: UserTargets;
}
