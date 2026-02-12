
import React from 'react';
import { 
  Activity, 
  Utensils, 
  Dumbbell, 
  User, 
  Settings, 
  Home, 
  Plus, 
  Camera, 
  Mic, 
  MessageSquare,
  TrendingUp,
  Award,
  Info
} from 'lucide-react';

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: <Home size={20} /> },
  { id: 'nutrition', label: 'Nutrition', icon: <Utensils size={20} /> },
  { id: 'fitness', label: 'Fitness', icon: <Dumbbell size={20} /> },
  { id: 'coach', label: 'AI Coach', icon: <MessageSquare size={20} /> },
  { id: 'about', label: 'About Aura', icon: <Info size={20} /> },
  { id: 'profile', label: 'Profile', icon: <User size={20} /> },
];

export const ACTIVITY_LEVEL_MULTIPLIERS = {
  SEDENTARY: 1.2,
  LIGHTLY_ACTIVE: 1.375,
  MODERATELY_ACTIVE: 1.55,
  VERY_ACTIVE: 1.725,
  ATHLETE: 1.9
};

export const MACRO_RATIOS = {
  KETO: { protein: 0.25, carbs: 0.05, fats: 0.70 },
  VEGAN: { protein: 0.20, carbs: 0.60, fats: 0.20 },
  DEFAULT: { protein: 0.30, carbs: 0.40, fats: 0.30 }
};
