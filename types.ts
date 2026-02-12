
export enum ActivityLevel {
  SEDENTARY = 'SEDENTARY',
  LIGHTLY_ACTIVE = 'LIGHTLY_ACTIVE',
  MODERATELY_ACTIVE = 'MODERATELY_ACTIVE',
  VERY_ACTIVE = 'VERY_ACTIVE',
  ATHLETE = 'ATHLETE'
}

export enum Equipment {
  FULL_GYM = 'FULL_GYM',
  DUMBBELLS = 'DUMBBELLS',
  BODYWEIGHT = 'BODYWEIGHT'
}

export interface UserProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number; // in kg
  height: number; // in cm
  bodyFat?: number;
  activityLevel: ActivityLevel;
  dietaryPatterns: string[]; // Multi-select strings
  allergies: string[];
  medicalGoals: string[];
  equipment: Equipment;
  tdee: number;
  baseTdee: number; // Maintenance before goal adjustments
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  // New Lifestyle & Recovery Fields
  occupation: 'sitting' | 'standing' | 'heavy_lifting';
  commuteStyle: 'active' | 'passive';
  screenTime: number; // hours/day
  sleepHours: number;
  sleepQuality: 'poor' | 'fair' | 'good' | 'excellent';
  stressLevel: number; // 1-10
  habits: 'none' | 'occasional' | 'frequent';
}

export interface UserAccount {
  id: string;
  email: string;
  password?: string;
  profile?: UserProfile;
}

export interface MealEntry {
  id: string;
  name: string;
  timestamp: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  sodium: number; // mg
  potassium: number; // mg
  healthScore: number; // 1-10
  vitamins?: Record<string, string>;
  minerals?: Record<string, string>;
  fiber?: number;
  type: string; // Dynamic type (e.g., 'Breakfast', 'Post-Workout', 'Snack')
  isSuggested?: boolean;
  dayName?: string;
}

export interface WeeklyMealPlan {
  [key: string]: Partial<MealEntry>[]; // Array of dynamic meals for each day
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: number;
  description?: string; // Short 2-sentence how-to
  notes?: string;
  completed?: boolean;
  stepImages?: string[]; 
}

export interface WorkoutPlan {
  id: string;
  date: string;
  dayName: string;
  exercises: WorkoutExercise[];
  intensity: 'low' | 'medium' | 'high';
  rationale: string;
  analysis?: string;
  completed?: boolean;
}

export interface WeeklyWorkoutPlan {
  [key: string]: WorkoutPlan;
}
