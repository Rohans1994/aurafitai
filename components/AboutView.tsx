
import React from 'react';
import { 
  BrainCircuit, 
  Flame, 
  Zap, 
  Shield, 
  Layers, 
  Cpu, 
  Dumbbell, 
  Utensils, 
  Activity, 
  Scale, 
  ChevronRight,
  Database,
  BarChart4,
  Target,
  Heart,
  Droplets,
  Timer,
  Activity as ActivityIcon,
  ShieldCheck,
  Stethoscope,
  Briefcase,
  Moon,
  Wind
} from 'lucide-react';

const AboutView: React.FC = () => {
  return (
    <div className="space-y-12 animate-fadeIn pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">The AuraFit Logic</h2>
          <p className="text-slate-500 font-medium italic">Synchronizing biometrics with performance architecture.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100">
          <ShieldCheck size={18} className="text-brand" />
          <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Protocol v3.1 Active</span>
        </div>
      </header>

      {/* Core Logic Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-10 rounded-[3.5rem] shadow-sm border border-white space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand text-white rounded-2xl shadow-lg shadow-emerald-100">
              <BrainCircuit size={24} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">The Fitness Engine</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            AuraFit AI calculates a proprietary <strong>Weekly Activity Score (WAS)</strong>. This isn't just a tracker; it's a negotiator that balances your metabolic debt against your recovery capacity.
          </p>

          <div className="grid grid-cols-1 gap-4">
            <LogicPillar 
              icon={<Database size={18} />} 
              title="1. Workout Intensity Matrix" 
              desc="We map your Step 5 Priorities and Step 1 Biometrics to set the primary training style (HIIT vs Strength vs Mobility)." 
            />
            <LogicPillar 
              icon={<Cpu size={18} />} 
              title="2. Dynamic Volume Adjustment" 
              desc="Gym load is automatically scaled based on your Occupation (Manual vs Office) and Commute style." 
            />
            <LogicPillar 
              icon={<ActivityIcon size={18} />} 
              title="3. Bio-Engine Recovery Filter" 
              desc="Clinical deload mandates are triggered daily by Sleep (<6h) and Stress (>8/10) biomarkers." 
            />
          </div>
        </div>

        {/* Feeding Strategy Section */}
        <div className="glass p-10 rounded-[3.5rem] shadow-sm border border-white space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
              <Utensils size={24} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Feeding Protocols</h3>
          </div>
          
          <div className="space-y-4">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest px-2">Metabolic Frequency Mapping</p>
            <div className="space-y-2">
              <FeedingRow 
                icon={<Scale size={16} />} 
                priority="Weight Loss" 
                frequency="2 – 3 Meals" 
                reason="Strategic deficit maintenance and improved insulin sensitivity via larger, intentional feedings." 
              />
              <FeedingRow 
                icon={<Zap size={16} />} 
                priority="Build Muscle" 
                frequency="5 – 6 Meals" 
                reason="Optimal Muscle Protein Synthesis (MPS) via consistent amino acid availability throughout the day." 
              />
              <FeedingRow 
                icon={<Droplets size={16} />} 
                priority="Diabetic Friendly" 
                frequency="4 – 5 Meals" 
                reason="Small, frequent portions to prevent glucose spikes and maintain steady glycemic response." 
              />
              <FeedingRow 
                icon={<Timer size={16} />} 
                priority="Endurance" 
                frequency="5+ Meals" 
                reason="Precision fueling for Zone 2-4 capacity and strategic glycogen replenishment windows." 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Intensity Matrix Details */}
      <div className="glass p-10 rounded-[3.5rem] shadow-sm border border-white">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-amber-500 text-white rounded-2xl">
            <BarChart4 size={24} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800">The Intensity Matrix</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MatrixCard 
            title="Build Muscle" 
            focus="Hypertrophy" 
            intensity="High (RPE 8-9)" 
            modality="Resistance Training" 
            color="border-red-100 bg-red-50 text-red-700"
          />
          <MatrixCard 
            title="Endurance" 
            focus="Aerobic Capacity" 
            intensity="Variable (Zone 2-4)" 
            modality="Sport-Specific / Cardio" 
            color="border-blue-100 bg-blue-50 text-blue-700"
          />
          <MatrixCard 
            title="Body Recomp" 
            focus="Fat Loss + Lean Mass" 
            intensity="Mod-High (RPE 7-8)" 
            modality="HIIT + Compound Strength" 
            color="border-emerald-100 bg-emerald-50 text-emerald-700"
          />
          <MatrixCard 
            title="Flex & Mobility" 
            focus="Range of Motion" 
            intensity="Low-Mod (RPE 3-5)" 
            modality="Yoga / PNF / Isometrics" 
            color="border-indigo-100 bg-indigo-50 text-indigo-700"
          />
        </div>
      </div>

      {/* Bio-Engine Recovery Card */}
      <div className="glass p-10 rounded-[3.5rem] shadow-lg border border-white bg-slate-900 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 text-brand/10 pointer-events-none group-hover:scale-110 transition-transform">
          <Dumbbell size={200} />
        </div>
        <div className="relative z-10 space-y-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand text-white rounded-2xl">
              <ActivityIcon size={24} />
            </div>
            <h3 className="text-2xl font-bold">The Bio-Engine Loop</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-brand uppercase tracking-widest flex items-center gap-2">
                <Moon size={14} /> Sleep Constraint
              </h4>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                <p className="text-sm font-bold text-white mb-2">Sleep &lt; 6 Hours</p>
                <p className="text-xs text-slate-400 leading-relaxed italic font-medium">
                  "System triggers mandatory LISS (Low-Intensity Steady State) or Active Recovery day to protect CNS from overtraining."
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                <Wind size={14} /> Stress Threshold
              </h4>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                <p className="text-sm font-bold text-white mb-2">Stress Level 8-10</p>
                <p className="text-xs text-slate-400 leading-relaxed italic font-medium">
                  "Engine prioritizes PNS activation (Parasympathetic focus) with Mobility and Breathwork routines to lower Cortisol."
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <Briefcase size={14} /> Lifestyle Offset
              </h4>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                <p className="text-sm font-bold text-white mb-2">Manual Labor Job</p>
                <p className="text-xs text-slate-400 leading-relaxed italic font-medium">
                  "AI automatically reduces total weekly gym volume (sets/reps) by 30% to account for high occupational fatigue."
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <Stethoscope size={14} className="text-brand" />
              Clinical Note: Programs for Ketogenic users are modified to focus on lower-rep, high-power sets to support glycogen-depleted states.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-slate-200/50 rounded-full mb-6">
          <Shield size={16} className="text-slate-500" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">AISTUDIO Engineered Clinical Logic</span>
        </div>
        <h3 className="text-3xl font-black text-slate-800 mb-4">Empowerment Through Science</h3>
        <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed text-sm">
          AuraFit removes the guesswork of performance. By synthesizing your unique lifestyle markers, we provide a path that respects your biology while pushing your potential.
        </p>
      </div>
    </div>
  );
};

const FeedingRow = ({ icon, priority, frequency, reason }: { icon: React.ReactNode, priority: string, frequency: string, reason: string }) => (
  <div className="flex gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all group border border-transparent hover:border-slate-100">
    <div className="mt-1 p-2 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all h-fit">
      {icon}
    </div>
    <div>
      <div className="flex justify-between items-center mb-1">
        <h4 className="text-xs font-bold text-slate-800">{priority}</h4>
        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{frequency}</span>
      </div>
      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{reason}</p>
    </div>
  </div>
);

const LogicPillar = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="flex gap-4 p-5 hover:bg-slate-50 rounded-2xl transition-all group">
    <div className="mt-1 p-2 bg-slate-100 text-slate-500 rounded-xl group-hover:bg-brand group-hover:text-white transition-all h-fit">
      {icon}
    </div>
    <div>
      <h4 className="text-xs font-bold text-slate-800 mb-1">{title}</h4>
      <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{desc}</p>
    </div>
  </div>
);

const MatrixCard = ({ title, focus, intensity, modality, color }: { title: string, focus: string, intensity: string, modality: string, color: string }) => (
  <div className={`p-6 rounded-[2rem] border-2 transition-all hover:scale-[1.02] cursor-default ${color}`}>
    <p className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-60">{title}</p>
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-bold uppercase">Focus</span>
        <span className="text-[11px] font-black">{focus}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-bold uppercase">Intensity</span>
        <span className="text-[11px] font-black">{intensity}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-bold uppercase">Modality</span>
        <span className="text-[11px] font-black text-right">{modality}</span>
      </div>
    </div>
  </div>
);

export default AboutView;
