
import React, { useState, useRef, useEffect } from 'react';
import { MealEntry, UserProfile, WeeklyMealPlan } from '../types';
import { analyzeMealImage, parseMealText, generateWeeklyMealPlan, generateMealAlternative, generateGroceryList } from '../services/geminiService';
import { Camera, Send, Plus, Loader2, Sparkles, CheckCircle2, Calendar, Trash2, Shuffle, Lock, Utensils, ShoppingBasket, X, Mic, MicOff } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

interface NutritionLogProps {
  userId: string;
  profile: UserProfile;
  meals: MealEntry[];
  onAddMeal: (meal: MealEntry) => void;
  onRemoveMeal: (mealId: string) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getWeekStart = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

// Audio Utilities for Live API
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const NutritionLog: React.FC<NutritionLogProps> = ({ userId, profile, meals, onAddMeal, onRemoveMeal }) => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isSwapping, setIsSwapping] = useState<string | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyMealPlan | null>(null);
  const [isExtractingList, setIsExtractingList] = useState(false);
  const [groceryList, setGroceryList] = useState<any[]>([]);
  const [showGroceryModal, setShowGroceryModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Live API Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const transcriptionRef = useRef<string>('');

  const todayDate = new Date();
  const currentDayName = DAYS[todayDate.getDay() === 0 ? 6 : todayDate.getDay() - 1];
  const [selectedDay, setSelectedDay] = useState(currentDayName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isToday = selectedDay === currentDayName;
  const todayIdx = DAYS.indexOf(currentDayName);
  const selectedIdx = DAYS.indexOf(selectedDay);
  const isPast = selectedIdx < todayIdx;

  useEffect(() => {
    const savedPlan = localStorage.getItem(`aurafit_weekly_meal_plan_${userId}`);
    const savedWeek = localStorage.getItem(`aurafit_meal_plan_week_start_${userId}`);
    const currentWeekStart = getWeekStart(new Date());

    if (savedPlan && savedWeek === currentWeekStart.toString()) {
      setWeeklyPlan(JSON.parse(savedPlan));
      
      const savedList = localStorage.getItem(`aurafit_grocery_list_${userId}`);
      const savedListWeek = localStorage.getItem(`aurafit_grocery_list_week_start_${userId}`);
      if (savedList && savedListWeek === currentWeekStart.toString()) {
        setGroceryList(JSON.parse(savedList));
      }
    } else {
      setWeeklyPlan(null);
      setGroceryList([]);
    }

    return () => {
      stopListening();
    };
  }, [userId]);

  const startListening = async () => {
    if (!isToday || isListening) return;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      
      transcriptionRef.current = '';
      setIsListening(true);

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = audioCtx.createMediaStreamSource(stream);
            const scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioCtx.destination);
            (window as any)._scriptProcessor = scriptProcessor;
            (window as any)._audioStream = stream;
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              transcriptionRef.current += text;
              setInputText(prev => prev + text);
            }
            if (message.serverContent?.turnComplete) {
              // Automatically submit if there's enough text
              if (transcriptionRef.current.trim().length > 3) {
                // Keep it for visual feedback, the user can manually send or it will auto-parse
              }
            }
          },
          onerror: (e) => {
            console.error('Live session error:', e);
            stopListening();
          },
          onclose: () => {
            setIsListening(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          systemInstruction: 'You are a nutrition logger. Simply transcribe the food items the user mentions.'
        }
      });

      sessionRef.current = sessionPromise;
    } catch (err) {
      console.error('Failed to start voice input:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if ((window as any)._scriptProcessor) {
      (window as any)._scriptProcessor.disconnect();
      delete (window as any)._scriptProcessor;
    }
    if ((window as any)._audioStream) {
      (window as any)._audioStream.getTracks().forEach((t: any) => t.stop());
      delete (window as any)._audioStream;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.then((s: any) => s.close());
      sessionRef.current = null;
    }
    setIsListening(false);
  };

  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const plan = await generateWeeklyMealPlan(profile);
      setWeeklyPlan(plan);
      const currentWeekStart = getWeekStart(new Date()).toString();
      localStorage.setItem(`aurafit_weekly_meal_plan_${userId}`, JSON.stringify(plan));
      localStorage.setItem(`aurafit_meal_plan_week_start_${userId}`, currentWeekStart);
      
      setGroceryList([]);
      localStorage.removeItem(`aurafit_grocery_list_${userId}`);
      localStorage.removeItem(`aurafit_grocery_list_week_start_${userId}`);
    } catch (error) {
      console.error(error);
      alert("Weekly generation engine timeout.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleExtractGroceryList = async () => {
    if (!weeklyPlan) return;
    setShowGroceryModal(true);
    
    const currentWeekStart = getWeekStart(new Date()).toString();
    const savedListWeek = localStorage.getItem(`aurafit_grocery_list_week_start_${userId}`);
    if (groceryList.length > 0 && savedListWeek === currentWeekStart) {
      return;
    }

    setIsExtractingList(true);
    try {
      const list = await generateGroceryList(weeklyPlan);
      setGroceryList(list);
      localStorage.setItem(`aurafit_grocery_list_${userId}`, JSON.stringify(list));
      localStorage.setItem(`aurafit_grocery_list_week_start_${userId}`, currentWeekStart);
    } catch (error) {
      console.error(error);
    } finally {
      setIsExtractingList(false);
    }
  };

  const handleGetAlternative = async (mealIdx: number, type: string, currentMeal: string) => {
    if (!isToday) return; 
    setIsSwapping(`${selectedDay}-${mealIdx}`);
    try {
      const alt = await generateMealAlternative(profile, type, currentMeal);
      if (weeklyPlan && weeklyPlan[selectedDay]) {
        const newDayMeals = [...weeklyPlan[selectedDay]];
        newDayMeals[mealIdx] = alt;
        const newPlan = {
          ...weeklyPlan,
          [selectedDay]: newDayMeals
        };
        setWeeklyPlan(newPlan);
        localStorage.setItem(`aurafit_weekly_meal_plan_${userId}`, JSON.stringify(newPlan));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSwapping(null);
    }
  };

  const handleAcceptMeal = (meal: Partial<MealEntry>) => {
    if (!isToday) return; 
    onAddMeal({
      ...meal,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      isSuggested: true,
      dayName: selectedDay
    } as MealEntry);
  };

  const handleTextSubmit = async () => {
    if (!inputText.trim() || !isToday) return;
    if (isListening) stopListening();
    setIsAnalyzing(true);
    try {
      const data = await parseMealText(inputText, profile);
      if (data.name) {
        onAddMeal({
          ...data,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
          dayName: selectedDay
        } as MealEntry);
        setInputText('');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isToday) return;
    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const data = await analyzeMealImage(base64, profile);
        if (data.name) {
          onAddMeal({
            ...data,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            dayName: selectedDay
          } as MealEntry);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const currentDayPlan = weeklyPlan?.[selectedDay] || [];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Nutrition Engine</h2>
          <p className="text-slate-500">Biological fuel management.</p>
        </div>
        {weeklyPlan && (
          <button 
            onClick={handleExtractGroceryList}
            className="hidden md:flex items-center gap-2 px-6 py-3 bg-brandLight text-brand font-bold rounded-2xl hover:bg-brand hover:text-white transition-all shadow-sm"
          >
            <ShoppingBasket size={20} />
            Weekly Inventory
          </button>
        )}
      </div>

      <div className={`glass p-8 rounded-[2.5rem] shadow-lg border-2 ${isListening ? 'border-brand ring-4 ring-brand/10' : 'border-white'} transition-all ${!isToday ? 'opacity-50 grayscale' : ''}`}>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full group">
            <input
              type="text"
              placeholder={isToday ? (isListening ? "Listening to your meal description..." : "Manual ingest entry...") : "Temporal Lock Active"}
              className={`w-full pl-6 pr-28 py-5 bg-slate-100 rounded-3xl border-none focus:ring-2 focus:ring-brand font-medium outline-none transition-all ${isListening ? 'placeholder:text-brand' : ''}`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isAnalyzing || !isToday}
              onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
            />
            <div className="absolute right-3 top-3 flex items-center gap-2">
              <button 
                onClick={isListening ? stopListening : startListening}
                disabled={isAnalyzing || !isToday}
                className={`p-3 rounded-2xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-500 hover:bg-brand hover:text-white'}`}
                title={isListening ? "Stop listening" : "Voice enabled input"}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button 
                onClick={handleTextSubmit}
                disabled={isAnalyzing || !isToday || inputText.trim().length === 0}
                className="p-3 bg-brand text-white rounded-2xl hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              </button>
            </div>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing || !isToday}
            className="flex items-center justify-center gap-3 px-8 py-5 bg-white border-2 border-slate-100 text-slate-700 font-bold rounded-3xl hover:border-brand hover:text-brand shadow-sm disabled:opacity-50"
          >
            <Camera size={24} className="text-brand" />
            <span>Vision</span>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        </div>
        
        {!weeklyPlan && (
          <div className="mt-8 pt-8 border-t border-slate-50 flex flex-col items-center text-center animate-fadeIn">
            <div className="p-4 bg-emerald-50 text-brand rounded-full mb-4">
              <Utensils size={32} />
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-2">Initialize Nutritional Logic</h4>
            <p className="text-xs text-slate-500 max-w-sm mb-6">
              Generate a personalized nutritional framework mapped to your medical constraints and performance goals.
            </p>
            <button 
              onClick={handleGeneratePlan}
              disabled={isGeneratingPlan}
              className="px-8 py-4 bg-brand text-white rounded-2xl font-black flex items-center gap-2 hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all disabled:opacity-50"
            >
              {isGeneratingPlan ? <Loader2 className="animate-spin" size={20} /> : <Calendar size={20} />}
              {isGeneratingPlan ? "Synthesizing Logic..." : "Get weekly Nutrition"}
            </button>
          </div>
        )}

        {weeklyPlan && !isToday && (
          <div className="mt-4 flex items-center gap-2 text-slate-500 text-xs font-bold">
            <Lock size={14} /> Security: {isPast ? 'History Locked' : 'Future Locked'}.
          </div>
        )}
      </div>

      {weeklyPlan && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar max-w-[70%]">
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex-shrink-0 border ${
                    selectedDay === day 
                      ? 'bg-brand text-white border-brand shadow-lg' 
                      : 'bg-white text-slate-500 border-slate-100 hover:border-brand'
                  }`}
                >
                  {day}
                  {day === currentDayName && <span className="ml-2 text-[10px] bg-white/20 px-2 py-0.5 rounded-full">TODAY</span>}
                </button>
              ))}
            </div>
            <button 
              onClick={handleExtractGroceryList}
              className="md:hidden p-3 bg-brand text-white rounded-2xl shadow-lg"
            >
              <ShoppingBasket size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentDayPlan.map((meal, idx) => {
                  const type = meal.type || 'Meal';
                  const isLogged = meals.some(m => 
                    m.name === meal.name && 
                    new Date(m.timestamp).toDateString() === todayDate.toDateString() &&
                    m.dayName === selectedDay
                  );
                  
                  const swapKey = `${selectedDay}-${idx}`;
                  const isSwappingThis = isSwapping === swapKey;

                  return (
                    <div key={idx} className={`p-6 rounded-[2rem] border-2 transition-all relative ${isLogged ? 'bg-emerald-50 border-brand shadow-brand/10' : 'bg-white border-slate-50 shadow-sm'} ${!isToday && !isLogged ? 'opacity-70' : ''}`}>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand bg-emerald-100 px-3 py-1 rounded-full">{type}</span>
                        <div className="flex gap-2">
                          {!isLogged && isToday && (
                            <>
                              <button 
                                onClick={() => handleGetAlternative(idx, type, meal.name || '')} 
                                disabled={isSwappingThis}
                                className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-blue-100 hover:text-blue-600 transition-all disabled:opacity-50"
                                title="Get alternative meal"
                              >
                                {isSwappingThis ? <Loader2 className="animate-spin" size={18} /> : <Shuffle size={18} />}
                              </button>
                              <button 
                                onClick={() => handleAcceptMeal(meal)} 
                                disabled={isSwappingThis}
                                className="p-2 bg-slate-100 text-slate-400 rounded-xl hover:bg-brand hover:text-white transition-all disabled:opacity-50"
                              >
                                <Plus size={18} />
                              </button>
                            </>
                          )}
                          {isLogged && <CheckCircle2 className="text-brand" size={24} />}
                          {!isLogged && !isToday && <Lock className="text-slate-300" size={18} />}
                        </div>
                      </div>
                      <h4 className="text-lg font-bold text-slate-800">{meal.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{meal.calories} kcal • {meal.protein}g P • {meal.carbs}g C</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="text-brand" size={20} /> Journal: {selectedDay}
              </h3>
              <div className="space-y-4">
                {meals.filter(m => m.dayName === selectedDay).map(meal => (
                  <div key={meal.id} className="glass p-5 rounded-3xl shadow-sm border border-white group relative">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-slate-800">{meal.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{meal.type}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-brand">{meal.calories} kcal</p>
                        {isToday && (
                          <button onClick={() => onRemoveMeal(meal.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {meals.filter(m => m.dayName === selectedDay).length === 0 && (
                   <div className="text-center py-10 text-slate-400 text-sm italic">
                      No logs for this cycle.
                   </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Grocery Modal */}
      {showGroceryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
           <div className="max-w-2xl w-full glass rounded-[3rem] shadow-2xl border border-white flex flex-col max-h-[90vh] overflow-hidden animate-scaleIn">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-brand/5">
                 <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand text-white rounded-2xl">
                       <ShoppingBasket size={24} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-bold text-slate-800">Weekly Inventory</h3>
                       <p className="text-sm text-slate-500">Aura-curated shopping list.</p>
                    </div>
                 </div>
                 <button 
                  onClick={() => setShowGroceryModal(false)}
                  className="p-2 bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all"
                 >
                   <X size={20} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
                 {isExtractingList ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                       <Loader2 size={48} className="animate-spin text-brand mb-6" />
                       <h4 className="text-xl font-bold text-slate-800">Synthesizing Ingredients</h4>
                       <p className="text-slate-500 text-sm mt-2">Extracting metabolic components from your plan...</p>
                    </div>
                 ) : (
                    <>
                       {groceryList.map((cat, idx) => (
                          <div key={idx} className="space-y-4">
                             <h4 className="text-[10px] font-bold text-brand uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1 h-3 bg-brand rounded-full" />
                                {cat.category}
                             </h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {cat.items.map((item: any, i: number) => (
                                   <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-brand/30 transition-all">
                                      <div className="flex items-center gap-3">
                                         <div className="p-1.5 bg-brand/10 text-brand rounded-lg">
                                            <Utensils size={14} />
                                         </div>
                                         <span className="text-sm font-bold text-slate-700">{item.name}</span>
                                      </div>
                                      <span className="text-xs font-black text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">{item.amount}</span>
                                   </div>
                                ))}
                             </div>
                          </div>
                       ))}
                       {groceryList.length === 0 && !isExtractingList && (
                          <div className="text-center py-20 text-slate-400 italic">
                             No inventory data available for this plan.
                          </div>
                       )}
                    </>
                 )}
              </div>

              <div className="p-8 border-t border-slate-100 bg-white/50">
                 <button 
                    onClick={() => setShowGroceryModal(false)}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                 >
                    Close Inventory
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default NutritionLog;
