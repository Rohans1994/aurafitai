
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, MealEntry, WorkoutPlan } from '../types';
import { getCoachingAdvice } from '../services/geminiService';
import { MessageSquare, Send, User, Bot, Loader2 } from 'lucide-react';

interface AICoachProps {
  profile: UserProfile;
  meals: MealEntry[];
  workouts: WorkoutPlan[];
}

const AICoach: React.FC<AICoachProps> = ({ profile, meals, workouts }) => {
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: `Hi ${profile.gender === 'male' ? 'Champ' : 'Athlete'}! I've analyzed your stats. You're ${meals.length > 0 ? 'doing well with nutrition' : 'yet to log your first meal'}. How can I help you today?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const today = new Date().toDateString();
      const todayMeals = meals.filter(m => new Date(m.timestamp).toDateString() === today);
      const advice = await getCoachingAdvice(profile, { todayMeals, workoutsCount: workouts.length }, userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: advice }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "I'm having trouble connecting. Check your network?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Personal Coach</h2>
          <p className="text-slate-500">24/7 AI-powered health expert.</p>
        </div>
      </div>

      <div className="flex-1 glass rounded-[2.5rem] flex flex-col shadow-lg overflow-hidden border border-white">
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'bot' ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-600'}`}>
                {msg.role === 'bot' ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className={`max-w-[80%] p-5 rounded-3xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'bot' 
                  ? 'bg-white text-slate-700 border border-slate-100 rounded-tl-none' 
                  : 'bg-emerald-600 text-white rounded-tr-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-emerald-500" />
                <span className="text-xs font-bold text-emerald-600 italic">Coach is thinking...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-6 bg-slate-50 border-t flex gap-4 items-center">
          <input
            type="text"
            placeholder="Ask anything... 'What should I eat for dinner after a heavy lift?'"
            className="flex-1 px-6 py-4 bg-white rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 shadow-sm text-sm font-medium outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={isTyping}
            className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AICoach;
