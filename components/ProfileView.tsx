
import React, { useState, useEffect } from 'react';
import { UserProfile, MealEntry, ActivityLevel, Equipment } from '../types';
import { ACTIVITY_LEVEL_MULTIPLIERS } from '../constants';
import { generateWeeklyMealPlan, generateWeeklyWorkoutPlan } from '../services/geminiService';
import { 
  LogOut, 
  History, 
  CheckCircle, 
  TrendingDown, 
  TrendingUp, 
  Settings, 
  Dumbbell, 
  Apple, 
  Info, 
  Activity, 
  Layers, 
  ShieldCheck, 
  Zap, 
  Scale, 
  Crosshair,
  User,
  ExternalLink,
  Briefcase,
  Moon,
  Monitor,
  Wine,
  Footprints,
  BrainCircuit,
  BatteryCharging,
  Edit3,
  Save,
  Loader2,
  X,
  Check,
  Sparkles
} from 'lucide-react';

interface ProfileViewProps {
  userId: string;
  profile: UserProfile;
  meals: MealEntry[];
  onUpdateProfile: (profile: UserProfile) => void;
  onSignOut: () => void;
}

const getWeekStart = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const ProfileView: React.FC<ProfileViewProps> = ({ userId, profile, meals, onUpdateProfile, onSignOut }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [synthesisPhase, setSynthesisPhase] = useState(0);
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Form State
  const [editForm, setEditForm] = useState<UserProfile>(profile);
  const [heightFt, setHeightFt] = useState(Math.floor(profile.height / 30.48));
  const [heightIn, setHeightIn] = useState(Math.round((profile.height % 30.48) / 2.54));

  const bmiValue = (profile.weight / ((profile.height / 100) ** 2));
  const bmi = bmiValue.toFixed(1);

  const selectedMeals = meals.filter(m => new Date(m.timestamp).toISOString().split('T')[0] === historyDate);
  const dailyTotal = selectedMeals.reduce((acc, m) => acc + m.calories, 0);
  const accuracy = Math.min(100, Math.round((dailyTotal / profile.tdee) * 100));

  // Full lists from Onboarding
  const DIETARY_LIST = ['Vegetarian', 'Egg-atarian', 'Standard', 'High Protein', 'Pescatarian', 'No Onion/Garlic', 'Jain', 'High-Fiber', 'Keto'];
  const CLINICAL_TARGETS = ['Weight Loss', 'Weight Gain', 'PCOS/Hormonal Balance', 'Gut Health (Probiotics)', 'Heart Health (Low Na/Sat Fat)', 'Diabetic Friendly'];
  const PERFORMANCE_TARGETS = ['Body Recomposition', 'Endurance Training (5k/Marathon)', 'Flexibility & Mobility', 'Build Muscle'];
  const RELIGIOUS_ETHICAL = ['Halal', 'Kosher', 'Sattvic'];
  const HEALTH_CLARITY = ['Mental Clarity (Omega-3)', 'Longevity Focus'];
  const SENSITIVITY = ['Nut-free', 'Soy-free', 'Dairy-free', 'Shellfish-free', 'FODMAP Friendly'];

  const loadingPhases = [
    "Recalibrating baseline biometrics...",
    "Re-integrating Occupational Routine and energy budget...",
    "Updating Stress Thresholds and Bio-Readiness vectors...",
    "Synchronizing nutritional database with updated Dietary Strategy...",
    "Finalizing new Performance and Clinical protocols..."
  ];

  useEffect(() => {
    let interval: any;
    if (isRecalibrating) {
      interval = setInterval(() => {
        // Cycle through phases so it continues showing messages until completed
        setSynthesisPhase(prev => (prev + 1) % loadingPhases.length);
      }, 2000);
    } else {
      setSynthesisPhase(0);
    }
    return () => clearInterval(interval);
  }, [isRecalibrating, loadingPhases.length]);

  const calculateTDEE = (f: UserProfile) => {
    let bmr = (10 * f.weight) + (6.25 * f.height) - (5 * f.age) + (f.gender === 'male' ? 5 : -161);
    const multiplier = ACTIVITY_LEVEL_MULTIPLIERS[f.activityLevel as ActivityLevel];
    
    let neatAdj = 1.0;
    if (f.occupation === 'standing') neatAdj += 0.05;
    if (f.occupation === 'heavy_lifting') neatAdj += 0.12;
    if (f.commuteStyle === 'active') neatAdj += 0.04;
    if (f.screenTime > 9) neatAdj -= 0.03;

    const maintenance = bmr * multiplier * neatAdj;

    let adjustedTdee = maintenance;
    if (f.medicalGoals.includes('Weight Loss')) {
      adjustedTdee = maintenance * 0.80; 
    } else if (f.medicalGoals.includes('Weight Gain') || f.medicalGoals.includes('Build Muscle')) {
      adjustedTdee = maintenance * 1.10; 
    }

    return { maintenance, adjustedTdee };
  };

  const calculateMacros = (tdee: number, f: UserProfile) => {
    const isMuscleFocus = f.medicalGoals.some(g => ['Build Muscle', 'Body Recomposition'].includes(g));
    const proteinRatio = isMuscleFocus ? 0.35 : 0.30;
    const fatRatio = 0.25;
    const carbRatio = 1 - proteinRatio - fatRatio;

    return {
      protein: (tdee * proteinRatio) / 4,
      carbs: (tdee * carbRatio) / 4,
      fats: (tdee * fatRatio) / 9
    };
  };

  const handleUpdateGoals = async () => {
    setIsRecalibrating(true);
    const totalCm = Math.round((heightFt * 30.48) + (heightIn * 2.54));
    const newForm = { ...editForm, height: totalCm };
    
    try {
      const { maintenance, adjustedTdee } = calculateTDEE(newForm);
      const macros = calculateMacros(adjustedTdee, newForm);
      const updatedProfile = { ...newForm, baseTdee: maintenance, tdee: adjustedTdee, macros };
      
      const weekStart = getWeekStart(new Date()).toString();

      const [mealPlan, workoutPlan] = await Promise.all([
        generateWeeklyMealPlan(updatedProfile),
        generateWeeklyWorkoutPlan(updatedProfile)
      ]);

      localStorage.setItem(`aurafit_weekly_meal_plan_${userId}`, JSON.stringify(mealPlan));
      localStorage.setItem(`aurafit_meal_plan_week_start_${userId}`, weekStart);
      localStorage.setItem(`aurafit_weekly_workout_plan_${userId}`, JSON.stringify(workoutPlan));
      localStorage.setItem(`aurafit_workout_plan_week_start_${userId}`, weekStart);

      onUpdateProfile(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      alert("Recalibration engine timed out. Please try again.");
    } finally {
      setIsRecalibrating(false);
    }
  };

  const getStatus = () => {
    if (dailyTotal === 0) return "No Data";
    const diff = dailyTotal - profile.tdee;
    if (Math.abs(diff) < 200) return "Optimal";
    if (diff > 0) return "Surplus";
    return "Deficit";
  };

  const toggleList = (key: 'dietaryPatterns' | 'medicalGoals', value: string) => {
    const list = editForm[key] || [];
    setEditForm({ ...editForm, [key]: list.includes(value) ? list.filter(v => v !== value) : [...list, value] });
  };

  const getGoalSyncDescription = () => {
    const stressImpact = profile.stressLevel > 7 ? " WARNING: Critical systemic stress (High Cortisol). Recovery protocols prioritized." : "";
    const sleepImpact = profile.sleepHours < 6 ? " WARNING: Major sleep deficit. Anabolic markers potentially suppressed." : "";

    if (profile.medicalGoals.includes('Weight Loss')) {
      return {
        strategy: "Metabolic Deficit Architecture",
        logic: `Energy capped at 80% of TDEE (20% deficit) for fat oxidation.${sleepImpact}`,
        fitness: `Compound resistance focus. ${stressImpact}`
      };
    } else if (profile.medicalGoals.includes('Build Muscle') || profile.medicalGoals.includes('Weight Gain')) {
      return {
        strategy: "Anabolic Surplus Protocol",
        logic: `Energy scaled to 110% of TDEE (10% surplus) for MPS.${sleepImpact}`,
        fitness: `Hypertrophy specific volume targets.${stressImpact}`
      };
    }
    return {
      strategy: "Homeostatic Maintenance",
      logic: `Maintenance intake for systemic stability.${sleepImpact}`,
      fitness: `Functional strength and mobility focus.${stressImpact}`
    };
  };

  const syncInfo = getGoalSyncDescription();

  if (isRecalibrating) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col items-center justify-center p-8 animate-fadeIn">
        <div className="max-w-md w-full text-center space-y-12">
          <div className="relative glass p-16 rounded-[4rem] border-2 border-white/50 shadow-2xl flex flex-col items-center gap-8">
            <div className="relative">
               <div className="absolute inset-0 bg-brand/20 blur-2xl rounded-full scale-110 animate-pulse" />
               <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Personalizing Your Fitness DNA</h2>
          </div>
          <div className="space-y-6 flex flex-col items-center">
            <p className="text-xl font-bold text-slate-800 transition-all duration-500 min-h-[3rem] max-w-sm mx-auto flex items-center justify-center">
              {loadingPhases[synthesisPhase]}
            </p>
            <div className="w-full max-w-xs bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-brand transition-all duration-700 ease-in-out" style={{ width: `${((synthesisPhase + 1) / loadingPhases.length) * 100}%` }} />
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-2">Synchronizing your goals with your lifestyle...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fadeIn pb-24">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Biological Core</h2>
          <p className="text-slate-500 font-medium">System status and protocol configuration.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              if (isEditing) setEditForm(profile);
              setIsEditing(!isEditing);
            }} 
            className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 ${isEditing ? 'bg-slate-200 text-slate-600' : 'bg-brand text-white hover:bg-emerald-700'}`}
          >
            {isEditing ? <X size={18} /> : <Edit3 size={18} />}
            {isEditing ? 'Discard Changes' : 'Update Lifestyle'}
          </button>
          <button onClick={onSignOut} className="px-6 py-3 bg-white border-2 border-slate-100 text-red-500 rounded-2xl font-bold flex items-center gap-2 hover:bg-red-50 transition-all shadow-sm active:scale-95">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="animate-fadeIn space-y-12">
          {/* Section 1: Biometrics */}
          <div className="glass p-10 rounded-[3rem] shadow-sm border border-white space-y-8">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <User size={24} className="text-brand" /> 1. Biometric Vectors
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <EditInput label="Age" type="number" value={editForm.age} onChange={v => setEditForm({...editForm, age: Number(v)})} />
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Biological Sex</label>
                <select 
                  value={editForm.gender} 
                  onChange={e => setEditForm({...editForm, gender: e.target.value as any})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <EditInput label="Weight (kg)" type="number" value={editForm.weight} onChange={v => setEditForm({...editForm, weight: Number(v)})} />
              <div className="grid grid-cols-2 gap-2">
                <EditInput label="Height (Ft)" type="number" value={heightFt} onChange={v => setHeightFt(Number(v))} />
                <EditInput label="Height (In)" type="number" value={heightIn} onChange={v => setHeightIn(Number(v))} />
              </div>
            </div>
          </div>

          {/* Section 2: Lifestyle */}
          <div className="glass p-10 rounded-[3rem] shadow-sm border border-white space-y-8">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <Briefcase size={24} className="text-indigo-500" /> 2. Lifestyle Engine
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Occupation</label>
                <select 
                  value={editForm.occupation} 
                  onChange={e => setEditForm({...editForm, occupation: e.target.value as any})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="sitting">Office / Sitting</option>
                  <option value="standing">Retail / Standing</option>
                  <option value="heavy_lifting">Manual Labor</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Commute Style</label>
                <select 
                  value={editForm.commuteStyle} 
                  onChange={e => setEditForm({...editForm, commuteStyle: e.target.value as any})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="active">Active (Walk/Bike)</option>
                  <option value="passive">Passive (Car/Bus)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Activity Level (NEAT)</label>
                <select 
                  value={editForm.activityLevel} 
                  onChange={e => setEditForm({...editForm, activityLevel: e.target.value as any})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value={ActivityLevel.SEDENTARY}>Primarily Still</option>
                  <option value={ActivityLevel.MODERATELY_ACTIVE}>Consistent Movement</option>
                  <option value={ActivityLevel.VERY_ACTIVE}>Very Active</option>
                  <option value={ActivityLevel.ATHLETE}>Elite Athlete</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <EditInput label="Avg. Screen Time (Hrs/Day)" type="number" value={editForm.screenTime} onChange={v => setEditForm({...editForm, screenTime: Number(v)})} />
              <EditInput label="Avg. Sleep Duration (Hrs/Day)" type="number" value={editForm.sleepHours} onChange={v => setEditForm({...editForm, sleepHours: Number(v)})} />
            </div>
          </div>

          {/* Section 3: Training & Preferences */}
          <div className="glass p-10 rounded-[3rem] shadow-sm border border-white space-y-8">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <Dumbbell size={24} className="text-amber-500" /> 3. Training & Recovery
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Stress Level (1-10)</label>
                <input type="range" min="1" max="10" value={editForm.stressLevel} onChange={e => setEditForm({...editForm, stressLevel: Number(e.target.value)})} className="w-full accent-brand" />
                <div className="flex justify-between text-[8px] font-bold text-slate-400 mt-1"><span>MIN</span><span>CRITICAL</span></div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Stimulant Habits</label>
                <select 
                  value={editForm.habits} 
                  onChange={e => setEditForm({...editForm, habits: e.target.value as any})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="none">None / Low</option>
                  <option value="occasional">Occasional</option>
                  <option value="frequent">Frequent</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Equipment Access</label>
                <select 
                  value={editForm.equipment} 
                  onChange={e => setEditForm({...editForm, equipment: e.target.value as any})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value={Equipment.BODYWEIGHT}>Bodyweight Only</option>
                  <option value={Equipment.DUMBBELLS}>Basic Home (DBs)</option>
                  <option value={Equipment.FULL_GYM}>Full Commercial Gym</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Dietary Patterns & Health Priorities */}
          <div className="glass p-10 rounded-[3rem] shadow-sm border border-white space-y-10">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <Apple size={24} className="text-red-500" /> 4. Strategy & Constraints
            </h3>
            
            <div className="space-y-6">
               <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">Dietary Patterns</h4>
               <div className="flex flex-wrap gap-2">
                  {DIETARY_LIST.map(opt => (
                    <button 
                      key={opt}
                      onClick={() => toggleList('dietaryPatterns', opt)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${editForm.dietaryPatterns.includes(opt) ? 'bg-brand text-white border-brand' : 'bg-slate-50 text-slate-500 border-slate-100'}`}
                    >
                      {opt}
                    </button>
                  ))}
               </div>
            </div>

            <div className="space-y-10">
               <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Medical & Performance Goals</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div>
                    <h5 className="text-[9px] font-black text-slate-300 uppercase mb-3">Performance</h5>
                    <div className="flex flex-wrap gap-2">
                      {PERFORMANCE_TARGETS.map(g => (
                        <button 
                          key={g} 
                          onClick={() => toggleList('medicalGoals', g)} 
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${editForm.medicalGoals.includes(g) ? 'bg-brand text-white border-brand' : 'bg-white text-slate-400 border-slate-100'}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-[9px] font-black text-slate-300 uppercase mb-3">Clinical</h5>
                    <div className="flex flex-wrap gap-2">
                      {CLINICAL_TARGETS.map(g => (
                        <button key={g} onClick={() => toggleList('medicalGoals', g)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${editForm.medicalGoals.includes(g) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-400 border-slate-100'}`}>{g}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-[9px] font-black text-slate-300 uppercase mb-3">Religious / Ethical</h5>
                    <div className="flex flex-wrap gap-2">
                      {RELIGIOUS_ETHICAL.map(g => (
                        <button key={g} onClick={() => toggleList('medicalGoals', g)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${editForm.medicalGoals.includes(g) ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-100'}`}>{g}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-[9px] font-black text-slate-300 uppercase mb-3">Health & Clarity</h5>
                    <div className="flex flex-wrap gap-2">
                      {HEALTH_CLARITY.map(g => (
                        <button key={g} onClick={() => toggleList('medicalGoals', g)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${editForm.medicalGoals.includes(g) ? 'bg-brand text-white border-brand' : 'bg-white text-slate-400 border-slate-100'}`}>{g}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-[9px] font-black text-slate-300 uppercase mb-3">Sensitivity / Allergens</h5>
                    <div className="flex flex-wrap gap-2">
                      {SENSITIVITY.map(g => (
                        <button key={g} onClick={() => toggleList('medicalGoals', g)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${editForm.medicalGoals.includes(g) ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-400 border-slate-100'}`}>{g}</button>
                      ))}
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="sticky bottom-8 z-50 glass p-6 rounded-[2.5rem] shadow-2xl border-2 border-brand/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand/10 text-brand rounded-2xl"><Zap size={24} /></div>
              <div>
                <h4 className="font-bold text-slate-800">Recalibrate Protocol</h4>
                <p className="text-xs text-slate-500">Regenerate all Weekly Nutrition and Fitness plans based on new goals.</p>
              </div>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
               <button 
                onClick={() => setIsEditing(false)} 
                className="flex-1 md:px-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
               >
                 Cancel
               </button>
               <button 
                onClick={handleUpdateGoals} 
                className="flex-[2] md:px-10 py-4 bg-brand text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all"
               >
                 <Sparkles size={18} /> Update Goals & Recalibrate
               </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Biometric Snapshot */}
          <div className="lg:col-span-1 space-y-8">
            <div className="glass p-10 rounded-[3rem] shadow-xl border border-white text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <User size={120} />
              </div>
              <div className="w-24 h-24 bg-brand rounded-3xl mx-auto flex items-center justify-center text-white text-4xl font-black mb-6 shadow-2xl shadow-emerald-200">
                {profile.gender[0].toUpperCase()}
              </div>
              <h3 className="text-3xl font-black text-slate-800">{profile.age} <span className="text-sm font-medium text-slate-400 uppercase tracking-widest">Yrs</span></h3>
              <p className="text-slate-500 font-bold mb-8 uppercase tracking-widest text-[10px]">Primary Identity</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-brand uppercase tracking-widest mb-1">Weight</p>
                  <h4 className="text-2xl font-black text-brand">{profile.weight}kg</h4>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">BMI</p>
                  <h4 className="text-2xl font-black text-blue-600">{bmi}</h4>
                </div>
              </div>
            </div>

            <div className="glass p-10 rounded-[3.5rem] shadow-sm border border-white">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                <Crosshair size={22} className="text-brand" /> 
                Dynamic Bio-Targets
              </h3>
              <div className="space-y-6">
                <TargetBar label="Energy Load" value={Math.round(profile.tdee)} unit="kcal/day" color="bg-brand" progress={(profile.tdee / 3500) * 100} />
                <TargetBar label="Protein Synthesis" value={Math.round(profile.macros.protein)} unit="g/day" color="bg-emerald-500" progress={(profile.macros.protein / 250) * 100} />
                <TargetBar label="Carbohydrate Fuel" value={Math.round(profile.macros.carbs)} unit="g/day" color="bg-blue-500" progress={(profile.macros.carbs / 400) * 100} />
                <TargetBar label="Lipid Density" value={Math.round(profile.macros.fats)} unit="g/day" color="bg-amber-500" progress={(profile.macros.fats / 120) * 100} />
              </div>
            </div>
          </div>

          {/* Center/Right Column: Protocol and History */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass p-10 rounded-[3.5rem] shadow-sm border border-white bg-white/40">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold flex items-center gap-3">
                  <BrainCircuit size={24} className="text-indigo-500" /> Lifestyle Architecture
                </h3>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase">NEAT Calibrated</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Routine Context</h4>
                  <div className="space-y-3">
                    <LifestyleItem icon={<Briefcase />} label="Job Nature" value={profile.occupation.replace('_', ' ')} />
                    <LifestyleItem icon={<Footprints />} label="Commute Logic" value={profile.commuteStyle} />
                    <LifestyleItem icon={<Monitor />} label="Daily Screen" value={`${profile.screenTime} Hrs`} />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Recovery Bio-Engine</h4>
                  <div className="space-y-3">
                    <LifestyleItem icon={<Moon />} label="Sleep Cycle" value={`${profile.sleepHours} Hrs (${profile.sleepQuality})`} />
                    <LifestyleItem icon={<BatteryCharging />} label="Stress Load" value={`${profile.stressLevel}/10`} />
                    <LifestyleItem icon={<Wine />} label="Habit Profile" value={profile.habits} />
                  </div>
                </div>
              </div>
            </div>

            {/* Goal Specific Synchronization Blueprint */}
            <div className="glass p-10 rounded-[3.5rem] shadow-xl border-2 border-brand/20 bg-emerald-50/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 text-brand/10 pointer-events-none">
                <Layers size={140} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-brand text-white rounded-xl">
                    <Zap size={20} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">Synchronization Blueprint</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-brand uppercase tracking-widest mb-2">Strategy Model</h4>
                      <p className="text-lg font-black text-slate-800">{syncInfo.strategy}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Metabolic Logic</h4>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">
                        {syncInfo.logic}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="p-6 bg-white rounded-[2.5rem] border border-emerald-100 shadow-sm">
                        <h4 className="text-xs font-bold text-brand uppercase tracking-widest mb-3 flex items-center gap-2">
                          <Dumbbell size={14} /> Training Integration
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {syncInfo.fitness}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <ShieldCheck size={14} className="text-brand" /> 
                      Plan updated based on current fatigue sensors.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* History Analytics Calendar */}
            <div className="glass p-10 rounded-[3.5rem] shadow-sm border border-white">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-bold flex items-center gap-3"><History size={24} className="text-brand" /> Biometric Logs</h3>
                <input 
                  type="date" 
                  value={historyDate} 
                  onChange={(e) => setHistoryDate(e.target.value)} 
                  className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-brand shadow-inner" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="flex items-center justify-between p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative overflow-hidden group">
                      <div className="relative z-10">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Session Adherence</p>
                        <h4 className="text-5xl font-black text-slate-800 tracking-tighter">{accuracy}%</h4>
                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full mt-4 inline-block ${getStatus() === 'Optimal' ? 'bg-emerald-100 text-brand' : 'bg-amber-100 text-amber-600'}`}>
                          {getStatus()}
                        </span>
                      </div>
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-brand shadow-2xl transition-transform group-hover:scale-110">
                        {getStatus() === 'Optimal' ? <CheckCircle className="text-brand" size={32} /> : getStatus() === 'Surplus' ? <TrendingUp className="text-amber-500" size={32} /> : <TrendingDown className="text-blue-500" size={32} />}
                      </div>
                  </div>
                  
                  <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Event Logs</p>
                      {selectedMeals.map(m => (
                        <div key={m.id} className="flex justify-between items-center px-6 py-4 bg-white border border-slate-50 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3">
                            <Apple size={16} className="text-brand" />
                            <span className="text-xs font-bold text-slate-700">{m.name}</span>
                          </div>
                          <span className="text-xs font-black text-brand">{m.calories} kcal</span>
                        </div>
                      ))}
                      {selectedMeals.length === 0 && (
                        <div className="text-center py-12 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                          <History size={32} className="mx-auto text-slate-200 mb-2" />
                          <p className="text-slate-400 text-xs italic">No entries for this coordinate.</p>
                        </div>
                      )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 relative group h-fit">
                      <div className="absolute top-4 right-4 text-brand/20 group-hover:rotate-12 transition-transform">
                        <Layers size={24} />
                      </div>
                      <p className="text-xs text-brand font-black uppercase tracking-widest mb-4">Historical Insight</p>
                      <p className="text-sm text-emerald-800 leading-relaxed italic font-medium">
                        "On {new Date(historyDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}, 
                        your nutritional accuracy reached {accuracy}%. Systemic alignment indicates {getStatus().toLowerCase()} performance."
                      </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EditInput = ({ label, type, value, onChange }: { label: string, type: string, value: string | number, onChange: (v: string) => void }) => (
  <div>
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{label}</label>
    <input 
      type={type} 
      value={value} 
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-brand shadow-sm" 
    />
  </div>
);

const LifestyleItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="flex items-center gap-4 p-4 bg-white border border-slate-50 rounded-2xl shadow-sm hover:border-indigo-100 transition-all group">
    <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
      {React.cloneElement(icon as React.ReactElement, { size: 18 })}
    </div>
    <div>
      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-xs font-bold text-slate-800 capitalize">{value}</p>
    </div>
  </div>
);

const TargetBar = ({ label, value, unit, color, progress }: { label: string, value: number, unit: string, color: string, progress: number }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-end px-1">
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">{label}</span>
      </div>
      <p className="font-black text-slate-800 text-sm">
        {value} <span className="text-[10px] text-slate-400 font-normal">{unit}</span>
      </p>
    </div>
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div 
        className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`} 
        style={{ width: `${Math.min(100, progress)}%` }} 
      />
    </div>
  </div>
);

export default ProfileView;
