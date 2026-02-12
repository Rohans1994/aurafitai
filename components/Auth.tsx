
import React, { useState } from 'react';
import { UserAccount } from '../types';
import { Mail, Lock, UserPlus, LogIn, Loader2, Sparkles } from 'lucide-react';

interface AuthProps {
  onLogin: (user: UserAccount) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const users: UserAccount[] = JSON.parse(localStorage.getItem('aurafit_users') || '[]');
      
      if (isSignUp) {
        if (users.find(u => u.email === email)) {
          setError('Aura profile already exists');
          setIsLoading(false);
          return;
        }
        const newUser: UserAccount = { id: Math.random().toString(36).substr(2, 9), email, password };
        users.push(newUser);
        localStorage.setItem('aurafit_users', JSON.stringify(users));
        onLogin(newUser);
      } else {
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
          onLogin(user);
        } else {
          setError('Credential mismatch in core engine');
        }
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full glass rounded-[2.5rem] p-10 shadow-2xl animate-fadeIn border border-white">
        <div className="text-center mb-10">
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="w-20 h-20 bg-brand rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-emerald-200 mb-2">
              A
            </div>
            <h1 className="text-4xl font-black text-brand tracking-tighter uppercase">AuraFit</h1>
            <div className="h-1 w-12 bg-brand/20 rounded-full" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">
            {isSignUp ? 'Join AuraFit AI' : 'Welcome Back'}
          </h2>
          <p className="text-slate-500 mt-2 font-medium">
            {isSignUp ? 'Initialize your elite aura' : 'Access your biological insights'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100">{error}</div>}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
            <input 
              type="email" 
              required 
              placeholder="Email"
              className="w-full px-6 py-4 bg-slate-100 border-none rounded-2xl text-slate-800 font-medium focus:ring-2 focus:ring-brand outline-none transition-all" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
            <input 
              type="password" 
              required 
              placeholder="Password"
              className="w-full px-6 py-4 bg-slate-100 border-none rounded-2xl text-slate-800 font-medium focus:ring-2 focus:ring-brand outline-none transition-all" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>
          <button type="submit" disabled={isLoading} className="w-full py-4 bg-brand text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-700 shadow-lg transition-all disabled:opacity-50">
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />}
            {isSignUp ? 'Activate Aura' : 'Initiate Session'}
          </button>
        </form>
        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-brand font-bold hover:text-emerald-700 transition-colors inline-flex items-center gap-2">
            {isSignUp ? 'Return to Session' : 'Register New Aura'} <Sparkles size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
