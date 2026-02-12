
import React, { useState, useEffect } from 'react';
import { UserProfile, ActivityLevel, Equipment } from '../types';
import { ACTIVITY_LEVEL_MULTIPLIERS } from '../constants';
import { generateWeeklyMealPlan, generateWeeklyWorkoutPlan } from '../services/geminiService';
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Briefcase, 
  Footprints, 
  Monitor, 
  Zap, 
  Activity, 
  Heart, 
  Shield, 
  LogOut, 
  Loader2, 
  Sparkles,
  Dna,
  Cpu
} from 'lucide-react';

interface OnboardingProps {
  userId: string;
  onComplete: (profile: UserProfile) => void;
  onCancel: () => void;
}

const getWeekStart = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const Onboarding: React.FC<OnboardingProps> = ({ userId, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(10);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisPhase, setSynthesisPhase] = useState(0);
  
  const [form, setForm] = useState<Partial<UserProfile>>({
    age: 0,
    gender: undefined,
    weight: 0,
    height: 0,
    activityLevel: undefined,
    dietaryPatterns: [],
    allergies: [],
    medicalGoals: [],
    equipment: undefined,
    occupation: undefined,
    commuteStyle: undefined,
    screenTime: 0,
    sleepHours: 0,
    sleepQuality: 'good',
    stressLevel: 5,
    habits: undefined
  });

  const totalCm = Math.round((heightFt * 30.48) + (heightIn * 2.54));

  useEffect(() => {
    setForm(prev => ({ ...prev, height: totalCm }));
  }, [heightFt, heightIn, totalCm]);

  const CLINICAL_TARGETS_LIST = ['Weight Loss', 'Weight Gain', 'PCOS/Hormonal Balance', 'Gut Health (Probiotics)', 'Heart Health (Low Na/Sat Fat)', 'Diabetic Friendly'];
  const PERFORMANCE_TARGETS_LIST = ['Body Recomposition', 'Endurance Training (5k/Marathon)', 'Flexibility & Mobility', 'Build Muscle'];

  const loadingPhases = [
    "Calibrating baseline biometrics (Age, Gender, Weight, Height)...",
    "Integrating Occupational Routine and NEAT levels into your daily energy budget...",
    "Cross-referencing Stress Thresholds with Sleep Duration to calculate Bio-Readiness...",
    "Filtering nutritional database for your specific Dietary Strategy...",
    `Finalizing protocol for ${form.medicalGoals?.filter(g => PERFORMANCE_TARGETS_LIST.includes(g))[0] || 'Performance'} and ${form.medicalGoals?.filter(g => CLINICAL_TARGETS_LIST.includes(g))[0] || 'Clinical Target'}...`
  ];

  useEffect(() => {
    let interval: any;
    if (isSynthesizing) {
      interval = setInterval(() => {
        setSynthesisPhase(prev => (prev < loadingPhases.length - 1 ? prev + 1 : prev));
      }, 2500);
    } else {
      setSynthesisPhase(0);
    }
    return () => clearInterval(interval);
  }, [isSynthesizing, loadingPhases.length]);

  const DIETARY_OPTIONS = [
    { id: 'Vegetarian', title: 'Vegetarian Only', desc: 'Plant-based + dairy (No Meat)' },
    { id: 'Egg-atarian', title: 'Egg-atarian', desc: 'Vegetarian + Eggs' },
    { id: 'Standard', title: 'Standard', desc: 'No specific restrictions' },
    { id: 'High Protein', title: 'High Protein', desc: 'Lean meats and dairy focus' },
    { id: 'Pescatarian', title: 'Pescatarian', desc: 'Plant-based + Seafood' },
    { id: 'No Onion/Garlic', title: 'No Onion/Garlic', desc: 'Vegetarian excluding aromatics' },
    { id: 'Jain', title: 'Jain Diet', desc: 'No root vegetables or eggs' },
    { id: 'High-Fiber', title: 'High-Fiber', desc: 'Seeds, nuts, and complex carb focus' },
    { id: 'Keto', title: 'Ketogenic', desc: 'High fat, very low carb focus' }
  ];

  const CLINICAL_TARGETS = CLINICAL_TARGETS_LIST;
  const PERFORMANCE_TARGETS = PERFORMANCE_TARGETS_LIST;

  const GOAL_OPTIONS = [
    { cat: 'CLINICAL TARGETS', items: CLINICAL_TARGETS },
    { cat: 'PERFORMANCE', items: PERFORMANCE_TARGETS },
    { cat: 'RELIGIOUS / ETHICAL', items: ['Halal', 'Kosher', 'Sattvic'] },
    { cat: 'HEALTH & CLARITY', items: ['Mental Clarity (Omega-3)', 'Longevity Focus'] },
    { cat: 'SENSITIVITY / ALLERGENS', items: ['Nut-free', 'Soy-free', 'Dairy-free', 'Shellfish-free', 'FODMAP Friendly'] }
  ];

  const isStepValid = () => {
    switch (step) {
      case 1:
        return (form.age || 0) > 0 && (form.weight || 0) > 0 && heightFt > 0 && !!form.gender;
      case 2:
        return !!form.occupation && !!form.commuteStyle && !!form.activityLevel && (form.screenTime || 0) > 0;
      case 3:
        return (form.sleepHours || 0) > 0 && !!form.habits && !!form.equipment;
      case 4:
        return (form.dietaryPatterns?.length || 0) > 0;
      case 5:
        const hasClinical = form.medicalGoals?.some(goal => CLINICAL_TARGETS.includes(goal));
        const hasPerformance = form.medicalGoals?.some(goal => PERFORMANCE_TARGETS.includes(goal));
        return !!hasClinical && !!hasPerformance;
      default:
        return false;
    }
  };

  const calculateTDEE = (f: Partial<UserProfile>) => {
    let bmr = (10 * f.weight!) + (6.25 * f.height!) - (5 * f.age!) + (f.gender === 'male' ? 5 : -161);
    const multiplier = ACTIVITY_LEVEL_MULTIPLIERS[f.activityLevel as ActivityLevel];
    
    let neatAdj = 1.0;
    if (f.occupation === 'standing') neatAdj += 0.05;
    if (f.occupation === 'heavy_lifting') neatAdj += 0.12;
    if (f.commuteStyle === 'active') neatAdj += 0.04;
    if (f.screenTime! > 9) neatAdj -= 0.03;

    const maintenance = bmr * multiplier * neatAdj;

    let adjustedTdee = maintenance;
    if (f.medicalGoals?.includes('Weight Loss')) {
      adjustedTdee = maintenance * 0.80; 
    } else if (f.medicalGoals?.includes('Weight Gain') || f.medicalGoals?.includes('Build Muscle')) {
      adjustedTdee = maintenance * 1.10; 
    }

    return { maintenance, adjustedTdee };
  };

  const calculateMacros = (tdee: number, f: Partial<UserProfile>) => {
    const isMuscleFocus = f.medicalGoals?.some(g => ['Build Muscle', 'Body Recomposition'].includes(g));
    const proteinRatio = isMuscleFocus ? 0.35 : 0.30;
    const fatRatio = 0.25;
    const carbRatio = 1 - proteinRatio - fatRatio;

    return {
      protein: (tdee * proteinRatio) / 4,
      carbs: (tdee * carbRatio) / 4,
      fats: (tdee * fatRatio) / 9
    };
  };

  const toggleList = (key: 'dietaryPatterns' | 'medicalGoals', value: string) => {
    const list = form[key] || [];
    setForm({ ...form, [key]: list.includes(value) ? list.filter(v => v !== value) : [...list, value] });
  };

  const handleSubmit = async () => {
    setIsSynthesizing(true);
    
    try {
      const { maintenance, adjustedTdee } = calculateTDEE(form);
      const macros = calculateMacros(adjustedTdee, form);
      const profile = { ...form, baseTdee: maintenance, tdee: adjustedTdee, macros } as UserProfile;
      
      const weekStart = getWeekStart(new Date()).toString();

      // Parallel AI generation
      const [mealPlan, workoutPlan] = await Promise.all([
        generateWeeklyMealPlan(profile),
        generateWeeklyWorkoutPlan(profile)
      ]);

      localStorage.setItem(`aurafit_weekly_meal_plan_${userId}`, JSON.stringify(mealPlan));
      localStorage.setItem(`aurafit_meal_plan_week_start_${userId}`, weekStart);
      localStorage.setItem(`aurafit_weekly_workout_plan_${userId}`, JSON.stringify(workoutPlan));
      localStorage.setItem(`aurafit_workout_plan_week_start_${userId}`, weekStart);

      onComplete(profile);
    } catch (error) {
      console.error("Synthesis error:", error);
      alert("Metabolic synthesis timed out. Our AI core is overloaded. Please try again.");
      setIsSynthesizing(false);
    }
  };

  if (isSynthesizing) {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-50 flex flex-col items-center justify-center p-8 animate-fadeIn">
        <div className="max-w-md w-full text-center space-y-12">
          {/* Main Card with Loader */}
          <div className="relative glass p-16 rounded-[4rem] border-2 border-white/50 shadow-2xl flex flex-col items-center gap-8">
            <div className="relative">
               <div className="absolute inset-0 bg-brand/20 blur-2xl rounded-full scale-110 animate-pulse" />
               <div className="w-16 h-16 border-4 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Personalizing Your Fitness DNA</h2>
          </div>

          {/* Rotating Message and Progress Section */}
          <div className="space-y-6 flex flex-col items-center">
            <p className="text-xl font-bold text-slate-800 transition-all duration-500 min-h-[3rem] max-w-sm mx-auto flex items-center justify-center">
              {loadingPhases[synthesisPhase]}
            </p>
            
            <div className="w-full max-w-xs bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand transition-all duration-700 ease-in-out" 
                style={{ width: `${((synthesisPhase + 1) / loadingPhases.length) * 100}%` }} 
              />
            </div>
            
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-2">
              Synchronizing your goals with your lifestyle...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      <button 
        onClick={onCancel} 
        className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-500 font-bold text-xs uppercase tracking-widest transition-all z-10"
      >
        <LogOut size={16} /> Exit to Login
      </button>

      <div className="max-w-3xl w-full glass rounded-[3.5rem] p-12 shadow-2xl animate-fadeIn border border-white">
        <div className="mb-10 text-center">
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} className={`h-1.5 w-10 rounded-full transition-all duration-500 ${s <= step ? 'bg-brand shadow-sm' : 'bg-slate-200'}`} />
            ))}
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            {step === 1 && "Basic Biometrics"}
            {step === 2 && "Lifestyle Engine"}
            {step === 3 && "Bio-Engine Recovery"}
            {step === 4 && "Dietary Strategy"}
            {step === 5 && "Health Priorities"}
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Step {step} of 5: Tailoring your AI environment</p>
        </div>

        <div className="min-h-[420px]">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Input label="Age (Years)" value={form.age || ''} onChange={v => setForm({...form, age: Number(v)})} />
               <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Biological Sex</label>
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                    {['male', 'female'].map(g => (
                      <button 
                        key={g} 
                        onClick={() => setForm({...form, gender: g as any})} 
                        className={`flex-1 py-3 rounded-xl text-sm font-bold capitalize transition-all ${form.gender === g ? 'bg-white text-brand shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
               </div>
               <Input label="Weight (kg)" value={form.weight || ''} onChange={v => setForm({...form, weight: Number(v)})} />
               <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Height (Ft / In)</label>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="relative">
                     <input type="number" value={heightFt || ''} onChange={e => setHeightFt(Number(e.target.value))} className="w-full px-6 py-4 bg-slate-100 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-brand outline-none transition-all" />
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">FT</span>
                   </div>
                   <div className="relative">
                     <input type="number" value={heightIn || ''} onChange={e => setHeightIn(Number(e.target.value))} className="w-full px-6 py-4 bg-slate-100 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-brand outline-none transition-all" />
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">IN</span>
                   </div>
                 </div>
                 <div className="mt-2 text-center md:text-left">
                    <p className="text-xs font-black text-brand tracking-tight">
                      {totalCm} <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">total cms</span>
                    </p>
                 </div>
               </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-4">Occupational Routine</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'sitting', title: 'Office / Sitting', icon: <Briefcase size={20} /> },
                    { id: 'standing', title: 'Retail / Standing', icon: <Footprints size={20} /> },
                    { id: 'heavy_lifting', title: 'Manual Labor', icon: <Zap size={20} /> }
                  ].map(occ => (
                    <button 
                      key={occ.id}
                      onClick={() => setForm({...form, occupation: occ.id as any})}
                      className={`p-6 rounded-[2rem] border-2 font-bold text-xs transition-all flex flex-col items-center gap-3 ${form.occupation === occ.id ? 'border-brand bg-emerald-50 text-brand shadow-md shadow-emerald-100' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                    >
                      {occ.icon}
                      {occ.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Commute Energy</label>
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                    {[
                      { id: 'active', label: 'Active (Walk/Bike)' },
                      { id: 'passive', label: 'Passive (Car/Bus)' }
                    ].map(c => (
                      <button 
                        key={c.id} 
                        onClick={() => setForm({...form, commuteStyle: c.id as any})} 
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${form.commuteStyle === c.id ? 'bg-white text-brand shadow-md' : 'text-slate-400'}`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Input label="Avg. Screen Time (Hrs/Day)" value={form.screenTime || ''} onChange={v => setForm({...form, screenTime: Number(v)})} />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-4">Non-Exercise Activity (NEAT)</label>
                <div className="grid grid-cols-2 gap-4">
                  <SelectOption active={form.activityLevel === ActivityLevel.SEDENTARY} onClick={() => setForm({...form, activityLevel: ActivityLevel.SEDENTARY})} title="Primarily Still" desc="Minimal daily movement." />
                  <SelectOption active={form.activityLevel === ActivityLevel.MODERATELY_ACTIVE} onClick={() => setForm({...form, activityLevel: ActivityLevel.MODERATELY_ACTIVE})} title="Consistent Movement" desc="Lightly active most days." />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Input label="Sleep Duration (Hrs)" value={form.sleepHours || ''} onChange={v => setForm({...form, sleepHours: Number(v)})} />
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Stress Threshold (1-10)</label>
                    <input type="range" min="1" max="10" value={form.stressLevel} onChange={e => setForm({...form, stressLevel: Number(e.target.value)})} className="mt-4 accent-brand h-2 rounded-full cursor-pointer" />
                    <div className="flex justify-between text-[10px] font-black text-slate-400"><span>OPTIMIZED</span><span>CRITICAL STRESS</span></div>
                  </div>
               </div>

               <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-4">Habit Profile (Stimulants/Alcohol)</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'none', label: 'None/Low' },
                    { id: 'occasional', label: 'Occasional' },
                    { id: 'frequent', label: 'Frequent' }
                  ].map(h => (
                    <button 
                      key={h.id}
                      onClick={() => setForm({...form, habits: h.id as any})}
                      className={`py-4 rounded-2xl border-2 font-bold text-xs capitalize transition-all ${form.habits === h.id ? 'border-brand bg-emerald-50 text-brand shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
               </div>

               <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 block mb-4">Gym Equipment Access</label>
                <div className="grid grid-cols-3 gap-4">
                    {[
                      { id: Equipment.BODYWEIGHT, title: 'No Equip', icon: <Activity size={16} /> },
                      { id: Equipment.DUMBBELLS, title: 'Basic Home', icon: <Heart size={16} /> },
                      { id: Equipment.FULL_GYM, title: 'Full Commercial', icon: <Shield size={16} /> }
                    ].map(eq => (
                      <button 
                        key={eq.id} 
                        onClick={() => setForm({...form, equipment: eq.id as any})} 
                        className={`p-4 rounded-2xl border-2 font-bold text-xs transition-all flex flex-col items-center gap-2 ${form.equipment === eq.id ? 'border-brand bg-emerald-50 text-brand shadow-sm' : 'border-slate-100 bg-slate-50 text-slate-400'}`}
                      >
                        {eq.icon}
                        {eq.title}
                      </button>
                    ))}
                </div>
               </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {DIETARY_OPTIONS.map(opt => (
                 <button key={opt.id} onClick={() => toggleList('dietaryPatterns', opt.id)} className={`p-6 rounded-[2.5rem] border-2 text-left transition-all relative ${form.dietaryPatterns?.includes(opt.id) ? 'border-brand bg-emerald-50 shadow-sm' : 'border-slate-100 bg-white'}`}>
                    <div className="flex justify-between items-start">
                       <div><p className="text-base font-bold text-slate-800">{opt.title}</p><p className="text-xs text-slate-400 font-medium mt-1 leading-tight">{opt.desc}</p></div>
                       <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.dietaryPatterns?.includes(opt.id) ? 'bg-brand border-brand' : 'border-slate-200'}`}>{form.dietaryPatterns?.includes(opt.id) && <Check size={12} className="text-white" />}</div>
                    </div>
                 </button>
               ))}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-10 max-h-[460px] overflow-y-auto pr-3 custom-scrollbar pb-8">
               {GOAL_OPTIONS.map(cat => (
                 <div key={cat.cat} className="space-y-5">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      {cat.cat}
                      {(cat.cat === 'CLINICAL TARGETS' || cat.cat === 'PERFORMANCE') && (
                        <span className="text-[8px] bg-brand/10 text-brand px-1.5 py-0.5 rounded-full ml-1">REQUIRED</span>
                      )}
                    </h4>
                    <div className="flex flex-wrap gap-2.5">
                       {cat.items.map(goal => (
                         <button 
                            key={goal} 
                            onClick={() => toggleList('medicalGoals', goal)} 
                            className={`px-6 py-2.5 rounded-full border text-sm font-bold transition-all ${
                              form.medicalGoals?.includes(goal) 
                                ? 'bg-brand/10 text-brand border-brand shadow-sm' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-brand/40'
                            }`}
                          >
                            {goal}
                          </button>
                       ))}
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>

        <div className="mt-12 flex gap-4">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 py-5 bg-white border-2 border-slate-100 text-slate-600 rounded-3xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              <ChevronLeft size={20} /> Back
            </button>
          )}
          <button 
            onClick={() => step === 5 ? handleSubmit() : setStep(s => s + 1)} 
            disabled={!isStepValid()}
            className={`flex-[2] py-5 text-white rounded-3xl font-bold flex items-center justify-center gap-3 transition-all ${
              isStepValid() 
                ? 'bg-brand hover:bg-emerald-700 shadow-xl shadow-emerald-100' 
                : 'bg-slate-300 cursor-not-allowed opacity-70'
            }`}
          >
            {step === 5 ? 'Synthesize Profile' : 'Proceed'} <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input type="number" value={value} onChange={e => onChange(e.target.value)} className="w-full px-6 py-4 bg-slate-100 border-none rounded-2xl text-slate-900 font-bold focus:ring-2 focus:ring-brand outline-none transition-all" />
  </div>
);

const SelectOption = ({ active, onClick, title, desc }) => (
  <button onClick={onClick} className={`p-6 rounded-[2rem] border-2 text-left transition-all flex justify-between items-center ${active ? 'border-brand bg-emerald-50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
    <div><p className="font-bold text-slate-900">{title}</p><p className="text-xs text-slate-400 mt-1">{desc}</p></div>
    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${active ? 'bg-brand border-brand' : 'border-slate-200'}`}>{active && <Check size={14} className="text-white" />}</div>
  </button>
);

export default Onboarding;
