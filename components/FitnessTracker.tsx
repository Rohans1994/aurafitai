
import React, { useState, useEffect } from 'react';
import { WorkoutPlan, UserProfile, WeeklyWorkoutPlan } from '../types';
import { generateDailyWorkout, generateWeeklyWorkoutPlan, generateSpecializedWorkout, recalibrateRemainingPlan } from '../services/geminiService';
import { Zap, CheckCircle2, Loader2, HelpCircle, Shield, X, ChevronDown, ChevronUp, Activity, User, Sparkles, AlertCircle, RefreshCw, Lock } from 'lucide-react';

interface FitnessTrackerProps {
  userId: string;
  profile: UserProfile;
  workouts: WorkoutPlan[];
  onAddWorkout: (w: WorkoutPlan) => void;
  fatigue: number;
  setFatigue: (v: number) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const WORKOUT_SPLITS = [
  { id: 'upper_push', label: 'Upper Body Push', sub: 'Lateral Deltoid, Triceps, Chest, Front Shoulders' },
  { id: 'upper_pull', label: 'Upper Body Pull', sub: 'Biceps, Traps (mid-back), Lats, Rear Shoulders' },
  { id: 'lower_push', label: 'Lower Body Push', sub: 'Calves, Glutes, Quads' },
  { id: 'lower_pull', label: 'Lower Body Pull', sub: 'Calves, Glutes, Hamstrings' },
  { id: 'core', label: 'Core', sub: 'Lower back, Abdominals, Obliques' },
  { id: 'arms', label: 'Arms', sub: 'Biceps, Triceps' },
  { id: 'shoulders', label: 'Shoulders', sub: 'Front Shoulders, Rear Shoulders' },
  { id: 'full_body', label: 'Full Body', sub: 'Glutes, Hamstrings, Lats, Quads, Chest, Front Shoulders, Rear Shoulders' }
];

const MUSCLE_REGIONS = [
  { id: 'chest', label: 'CHEST' },
  { id: 'abs', label: 'ABDOMINALS' },
  { id: 'shoulders', label: 'SHOULDERS' },
  { id: 'biceps', label: 'BICEPS' },
  { id: 'triceps', label: 'TRICEPS' },
  { id: 'quads', label: 'QUADS' },
  { id: 'traps', label: 'TRAPS' },
  { id: 'lats', label: 'LATS' },
  { id: 'glutes', label: 'GLUTES' },
  { id: 'hamstrings', label: 'HAMSTRINGS' },
  { id: 'calves', label: 'CALVES' },
  { id: 'lower_back', label: 'LOWER BACK' }
];

const getWeekStart = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const FitnessTracker: React.FC<FitnessTrackerProps> = ({ userId, profile, workouts, onAddWorkout, fatigue, setFatigue }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyWorkoutPlan | null>(null);
  const [activeDay, setActiveDay] = useState(DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
  const [showFatigueInfo, setShowFatigueInfo] = useState(false);
  const [hasAdjustedToday, setHasAdjustedToday] = useState(false);
  
  // Targeted Selection State
  const [selectedSplit, setSelectedSplit] = useState<string>('');
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);

  const todayDate = new Date();
  const todayKey = todayDate.toDateString();
  const currentDayName = DAYS[todayDate.getDay() === 0 ? 6 : todayDate.getDay() - 1];
  const isTodayActive = activeDay === currentDayName;

  useEffect(() => {
    const saved = localStorage.getItem(`aurafit_weekly_workout_plan_${userId}`);
    const savedWeek = localStorage.getItem(`aurafit_workout_plan_week_start_${userId}`);
    const currentWeekStart = getWeekStart(new Date());
    
    if (saved && savedWeek === currentWeekStart.toString()) {
      setWeeklyPlan(JSON.parse(saved));
    }

    const adjustmentKey = `aurafit_protocol_adjusted_${userId}_${todayKey}`;
    setHasAdjustedToday(localStorage.getItem(adjustmentKey) === 'true');
  }, [userId, todayKey]);

  const markAdjustmentDone = () => {
    const adjustmentKey = `aurafit_protocol_adjusted_${userId}_${todayKey}`;
    localStorage.setItem(adjustmentKey, 'true');
    setHasAdjustedToday(true);
  };

  const handleGenerateWeekly = async () => {
    setIsGenerating(true);
    try {
      const plan = await generateWeeklyWorkoutPlan(profile);
      setWeeklyPlan(plan);
      localStorage.setItem(`aurafit_weekly_workout_plan_${userId}`, JSON.stringify(plan));
      localStorage.setItem(`aurafit_workout_plan_week_start_${userId}`, getWeekStart(new Date()).toString());
    } catch (error) {
      alert("Performance engine timeout.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRecalibrate = async () => {
    if (!weeklyPlan || hasAdjustedToday) return;
    setIsGenerating(true);
    try {
      // Find missed days up to today
      const todayIdx = DAYS.indexOf(currentDayName);
      const missed = DAYS.slice(0, todayIdx).filter(day => {
        const plan = weeklyPlan[day];
        return plan && !plan.completed && !workouts.some(w => w.id === plan.id && w.completed);
      });

      const updatedPlan = await recalibrateRemainingPlan(profile, weeklyPlan, missed);
      setWeeklyPlan(updatedPlan);
      localStorage.setItem(`aurafit_weekly_workout_plan_${userId}`, JSON.stringify(updatedPlan));
      markAdjustmentDone();
    } catch (error) {
      console.error(error);
      alert("Recalibration engine failed. Matrix unstable.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateTargeted = async () => {
    if (!selectedSplit && selectedMuscles.length === 0) return;
    setIsGenerating(true);
    try {
      const targetLabel = selectedMuscles.length > 0 
        ? `Muscle Specific: ${selectedMuscles.join(', ')}` 
        : WORKOUT_SPLITS.find(s => s.id === selectedSplit)?.label;
        
      const workout = await generateSpecializedWorkout(profile, targetLabel || 'Targeted', selectedMuscles);
      const newPlan = { ...weeklyPlan, [currentDayName]: { ...workout, dayName: currentDayName } };
      setWeeklyPlan(newPlan as any);
      localStorage.setItem(`aurafit_weekly_workout_plan_${userId}`, JSON.stringify(newPlan));
      markAdjustmentDone();
    } catch (error) {
      console.error(error);
      alert("Failed to generate targeted workout.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFatigueChange = async (val: number) => {
    if (hasAdjustedToday) return;
    setFatigue(val);
    if (!weeklyPlan) return;

    setIsGenerating(true);
    try {
      const updatedToday = await generateDailyWorkout(profile, val, "Dynamic fatigue adjust");
      const newPlan = { ...weeklyPlan, [currentDayName]: { ...updatedToday, dayName: currentDayName } };
      setWeeklyPlan(newPlan);
      localStorage.setItem(`aurafit_weekly_workout_plan_${userId}`, JSON.stringify(newPlan));
      markAdjustmentDone();
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleComplete = (exIndex: number) => {
    if (!weeklyPlan || !isTodayActive) return; 
    const plan = { ...weeklyPlan };
    const day = plan[activeDay];
    day.exercises[exIndex].completed = !day.exercises[exIndex].completed;
    
    if (day.exercises.every(e => e.completed)) {
      day.completed = true;
      if (!workouts.some(w => w.id === day.id)) onAddWorkout(day);
    }
    
    setWeeklyPlan(plan);
    localStorage.setItem(`aurafit_weekly_workout_plan_${userId}`, JSON.stringify(plan));
  };

  const toggleMuscle = (muscleId: string) => {
    setSelectedMuscles(prev => prev.includes(muscleId) ? prev.filter(m => m !== muscleId) : [...prev, muscleId]);
    setSelectedSplit(''); 
  };

  const toggleSplit = (splitId: string) => {
    setSelectedSplit(prev => prev === splitId ? '' : splitId);
    setSelectedMuscles([]); 
  };

  const activeWorkout = weeklyPlan?.[activeDay];
  
  // Detection for Missed Days
  const todayIdx = DAYS.indexOf(currentDayName);
  const missedDaysCount = weeklyPlan ? DAYS.slice(0, todayIdx).filter(day => {
    const plan = weeklyPlan[day];
    return plan && !plan.completed;
  }).length : 0;

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Performance Logic</h2>
          <p className="text-slate-500 font-medium">Bio-Engine synchronizing training & recovery.</p>
        </div>
        {missedDaysCount > 0 && (
          <button 
            onClick={handleRecalibrate}
            disabled={isGenerating || hasAdjustedToday}
            className={`flex items-center gap-2 px-6 py-3 text-white font-black rounded-2xl shadow-xl transition-all ${
              hasAdjustedToday 
                ? 'bg-slate-400 cursor-not-allowed opacity-70' 
                : 'bg-amber-500 hover:bg-amber-600 shadow-amber-100'
            }`}
          >
            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : (hasAdjustedToday ? <Lock size={18} /> : <RefreshCw size={18} />)}
            {hasAdjustedToday ? 'Protocol Locked Today' : `Recalibrate Protocol (${missedDaysCount} Missed)`}
          </button>
        )}
      </div>

      {!weeklyPlan ? (
        <div className="glass p-20 rounded-[3rem] shadow-sm border border-white text-center flex flex-col items-center justify-center">
          <div className="p-6 bg-brand/10 text-brand rounded-full mb-8">
            <Shield size={64} />
          </div>
          <h3 className="text-3xl font-bold text-slate-800 mb-4">Initialize Fitness Matrix</h3>
          <button onClick={handleGenerateWeekly} disabled={isGenerating} className="px-10 py-5 bg-brand text-white rounded-[2rem] font-black flex items-center gap-3 hover:bg-emerald-700 shadow-xl transition-all disabled:opacity-50">
            {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
            {isGenerating ? "Synthesizing Matrix..." : "Activate Protocol"}
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            {DAYS.map(day => {
              const dayPlan = weeklyPlan[day];
              const isMissed = DAYS.indexOf(day) < todayIdx && dayPlan && !dayPlan.completed;
              return (
                <button 
                  key={day} 
                  onClick={() => setActiveDay(day)} 
                  className={`px-6 py-4 rounded-2xl font-bold text-sm transition-all flex-shrink-0 border flex flex-col items-center gap-1 ${
                    activeDay === day 
                      ? 'bg-brand text-white border-brand shadow-lg' 
                      : isMissed 
                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                        : 'bg-white text-slate-500 border-slate-100 hover:border-brand shadow-sm'
                  }`}
                >
                  <span className="text-[10px] uppercase opacity-60 tracking-widest">{day.substring(0,3)}</span>
                  {day}
                  {day === currentDayName && <span className="text-[8px] bg-white/20 px-1 rounded-full">TODAY</span>}
                  {isMissed && <AlertCircle size={10} />}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Fatigue & BioStats Architecture */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass p-8 rounded-[2.5rem] shadow-sm border border-white h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2 mb-8 text-slate-700">
                    <Activity size={20} className="text-brand" /> Bio-Feedback
                  </h3>
                  <div className="space-y-6">
                    <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Sleep State</span>
                        <span className={`text-xs font-bold ${profile.sleepHours < 6 ? 'text-amber-600' : 'text-brand'}`}>{profile.sleepHours}h</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                        <div className={`h-full ${profile.sleepHours < 6 ? 'bg-amber-500' : 'bg-brand'}`} style={{ width: `${(profile.sleepHours / 8) * 100}%` }} />
                      </div>
                    </div>
                    <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Stress Gradient</span>
                        <span className={`text-xs font-bold ${profile.stressLevel >= 8 ? 'text-red-500' : 'text-brand'}`}>{profile.stressLevel}/10</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                        <div className={`h-full ${profile.stressLevel >= 8 ? 'bg-red-500' : 'bg-brand'}`} style={{ width: `${(profile.stressLevel / 10) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-700">
                      <Zap size={20} className="text-amber-500" /> Fatigue Sensor
                    </h3>
                    <button onClick={() => setShowFatigueInfo(true)} className="p-1.5 text-slate-300 hover:text-brand transition-all">
                      <HelpCircle size={18} />
                    </button>
                  </div>
                  <div className={`mb-6 px-2 ${hasAdjustedToday ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Strain Index</label>
                        {hasAdjustedToday && <Lock size={10} className="text-slate-400" />}
                      </div>
                      <span className="text-sm font-bold text-brand">{fatigue}/10</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={fatigue} 
                      onChange={(e) => handleFatigueChange(Number(e.target.value))} 
                      disabled={isGenerating || hasAdjustedToday}
                      className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand ${hasAdjustedToday ? 'cursor-not-allowed' : ''}`} 
                    />
                    {hasAdjustedToday && (
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2 text-center">Locked: Adjustment quota met for today.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Routine Execution List (Daily Protocol) */}
            <div className="lg:col-span-8">
              {activeWorkout ? (
                <div className={`glass p-10 rounded-[3.5rem] shadow-lg border border-white transition-opacity relative min-h-[500px] ${!isTodayActive ? 'opacity-80 grayscale-[0.2]' : ''}`}>
                  {isGenerating && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-[3.5rem] animate-fadeIn">
                       <Loader2 size={48} className="animate-spin text-brand mb-4" />
                       <p className="text-sm font-black text-brand uppercase tracking-widest">Updating Fitness Matrix...</p>
                    </div>
                  )}
                  
                  <div className="flex flex-col mb-10">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-3xl font-black text-slate-700 tracking-tight">{activeDay} Protocol</h3>
                      <div className="flex gap-2">
                        {missedDaysCount > 0 && isTodayActive && (
                          <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                            <AlertCircle size={12} /> Sync Pending
                          </span>
                        )}
                        <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${activeWorkout.intensity.includes('High') ? 'bg-red-500 text-white' : 'bg-brand text-white'}`}>{activeWorkout.intensity} intensity</span>
                      </div>
                    </div>
                    <div className="p-8 bg-brand/5 border border-brand/10 rounded-[2.5rem] shadow-inner">
                      <h4 className="text-[11px] font-bold text-brand uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Sparkles size={14} /> Intelligence Rationale
                      </h4>
                      <p className="text-sm text-slate-500 leading-relaxed font-semibold italic">
                        {activeWorkout.rationale || "Synchronizing fitness logic..."}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeWorkout.exercises.map((ex, i) => (
                      <div key={i} className={`flex flex-col p-6 rounded-[2.5rem] border-2 transition-all group ${ex.completed ? 'bg-emerald-50 border-brand' : 'bg-white border-slate-50 shadow-sm hover:border-brand/30'}`}>
                        <div className="flex items-center gap-4">
                          <button onClick={() => toggleComplete(i)} disabled={!isTodayActive} className={`w-14 h-14 rounded-3xl flex items-center justify-center font-bold transition-all border-2 active:scale-90 ${ex.completed ? 'bg-brand text-white border-brand shadow-lg' : 'bg-white text-slate-400 border-slate-200 group-hover:border-brand/30'}`}>
                            {ex.completed ? <CheckCircle2 size={28} /> : (i + 1)}
                          </button>
                          <div className="flex-1 cursor-pointer" onClick={() => setExpandedExercise(expandedExercise === i ? null : i)}>
                            <h4 className="text-base font-black text-slate-700 flex items-center gap-2 tracking-tight">
                              {ex.name} {expandedExercise === i ? <ChevronUp size={18} className="text-brand" /> : <ChevronDown size={18} className="text-slate-300" />}
                            </h4>
                            <p className="text-xs text-slate-500 font-bold">{ex.sets} sets • {ex.reps} reps</p>
                          </div>
                        </div>
                        {expandedExercise === i && (
                          <div className="mt-6 pt-6 border-t border-slate-100 animate-slideDown space-y-4">
                            <p className="text-xs text-slate-600 leading-relaxed font-semibold">{ex.description}</p>
                            {ex.notes && <div className="p-4 bg-slate-50 rounded-2xl text-[10px] text-slate-500 border border-slate-100 italic">"{ex.notes}"</div>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="glass p-20 rounded-[3.5rem] shadow-sm border border-white text-center flex flex-col items-center justify-center h-full min-h-[500px]">
                  <Shield size={64} className="text-slate-200 mb-8" />
                  <h3 className="text-2xl font-black text-slate-400 uppercase tracking-widest">Initialize Protocol Core.</h3>
                  <p className="text-slate-400 text-sm mt-2 max-w-xs font-medium">Activate your adaptive matrix to begin tracking biometric progress.</p>
                </div>
              )}
            </div>
          </div>

          {/* Targeted Protocol Logic Center (Moved fully below the Daily Protocol and Feedback grid) */}
          <div className="w-full pt-8">
            <div className="glass p-8 md:p-12 rounded-[3.5rem] shadow-xl border border-white overflow-hidden bg-white/60">
              <div className="flex flex-col lg:flex-row gap-12 items-start">
                
                {/* Specialized Splits */}
                <div className="flex-1 space-y-8 w-full">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                         <div className="text-brand">
                            <Sparkles size={32} strokeWidth={1.5} />
                         </div>
                         <h3 className="text-4xl font-black text-slate-700 tracking-tight">Targeted Protocol</h3>
                      </div>
                      <p className="text-slate-400 font-semibold text-sm leading-snug">Select a daily split logic or isolate specific regions.</p>
                    </div>
                    <button 
                      onClick={handleGenerateTargeted}
                      disabled={isGenerating || hasAdjustedToday || (!selectedSplit && selectedMuscles.length === 0)}
                      className={`px-10 py-4 text-white rounded-full font-black flex items-center gap-3 shadow-2xl transition-all active:scale-95 group text-sm ${
                        hasAdjustedToday || isGenerating || (!selectedSplit && selectedMuscles.length === 0)
                          ? 'bg-slate-400 cursor-not-allowed opacity-70' 
                          : 'bg-brand hover:bg-emerald-700 shadow-brand/20'
                      }`}
                    >
                      {isGenerating ? <Loader2 className="animate-spin" size={16} /> : (hasAdjustedToday ? <Lock size={16} /> : <Zap size={16} fill="white" />)}
                      {hasAdjustedToday ? 'Protocol Locked' : 'Generate Plan'}
                    </button>
                  </div>

                  <div className="space-y-6">
                    <label className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] block">SELECT SPLIT TYPE</label>
                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${hasAdjustedToday ? 'opacity-60 pointer-events-none' : ''}`}>
                      {WORKOUT_SPLITS.map(split => (
                        <button 
                          key={split.id}
                          onClick={() => toggleSplit(split.id)}
                          className={`p-10 rounded-[2.5rem] border-4 text-left transition-all relative group shadow-sm bg-white/80 overflow-hidden ${selectedSplit === split.id ? 'border-brand bg-white ring-8 ring-brand/5' : 'border-slate-50 hover:border-slate-100'}`}
                        >
                          <div className="relative z-10">
                            <h4 className={`text-xl font-black mb-1 ${selectedSplit === split.id ? 'text-slate-700' : 'text-slate-600'}`}>{split.label}</h4>
                            <p className="text-[11px] text-slate-400 font-bold leading-relaxed pr-8">{split.sub}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Specific Selection */}
                <div className="w-full lg:w-[420px] shrink-0">
                  <div className={`p-10 bg-slate-50/50 rounded-[3rem] border border-slate-100/50 shadow-inner flex flex-col h-full min-h-[620px] ${hasAdjustedToday ? 'opacity-60 pointer-events-none' : ''}`}>
                    <label className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] block mb-8 text-center">QUICK SPECIFIC SELECTION</label>
                    
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      {MUSCLE_REGIONS.map(reg => (
                        <button 
                          key={reg.id} 
                          onClick={() => toggleMuscle(reg.id)}
                          className={`px-4 py-4 rounded-2xl text-[10px] font-black border-2 transition-all text-center tracking-widest flex items-center justify-center h-12 shadow-sm ${selectedMuscles.includes(reg.id) ? 'bg-brand text-white border-brand' : 'bg-white text-slate-500 border-slate-50 hover:border-brand/30'}`}
                        >
                          {reg.label}
                        </button>
                      ))}
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col gap-5 px-2">
                       {(selectedMuscles.length > 0 || selectedSplit) && (
                         <div className="flex flex-wrap gap-2 animate-fadeIn">
                           {selectedSplit && (
                             <span className="px-4 py-2 bg-black text-brand text-[10px] font-black rounded-xl uppercase flex items-center gap-2 border border-brand/20 shadow-md">
                               {WORKOUT_SPLITS.find(s => s.id === selectedSplit)?.label}
                               <X size={12} className="cursor-pointer hover:scale-110" onClick={() => setSelectedSplit('')} />
                             </span>
                           )}
                           {selectedMuscles.map(mId => (
                             <span key={mId} className="px-4 py-2 bg-black text-brand text-[10px] font-black rounded-xl uppercase flex items-center gap-2 border border-brand/20 shadow-md">
                               {MUSCLE_REGIONS.find(r => r.id === mId)?.label}
                               <X size={12} className="cursor-pointer hover:scale-110" onClick={() => toggleMuscle(mId)} />
                             </span>
                           ))}
                         </div>
                       )}
                       <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ACTIVE SELECTIONS: {selectedMuscles.length + (selectedSplit ? 1 : 0)}</p>
                          <button onClick={() => { setSelectedMuscles([]); setSelectedSplit(''); }} className="text-[10px] font-black text-slate-400 underline hover:text-red-500 transition-colors">Clear All</button>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showFatigueInfo && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
           <div className="max-w-md w-full glass rounded-[3.5rem] p-12 border border-white shadow-2xl relative animate-scaleIn">
              <button onClick={() => setShowFatigueInfo(false)} className="absolute top-8 right-8 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"><X size={20} /></button>
              <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-amber-500/10 text-amber-500 rounded-3xl"><Zap size={36} /></div>
                <div><h3 className="text-2xl font-black text-slate-800">Fatigue Logic</h3><p className="text-sm text-slate-500 font-medium">Bio-Engine feedback sensor.</p></div>
              </div>
              <div className="space-y-6">
                <section>
                  <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Volume Adjustments</h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">The Fatigue Sensor measures CNS strain and metabolic debt. High fatigue (8-10) automatically triggers a deload cycle to prioritize long-term biological resilience.</p>
                </section>
                <section>
                   <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-brand rounded-full" /> Usage Limits</h4>
                   <p className="text-sm text-slate-600 leading-relaxed font-medium">To maintain structural integrity of the protocol, adjustments are limited to one significant update per 24-hour cycle. Once you recalibrate or adjust fatigue, the matrix locks until the next biological reset (midnight).</p>
                </section>
              </div>
              <button onClick={() => setShowFatigueInfo(false)} className="mt-10 w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black shadow-xl">Acknowledge Protocol</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default FitnessTracker;
