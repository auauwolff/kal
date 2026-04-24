import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserStats {
  age: number;
  height: number; // cm
  currentWeight: number; // kg
  goalWeight: number; // kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  name: string;
}

interface PetState {
  name: string;
  level: number;
  experience: number;
  happiness: number;
  health: number;
  size: number; // 0.5-2.0 scale factor
  color: string; // hex color
  lastFed: Date;
  lastExercised: Date;
  updatedAt: Date;
}

interface KalState {
  userStats: UserStats;
  petState: PetState;
  // Actions
  updateUserStats: (stats: Partial<UserStats>) => void;
  updatePetState: (pet: Partial<PetState>) => void;
  feedPet: () => void;
  exercisePet: () => void;
  calculatePetCharacteristics: () => void;
  resetData: () => void;
}

const defaultUserStats: UserStats = {
  age: 25,
  height: 170,
  currentWeight: 70,
  goalWeight: 65,
  activityLevel: 'moderate',
  name: 'User',
};

const defaultPetState: PetState = {
  name: 'Kal',
  level: 1,
  experience: 0,
  happiness: 100,
  health: 100,
  size: 1.0,
  color: '#4FC3F7', // Light blue default
  lastFed: new Date(),
  lastExercised: new Date(),
  updatedAt: new Date(),
};

const calculatePetSize = (currentWeight: number, _goalWeight: number, height: number): number => {
  const bmi = currentWeight / ((height / 100) ** 2);

  // Healthy BMI range is roughly 18.5-24.9
  const healthyBmi = 22; // Middle of healthy range
  
  // Size ranges from 0.7 to 1.5 based on distance from healthy BMI
  let sizeMultiplier;
  if (bmi < healthyBmi) {
    // Underweight - smaller pet
    sizeMultiplier = Math.max(0.7, 0.9 - (healthyBmi - bmi) * 0.05);
  } else if (bmi > healthyBmi) {
    // Overweight - larger pet
    sizeMultiplier = Math.min(1.5, 1.1 + (bmi - healthyBmi) * 0.05);
  } else {
    sizeMultiplier = 1.0;
  }
  
  return Number(sizeMultiplier.toFixed(2));
};

const calculatePetColor = (currentWeight: number, goalWeight: number, health: number): string => {
  const weightProgress = Math.abs(goalWeight - currentWeight);
  const healthFactor = health / 100;
  
  // Base colors based on health and progress
  if (healthFactor > 0.8 && weightProgress < 5) {
    return '#4CAF50'; // Green - healthy and on track
  } else if (healthFactor > 0.6 && weightProgress < 10) {
    return '#FF9800'; // Orange - okay but needs improvement
  } else if (healthFactor > 0.4) {
    return '#FFC107'; // Yellow - moderate health
  } else {
    return '#F44336'; // Red - needs attention
  }
};

export const useKalStore = create<KalState>()(
  persist(
    (set) => ({
      userStats: defaultUserStats,
      petState: defaultPetState,

      updateUserStats: (stats) => {
        set((state) => {
          const newStats = { ...state.userStats, ...stats };
          
          // Auto-update pet characteristics when user stats change
          const newSize = calculatePetSize(newStats.currentWeight, newStats.goalWeight, newStats.height);
          const newColor = calculatePetColor(newStats.currentWeight, newStats.goalWeight, state.petState.health);
          
          return {
            userStats: newStats,
            petState: {
              ...state.petState,
              size: newSize,
              color: newColor,
              updatedAt: new Date(),
            },
          };
        });
      },

      updatePetState: (pet) => {
        set((state) => ({
          petState: {
            ...state.petState,
            ...pet,
            updatedAt: new Date(),
          },
        }));
      },

      feedPet: () => {
        set((state) => {
          const now = new Date();
          const happiness = Math.min(100, state.petState.happiness + 10);
          const health = Math.min(100, state.petState.health + 5);
          
          return {
            petState: {
              ...state.petState,
              happiness,
              health,
              lastFed: now,
              updatedAt: now,
            },
          };
        });
      },

      exercisePet: () => {
        set((state) => {
          const now = new Date();
          const experience = state.petState.experience + 15;
          const level = Math.floor(experience / 100) + 1;
          const happiness = Math.min(100, state.petState.happiness + 15);
          
          return {
            petState: {
              ...state.petState,
              experience,
              level,
              happiness,
              lastExercised: now,
              updatedAt: now,
            },
          };
        });
      },

      calculatePetCharacteristics: () => {
        set((state) => {
          const newSize = calculatePetSize(
            state.userStats.currentWeight,
            state.userStats.goalWeight,
            state.userStats.height
          );
          const newColor = calculatePetColor(
            state.userStats.currentWeight,
            state.userStats.goalWeight,
            state.petState.health
          );
          
          return {
            petState: {
              ...state.petState,
              size: newSize,
              color: newColor,
              updatedAt: new Date(),
            },
          };
        });
      },

      resetData: () => {
        set({
          userStats: defaultUserStats,
          petState: defaultPetState,
        });
      },
    }),
    {
      name: 'kal-storage', // localStorage key
      version: 1,
    }
  )
);