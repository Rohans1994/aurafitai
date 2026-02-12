
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, MealEntry, WorkoutPlan, WeeklyMealPlan, WeeklyWorkoutPlan } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Detail schema for single meal analysis
export const nutritionSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    calories: { type: Type.NUMBER },
    protein: { type: Type.NUMBER },
    carbs: { type: Type.NUMBER },
    fats: { type: Type.NUMBER },
    sodium: { type: Type.NUMBER },
    potassium: { type: Type.NUMBER },
    fiber: { type: Type.NUMBER },
    healthScore: { type: Type.NUMBER },
    type: { type: Type.STRING, description: "e.g., Breakfast, Lunch, Dinner, Snack, Post-Workout" }
  },
  required: ['name', 'calories', 'protein', 'carbs', 'fats', 'sodium', 'potassium', 'healthScore', 'type']
};

const slimNutritionSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    calories: { type: Type.NUMBER },
    protein: { type: Type.NUMBER },
    carbs: { type: Type.NUMBER },
    fats: { type: Type.NUMBER },
    healthScore: { type: Type.NUMBER },
    sodium: { type: Type.NUMBER },
    potassium: { type: Type.NUMBER },
    fiber: { type: Type.NUMBER },
    type: { type: Type.STRING }
  },
  required: ['name', 'calories', 'protein', 'carbs', 'fats', 'healthScore', 'type']
};

export const weeklyNutritionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      day: { type: Type.STRING, description: "Day of the week (e.g., Monday)" },
      meals: {
        type: Type.ARRAY,
        items: slimNutritionSchema,
        description: "A list of meals for the day. Frequency determined by goals."
      }
    },
    required: ['day', 'meals']
  }
};

export const groceryListSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      category: { type: Type.STRING, description: "e.g., Produce, Protein, Grains, Dairy, Pantry" },
      items: { type: Type.ARRAY, items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          amount: { type: Type.STRING, description: "Estimated quantity needed for the whole week" }
        },
        required: ['name', 'amount']
      }}
    },
    required: ['category', 'items']
  }
};

export const workoutSchema = {
  type: Type.OBJECT,
  properties: {
    exercises: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          sets: { type: Type.NUMBER },
          reps: { type: Type.NUMBER },
          description: { type: Type.STRING, description: "Exactly 2 simple sentences explaining how to perform the exercise." },
          notes: { type: Type.STRING }
        },
        required: ['name', 'sets', 'reps', 'description']
      }
    },
    intensity: { type: Type.STRING },
    rationale: { type: Type.STRING, description: "Detailed explanation of volume and intensity choices based on user biometrics and recovery." },
    analysis: { type: Type.STRING }
  },
  required: ['exercises', 'intensity', 'rationale', 'analysis']
};

export const weeklyWorkoutSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      day: { type: Type.STRING },
      workout: workoutSchema
    },
    required: ['day', 'workout']
  }
};

// Helper to get location context
async function getLocationContext() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const isIndia = tz.toLowerCase().includes('kolkata') || tz.toLowerCase().includes('asia/calcutta');
    
    let context = `User Location Context: Timezone ${tz}. Use local staple foods and ingredients common in this specific geography. `;
    
    if (isIndia) {
      context += `IMPORTANT: The user is likely in India. Prioritize Indian staples (lentils/dals, millets, rice, local vegetables). MANDATORY: Do not suggest Beef or Pork. Use Eggs only if dietary pattern is Egg-atarian.`;
    } else {
      context += `Ensure ingredients suggested are readily available in local markets for this timezone region. Respect common cultural dietary taboos.`;
    }
    
    return context;
  } catch {
    return "Use local regional staples based on typical global availability.";
  }
}

export async function analyzeMealImage(base64Image: string, profile: UserProfile): Promise<Partial<MealEntry>> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: `Identify this meal. 
          Analyze constraints: Patterns: ${profile.dietaryPatterns.join(', ')}. Clinical Priority: ${profile.medicalGoals.join(', ')}.
          Estimate: Calories, Macros, Sodium (mg), Potassium (mg), Fiber (g).
          Assign a Health Score (1-10). JSON only.` }
      ]
    },
    config: { responseMimeType: "application/json", responseSchema: nutritionSchema }
  });
  return JSON.parse(response.text || '{}');
}

export async function parseMealText(text: string, profile: UserProfile): Promise<Partial<MealEntry>> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze input: "${text}". 
      Filters: Patterns: ${profile.dietaryPatterns.join(', ')}. Priorities: ${profile.medicalGoals.join(', ')}.
      Extract data: Cals, P, C, F, Na, K, Fiber, and Health Score (1-10). JSON only.`,
    config: { responseMimeType: "application/json", responseSchema: nutritionSchema }
  });
  return JSON.parse(response.text || '{}');
}

export async function generateWeeklyMealPlan(profile: UserProfile): Promise<WeeklyMealPlan> {
  const loc = await getLocationContext();
  
  let frequencyLogic = "Standard: 3 main meals + 1 snack.";
  const goals = profile.medicalGoals;

  if (goals.includes('Weight Loss')) {
    frequencyLogic = "STRATEGIC PRIORITY: Weight Loss. REQUIREMENT: 2–3 Meals. Rationale: Maintain caloric deficit with larger, satisfying meals to promote metabolic flexibility.";
  } else if (goals.includes('Build Muscle') || goals.includes('Weight Gain')) {
    frequencyLogic = "STRATEGIC PRIORITY: Build Muscle. REQUIREMENT: 5–6 Meals. Rationale: Protein-rich meals every 3–4 hours to optimize muscle protein synthesis.";
  } else if (goals.includes('Diabetic Friendly') || goals.includes('PCOS/Hormonal Balance')) {
    frequencyLogic = "STRATEGIC PRIORITY: Diabetic Friendly. REQUIREMENT: 4–5 Meals. Rationale: Smaller, consistent portions to stabilize blood glucose.";
  } else if (goals.includes('Endurance Training (5k/Marathon)')) {
    frequencyLogic = "STRATEGIC PRIORITY: Endurance Training. REQUIREMENT: 5+ Meals. Rationale: Specific fueling windows for recovery and glycogen.";
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create a comprehensive 7-day meal plan array.
      ${loc}
      User Profile: ${profile.age}yo, ${profile.weight}kg.
      Goals: ${profile.medicalGoals.join(', ')}. 
      FEEDING PROTOCOL: ${frequencyLogic}
      Target Daily Energy: ${profile.tdee} kcal.
      Return JSON as array of day objects with 'meals'.`,
    config: { responseMimeType: "application/json", responseSchema: weeklyNutritionSchema }
  });
  
  const rawArray = JSON.parse(response.text || '[]');
  const plan: WeeklyMealPlan = {};
  rawArray.forEach((item: any) => {
    plan[item.day] = item.meals;
  });
  return plan;
}

export async function generateGroceryList(mealPlan: WeeklyMealPlan): Promise<any[]> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Extract curated shopping list from this plan: ${JSON.stringify(mealPlan)}. Group by category. JSON only.`,
    config: { responseMimeType: "application/json", responseSchema: groceryListSchema }
  });
  return JSON.parse(response.text || '[]');
}

export async function generateMealAlternative(profile: UserProfile, type: string, currentMeal: string): Promise<Partial<MealEntry>> {
  const loc = await getLocationContext();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Suggest local alternative for ${type} instead of "${currentMeal}".
      ${loc}
      Patterns: ${profile.dietaryPatterns.join(', ')}. Goals: ${profile.medicalGoals.join(', ')}.
      JSON only.`,
    config: { responseMimeType: "application/json", responseSchema: slimNutritionSchema }
  });
  return JSON.parse(response.text || '{}');
}

/**
 * AISTUDIO Fitness Logic Engine Integration
 */
const FITNESS_MATRIX_PROMPT = `
The Workout Intensity Matrix:
- Build Muscle -> Hypertrophy focus, High Intensity (RPE 8-9), Resistance Training modality.
- Endurance Training -> Aerobic Capacity focus, Variable Intensity, Zone 2-4 Cardio + Sport-specific drills.
- Body Recomposition -> Fat Loss + Lean Mass focus, Moderate-High Intensity, HIIT + Compound Strength movements.
- Flexibility & Mobility -> Range of Motion focus, Low-Moderate Intensity, Yoga/PNF/Isometrics modality.
`;

export async function generateWeeklyWorkoutPlan(profile: UserProfile): Promise<WeeklyWorkoutPlan> {
  const volumeLogic = `
  Dynamic Volume Adjustment:
  - Occupation: ${profile.occupation}. (Manual Labor = Fewer sets, Office = More postural correction/Face pulls/Bridges).
  - Commute: ${profile.commuteStyle}. (Active = Lower gym volume to prevent overtraining).
  - NEAT Level: ${profile.activityLevel}. (Sedentary = Mandatory movement snacks).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate a 7-day weekly workout routine array.
      AuraFit AI Fitness Logic Engine constraints:
      ${FITNESS_MATRIX_PROMPT}
      ${volumeLogic}
      User Profile: ${profile.age}yo, ${profile.weight}kg, Equipment: ${profile.equipment}.
      Goals: ${profile.medicalGoals.join(', ')}.
      
      For each exercise, provide 2-sentence biomechanical guidance.
      In 'rationale', explain how the volume was adjusted for their ${profile.occupation} job and ${profile.commuteStyle} commute.
      Return JSON array of day objects.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: weeklyWorkoutSchema
    }
  });
  
  const rawArray = JSON.parse(response.text || '[]');
  const plan: WeeklyWorkoutPlan = {};
  rawArray.forEach((item: any) => {
    const dayWorkout = item.workout;
    dayWorkout.dayName = item.day;
    dayWorkout.id = Math.random().toString(36).substr(2, 9);
    plan[item.day] = dayWorkout;
  });
  return plan;
}

export async function recalibrateRemainingPlan(profile: UserProfile, currentPlan: WeeklyWorkoutPlan, missedDays: string[]): Promise<WeeklyWorkoutPlan> {
  const prompt = `
    AuraFit AI Fitness Engine: Protocol Recalibration.
    
    Current Plan: ${JSON.stringify(currentPlan)}
    MISSED DAYS: ${missedDays.join(', ')}.
    
    RULES:
    1. Detect "Volume Debt" from missed days.
    2. Re-distribute essential compound movements into the remaining days of the week.
    3. If multiple days were missed, prioritize a "Full Body Protocol" for the next active day to ensure systemic stimulus.
    4. Adjust 'rationale' to acknowledge the missed volume and how the future days were modified for compensation.
    
    User Profile: ${profile.age}yo, Equipment: ${profile.equipment}, Goal: ${profile.medicalGoals.join(', ')}.
    Return a full 7-day WeeklyWorkoutPlan JSON array.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: weeklyWorkoutSchema
    }
  });

  const rawArray = JSON.parse(response.text || '[]');
  const plan: WeeklyWorkoutPlan = {};
  rawArray.forEach((item: any) => {
    const dayWorkout = item.workout;
    dayWorkout.dayName = item.day;
    dayWorkout.id = Math.random().toString(36).substr(2, 9);
    plan[item.day] = dayWorkout;
  });
  return plan;
}

export async function generateDailyWorkout(profile: UserProfile, fatigueLevel: number, historyNotes: string): Promise<WorkoutPlan> {
  // Bio-Engine Recovery Filters
  let recoveryOverride = "";
  if (profile.sleepHours < 6) {
    recoveryOverride = "RECOVERY FILTER: Sleep < 6h. MANDATORY: Low-Intensity Steady State (LISS) or Active Recovery day. No heavy lifting.";
  } else if (profile.stressLevel >= 8) {
    recoveryOverride = "RECOVERY FILTER: Critical Stress (${profile.stressLevel}/10). MANDATORY: Parasympathetic focus. Mobility and Breathwork only.";
  } else if (fatigueLevel >= 8) {
    recoveryOverride = "DELOAD MANDATE: High Fatigue (${fatigueLevel}/10). Reduced sets/reps by 40%. Focus on technique.";
  }

  const dietIntegration = profile.dietaryPatterns.includes('Keto') 
    ? "Diet: Ketogenic. Focus on lower-rep, high-power sets due to lower glycogen." 
    : profile.dietaryPatterns.includes('High Protein') 
      ? "Diet: High Protein. Allow higher training frequency for recovery." 
      : "";

  const prompt = `Generate a daily workout routine.
    AuraFit AI Fitness Engine Core:
    ${FITNESS_MATRIX_PROMPT}
    ${recoveryOverride}
    ${dietIntegration}
    User: ${profile.age}yo, Equipment: ${profile.equipment}. 
    Goals: ${profile.medicalGoals.join(', ')}. 
    
    Include a 'rationale' that specifically references the user's stress, sleep, and occupational routine.
    Return JSON with clinical Analysis.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: workoutSchema }
  });
  const data = JSON.parse(response.text || '{}');
  return { ...data, id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString() };
}

export async function generateSpecializedWorkout(profile: UserProfile, target: string, muscles: string[]): Promise<WorkoutPlan> {
  const prompt = `Generate a specialized workout routine targeting: ${target}.
    Specifically focus on these muscles: ${muscles.join(', ')}.
    AuraFit AI Fitness Engine Core:
    ${FITNESS_MATRIX_PROMPT}
    User: ${profile.age}yo, Equipment: ${profile.equipment}. 
    Goals: ${profile.medicalGoals.join(', ')}.
    
    The routine must exclusively focus on the target split/muscles mentioned. 
    Include a 'rationale' explaining the targeted biomechanical focus.
    Return JSON with clinical Analysis.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: workoutSchema }
  });
  const data = JSON.parse(response.text || '{}');
  return { ...data, id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString() };
}

export async function getCoachingAdvice(profile: UserProfile, dailyStats: any, message: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      System: You are AuraFit AI Coach. 
      Context: Job: ${profile.occupation}, Stress: ${profile.stressLevel}/10, Sleep: ${profile.sleepHours}h.
      User Inquiry: "${message}"
      Progress: ${JSON.stringify(dailyStats)}
      MANDATORY: Reference their specific lifestyle variables (Commute/Occupation) in the advice.
    `
  });
  return response.text || "Synchronizing core intelligence... Please re-send.";
}
