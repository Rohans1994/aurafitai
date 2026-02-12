
import React, { useState } from 'react';
import { UserProfile, MealEntry, WorkoutPlan } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { 
  TrendingUp, 
  Flame, 
  Droplets, 
  Target, 
  Calendar, 
  Utensils, 
  ShieldCheck, 
  Sparkles, 
  Shield, 
  Info, 
  X, 
  ChevronRight, 
  Activity, 
  Heart, 
  Zap, 
  Calculator, 
  Link as LinkIcon, 
  ArrowRightLeft, 
  Dumbbell, 
  Battery,
  CheckCircle2,
  AlertCircle,
  Dna,
  Leaf,
  Scale,
  ZapOff,
  Stethoscope,
  Activity as ActivityIcon,
  BrainCircuit,
  // Fix missing icon imports
  Briefcase,
  Monitor,
  Moon
} from 'lucide-react';

interface DashboardProps {
  profile: UserProfile;
  meals: MealEntry[];
  workouts: WorkoutPlan[];
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  progress?: number;
  color?: string;
  details?: string;
  isShield?: boolean;
  onInfoClick?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ profile, meals, workouts }) => {
  const [showShieldInfo, setShowShieldInfo] = useState(false);
  const [showEnergyInfo, setShowEnergyInfo] = useState(false);
  const [showReadinessInfo, setShowReadinessInfo] = useState(false);
  const [showSynergyInfo, setShowSynergyInfo] = useState(false);
  
  const today = new Date().toDateString();
  const todayMeals = meals.filter(m => new Date(m.timestamp).toDateString() === today);
  const todayWorkouts = workouts.filter(w => new Date(w.date).toDateString() === today || (w.dayName === (new Date().toLocaleDateString('en-US', {weekday: 'long'}))));
  
  const totalCals = todayMeals.reduce((acc, m) => acc + m.calories, 0);
  const totalProtein = todayMeals.reduce((acc, m) => acc + m.protein, 0);
  const totalCarbs = todayMeals.reduce((acc, m) => acc + m.carbs, 0);
  const totalFats = todayMeals.reduce((acc, m) => acc + m.fats, 0);

  const totalFiber = todayMeals.reduce((acc, m) => acc + (m.fiber || 0), 0);
  const totalSodium = todayMeals.reduce((acc, m) => acc + (m.sodium || 0), 0);
  const totalPotassium = todayMeals.reduce((acc, m) => acc + (m.potassium || 0), 0);

  const fiberTarget = 30; 
  const macroData = [
    { name: 'Protein', value: totalProtein, goal: profile.macros.protein, color: '#009669' },
    { name: 'Carbs', value: totalCarbs, goal: profile.macros.carbs, color: '#3b82f6' },
    { name: 'Fats', value: totalFats, goal: profile.macros.fats, color: '#f59e0b' }
  ];

  const bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + (profile.gender === 'male' ? 5 : -161);
  const workoutIntensity = todayWorkouts.length > 0 ? (todayWorkouts[0].intensity === 'high' ? 400 : todayWorkouts[0].intensity === 'medium' ? 250 : 150) : 0;
  
  const synergyData = [
    { name: 'Basal Cost', value: Math.round(bmr), fill: '#94a3b8' },
    { name: 'Activity Cost', value: Math.round(profile.baseTdee - bmr + workoutIntensity), fill: '#10b981' },
    { name: 'Remaining', value: Math.max(0, Math.round(profile.tdee - totalCals)), fill: '#f1f5f9' }
  ];

  const readinessScore = Math.min(100, Math.max(0, (profile.sleepHours / 8) * 50 + (10 - profile.stressLevel) * 5));
  const synergyScore = Math.round((totalCals / profile.tdee) * 100);

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex justify-between items-end">
        <div>
          <p className="text-slate-500 font-medium">Adaptive Health Engine</p>
          <h2 className="text-3xl font-bold text-slate-800">Biological Snapshot</h2>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-brand">{today}</p>
        </div>
      </header>

      {/* Narrative Strategy Panel */}
      <div className="glass p-8 rounded-[3rem] shadow-lg border border-white overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 text-emerald-100 opacity-20 group-hover:opacity-40 transition-opacity">
          <ShieldCheck size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-brand text-white rounded-xl">
              <Sparkles size={20} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Fitness Logic Core</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div>
              <h4 className="text-[10px] font-bold text-brand uppercase tracking-widest mb-3">Occupational Bias</h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                Volume reduced for <strong>{profile.occupation.replace('_', ' ')}</strong>. 
                {profile.commuteStyle === 'active' ? " Commute burn subtracted from daily performance budget." : " Passive commute - volume baseline maintained."}
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-brand uppercase tracking-widest mb-3">Bio-Engine Filter</h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                Sleep: <strong>{profile.sleepHours}h</strong>. Stress: <strong>{profile.stressLevel}/10</strong>.
                {readinessScore < 60 ? " ALERT: Recovery filter active. Deload sessions suggested." : " System state: Optimal for progressive overload."}
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-brand uppercase tracking-widest mb-3">Intensity Matrix</h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                Strategy: <strong>{profile.medicalGoals[0]}</strong>. 
                Priority focus: {profile.medicalGoals.includes('Build Muscle') ? 'Hypertrophy (High RPE)' : 'Metabolic / Functional'}.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<Flame className="text-orange-500" />} 
          label="Energy Intake" 
          value={`${totalCals} / ${Math.round(profile.tdee)}`} 
          sub="kcal"
          progress={(totalCals / profile.tdee) * 100}
          onInfoClick={() => setShowEnergyInfo(true)}
        />
        <StatCard 
          icon={<Battery className="text-brand" />} 
          label="Bio-Readiness" 
          value={`${Math.round(readinessScore)}%`} 
          sub={readinessScore > 70 ? "Optimal" : "Recovery"}
          progress={readinessScore}
          color={readinessScore > 70 ? "text-brand" : "text-amber-600"}
          onInfoClick={() => setShowReadinessInfo(true)}
        />
        <StatCard 
          icon={<LinkIcon className="text-indigo-500" />} 
          label="Metabolic Synergy" 
          value={`${synergyScore}%`} 
          sub="Synchronized"
          progress={Math.min(100, synergyScore)}
          onInfoClick={() => setShowSynergyInfo(true)}
        />
        <StatCard 
          icon={<Shield className="text-indigo-500" />} 
          label="Bio-Defense Shield" 
          value={`${Math.round(totalFiber)}g Fiber`} 
          sub={`${Math.round((totalFiber / fiberTarget) * 100)}% Resilient`}
          progress={(totalFiber / fiberTarget) * 100}
          details={`Sodium: ${totalSodium}mg | K: ${totalPotassium}mg`}
          isShield
          onInfoClick={() => setShowShieldInfo(true)}
        />
      </div>

      {/* Energy Intake Side-Sheet */}
      {showEnergyInfo && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] animate-fadeIn" onClick={() => setShowEnergyInfo(false)} />
          <div className="fixed inset-y-0 right-0 max-w-md w-full glass z-[70] shadow-2xl border-l border-white/40 flex flex-col animate-slideInRight">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-orange-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500 text-white rounded-xl"><Flame size={24} /></div>
                <h3 className="text-xl font-bold text-slate-800">Energy Protocol</h3>
              </div>
              <button onClick={() => setShowEnergyInfo(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">How it is Calculated</h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  AuraFit uses the <strong>Mifflin-St Jeor Equation</strong> to establish your BMR (Basal Metabolic Rate). This baseline is then scaled by your TDEE activity factor, which includes:
                </p>
                <div className="mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                  <p className="text-[10px] font-bold text-orange-600 uppercase mb-2">Key Factors Involved</p>
                  <ul className="text-xs text-slate-600 space-y-2">
                    <li className="flex items-start gap-2"><Briefcase size={12} className="mt-0.5 text-orange-400" /> <strong>Occupation:</strong> Office vs Manual Labor adjustment.</li>
                    <li className="flex items-start gap-2"><ArrowRightLeft size={12} className="mt-0.5 text-orange-400" /> <strong>Commute:</strong> Energy cost of active vs passive transit.</li>
                    <li className="flex items-start gap-2"><Monitor size={12} className="mt-0.5 text-orange-400" /> <strong>Screen Time:</strong> Sedentary penalty bias.</li>
                  </ul>
                </div>
              </section>
              <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Health Benefits</h4>
                <div className="grid grid-cols-1 gap-3">
                   <BenefitTile icon={<Zap size={14} />} title="Metabolic Integrity" desc="Maintains efficient ATP production and prevents muscle catabolism during training cycles." />
                   <BenefitTile icon={<Scale size={14} />} title="Composition Control" desc="Precisely manages the deficit or surplus needed to hit performance targets without crashing hormones." />
                </div>
              </section>
            </div>
          </div>
        </>
      )}

      {/* Bio-Readiness Side-Sheet */}
      {showReadinessInfo && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] animate-fadeIn" onClick={() => setShowReadinessInfo(false)} />
          <div className="fixed inset-y-0 right-0 max-w-md w-full glass z-[70] shadow-2xl border-l border-white/40 flex flex-col animate-slideInRight">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl"><Battery size={24} /></div>
                <h3 className="text-xl font-bold text-slate-800">Bio-Readiness Logic</h3>
              </div>
              <button onClick={() => setShowReadinessInfo(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">How it is Calculated</h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Readiness is a weighted synthesis of your <strong>Bio-Engine Recovery capacity</strong>. It represents the CNS (Central Nervous System) ability to tolerate mechanical and physiological stress.
                </p>
                <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase mb-2">Primary Factors</p>
                  <ul className="text-xs text-slate-600 space-y-2">
                    <li className="flex items-start gap-2"><Moon size={12} className="mt-0.5 text-emerald-500" /> <strong>Sleep Debt:</strong> Penalty for under 7 hours of rest.</li>
                    <li className="flex items-start gap-2"><ActivityIcon size={12} className="mt-0.5 text-emerald-500" /> <strong>Stress Threshold:</strong> Cortisol proxy based on daily load.</li>
                    <li className="flex items-start gap-2"><ZapOff size={12} className="mt-0.5 text-emerald-500" /> <strong>Subjective Fatigue:</strong> User-inputted strain from the gym.</li>
                  </ul>
                </div>
              </section>
              <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Health & Training Benefits</h4>
                <div className="grid grid-cols-1 gap-3">
                   <BenefitTile icon={<Shield size={14} />} title="Injury Prevention" desc="Automatically triggers deload mandates to protect tendons and neural drive when readiness is low." />
                   <BenefitTile icon={<BrainCircuit size={14} />} title="Neural Recovery" desc="Ensures that your mental bandwidth and focus remain sharp by avoiding chronic overreaching." />
                </div>
              </section>
            </div>
          </div>
        </>
      )}

      {/* Metabolic Synergy Side-Sheet */}
      {showSynergyInfo && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] animate-fadeIn" onClick={() => setShowSynergyInfo(false)} />
          <div className="fixed inset-y-0 right-0 max-w-md w-full glass z-[70] shadow-2xl border-l border-white/40 flex flex-col animate-slideInRight">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl"><LinkIcon size={24} /></div>
                <h3 className="text-xl font-bold text-slate-800">Metabolic Synergy</h3>
              </div>
              <button onClick={() => setShowSynergyInfo(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">How it is Calculated</h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Synergy measures the <strong>Adherence Loop</strong> between your planned metabolic fuel and your actual intake. It is the percentage of your target daily protocol successfully logged.
                </p>
                <div className="mt-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase mb-2">Driving Factors</p>
                  <ul className="text-xs text-slate-600 space-y-2">
                    <li className="flex items-start gap-2"><Target size={12} className="mt-0.5 text-indigo-400" /> <strong>Caloric Precision:</strong> Accuracy of meal logging vs TDEE goal.</li>
                    <li className="flex items-start gap-2"><Utensils size={12} className="mt-0.5 text-indigo-400" /> <strong>Macro Partioning:</strong> How well you hit your P/C/F ratios.</li>
                    <li className="flex items-start gap-2"><Calendar size={12} className="mt-0.5 text-indigo-400" /> <strong>Temporal Sync:</strong> Consistency of fueling throughout the day.</li>
                  </ul>
                </div>
              </section>
              <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Health Benefits</h4>
                <div className="grid grid-cols-1 gap-3">
                   <BenefitTile icon={<Dna size={14} />} title="Bio-Synchronization" desc="Aligns energy availability with training demand to maximize anabolism (muscle growth)." />
                   <BenefitTile icon={<Heart size={14} />} title="Glycemic Stability" desc="Prevents energy crashes and brain fog by maintaining steady-state blood glucose levels." />
                </div>
              </section>
            </div>
          </div>
        </>
      )}

      {/* Bio-Defense Shield Side-Sheet */}
      {showShieldInfo && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] animate-fadeIn" onClick={() => setShowShieldInfo(false)} />
          <div className="fixed inset-y-0 right-0 max-w-md w-full glass z-[70] shadow-2xl border-l border-white/40 flex flex-col animate-slideInRight">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl"><Shield size={24} /></div>
                <h3 className="text-xl font-bold text-slate-800">Bio-Defense Shield</h3>
              </div>
              <button onClick={() => setShowShieldInfo(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">How it is Calculated</h4>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  The Shield evaluates your <strong>Protective Nutrient Index</strong>. It monitors gut health components and cardiovascular pressure markers logged through your meals.
                </p>
                <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase mb-2">Contribution Factors</p>
                  <ul className="text-xs text-slate-600 space-y-2">
                    <li className="flex items-start gap-2"><Leaf size={12} className="mt-0.5 text-blue-400" /> <strong>Fiber Load:</strong> Tracking towards the 30g daily health target.</li>
                    <li className="flex items-start gap-2"><Stethoscope size={12} className="mt-0.5 text-blue-400" /> <strong>Na:K Ratio:</strong> Balancing Sodium vs Potassium for heart safety.</li>
                    <li className="flex items-start gap-2"><ShieldCheck size={12} className="mt-0.5 text-blue-400" /> <strong>Vitamins/Minerals:</strong> Cumulative micro-adherence score.</li>
                  </ul>
                </div>
              </section>
              <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Health Benefits</h4>
                <div className="grid grid-cols-1 gap-3">
                   <BenefitTile icon={<ActivityIcon size={14} />} title="Gut-Brain Axis" desc="Supports healthy microbiome diversity, which regulates mood, immunity, and skin health." />
                   <BenefitTile icon={<Heart size={14} />} title="Vasodilation Support" desc="Optimal Potassium intake counters the hypertensive effects of Sodium, protecting arteries." />
                </div>
              </section>
            </div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-brand" /> Macro Partitioning
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={macroData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#64748b" />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                  {macroData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Bar>
                <Bar dataKey="goal" fill="#e2e8f0" radius={[0, 8, 8, 0]} barSize={32} opacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            {macroData.map(m => (
              <div key={m.name} className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase">{m.name}</p>
                <p className="text-lg font-bold" style={{ color: m.color }}>{Math.round(m.value)}g</p>
                <p className="text-[10px] text-slate-400">of {Math.round(m.goal)}g</p>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Calendar size={20} className="text-brand" /> Nutritional Activity
          </h3>
          <div className="space-y-4">
            {todayMeals.length > 0 ? todayMeals.map(meal => (
              <div key={meal.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center text-brand font-bold">{meal.name[0]}</div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{meal.name}</p>
                  <p className="text-xs text-slate-500">{new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <p className="font-bold text-brand">{meal.calories} kcal</p>
              </div>
            )) : <div className="text-center py-10"><Utensils size={40} className="mx-auto text-slate-200 mb-2" /><p className="text-slate-400 text-sm">Waiting for ingestion logs...</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
};

const BenefitTile = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-brand/20 transition-all">
    <div className="p-2 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-brandLight group-hover:text-brand transition-colors h-fit">
      {icon}
    </div>
    <div>
      <h5 className="text-xs font-bold text-slate-800 mb-1">{title}</h5>
      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{desc}</p>
    </div>
  </div>
);

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, progress, color = "text-slate-800", details, isShield, onInfoClick }) => (
  <div className={`glass p-6 rounded-3xl shadow-sm border border-white hover:shadow-md transition-all ${isShield ? 'ring-2 ring-indigo-50 border-indigo-100' : ''} ${onInfoClick ? 'cursor-pointer hover:border-brand/30 active:scale-[0.98]' : ''}`} onClick={onInfoClick}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-xl shadow-sm ${isShield ? 'bg-indigo-600 text-white' : 'bg-white'} ${label === 'Energy Intake' ? 'bg-orange-500 text-white' : ''} ${label === 'Bio-Readiness' ? 'bg-brand text-white' : ''} ${label === 'Metabolic Synergy' ? 'bg-indigo-600 text-white' : ''}`}>{icon}</div>
      <div className="flex items-center gap-2">
        {onInfoClick && <div className="p-1 text-slate-300 hover:text-brand transition-all"><Info size={16} /></div>}
        {progress !== undefined && <span className="text-xs font-bold text-slate-400">{Math.round(progress)}%</span>}
      </div>
    </div>
    <p className="text-slate-500 text-sm font-medium">{label}</p>
    <div className="flex items-baseline gap-1">
      <h4 className={`text-2xl font-bold ${color}`}>{value}</h4>
      <span className="text-xs text-slate-400 font-medium">{sub}</span>
    </div>
    {details && <p className="text-[10px] text-slate-400 mt-1 font-bold tracking-tight">{details}</p>}
    {progress !== undefined && <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden"><div className={`h-full rounded-full transition-all duration-1000 ${isShield ? 'bg-indigo-500' : label === 'Energy Intake' ? 'bg-orange-500' : label === 'Metabolic Synergy' ? 'bg-indigo-500' : 'bg-brand'}`} style={{ width: `${Math.min(progress, 100)}%` }} /></div>}
  </div>
);

export default Dashboard;
