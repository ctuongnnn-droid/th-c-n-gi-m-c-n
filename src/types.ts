export interface UserProfile {
  age: number;
  gender: 'male' | 'female';
  height: number;
  weight: number;
  goalWeight: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  eatingHabits: string;
  allergies: string;
  preferredProteins: string;
  preferredVegetables: string;
}

export interface Meal {
  name: string;
  description: string;
  proteinSource: string;
  fiberSource: string;
  carbSource: string;
  backupMeal?: {
    name: string;
    proteinSource: string;
  };
}

export interface DayPlan {
  day: number;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snack?: Meal;
}

export interface NutritionPlan {
  bmr: number;
  tdee: number;
  targetCalories: number;
  weeklyPlan: DayPlan[];
  tips: {
    eatingHabits: string[];
    waterIntake: string;
    workoutSchedule: string;
  };
}
