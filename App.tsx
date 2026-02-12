
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, MealEntry, WorkoutPlan, UserAccount } from './types';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import NutritionLog from './components/NutritionLog';
import FitnessTracker from './components/FitnessTracker';
import AICoach from './components/AICoach';
import ProfileView from './components/ProfileView';
import AboutView from './components/AboutView';
import Sidebar from './components/Sidebar';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [fatigue, setFatigue] = useState(3);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const sessionEmail = localStorage.getItem('aurafit_session_email');
    if (sessionEmail) {
      const users: UserAccount[] = JSON.parse(localStorage.getItem('aurafit_users') || '[]');
      const user = users.find(u => u.email === sessionEmail);
      if (user) setCurrentUser(user);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      const userMeals = localStorage.getItem(`aurafit_meals_${currentUser.id}`);
      const userWorkouts = localStorage.getItem(`aurafit_workouts_${currentUser.id}`);
      setMeals(userMeals ? JSON.parse(userMeals) : []);
      setWorkouts(userWorkouts ? JSON.parse(userWorkouts) : []);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`aurafit_meals_${currentUser.id}`, JSON.stringify(meals));
      localStorage.setItem(`aurafit_workouts_${currentUser.id}`, JSON.stringify(workouts));
    }
  }, [meals, workouts, currentUser]);

  // Reset scroll position to top when switching tabs
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem('aurafit_session_email', user.email);
  };

  const handleLogout = () => {
    localStorage.removeItem('aurafit_session_email');
    setCurrentUser(null);
    setMeals([]);
    setWorkouts([]);
    setActiveTab('dashboard');
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, profile };
    setCurrentUser(updatedUser);
    
    const users: UserAccount[] = JSON.parse(localStorage.getItem('aurafit_users') || '[]');
    const index = users.findIndex(u => u.id === currentUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem('aurafit_users', JSON.stringify(users));
    }
    // Redirect to Nutrition section after registration
    setActiveTab('nutrition');
  };

  const handleProfileUpdate = (profile: UserProfile) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, profile };
    setCurrentUser(updatedUser);
    
    const users: UserAccount[] = JSON.parse(localStorage.getItem('aurafit_users') || '[]');
    const index = users.findIndex(u => u.id === currentUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem('aurafit_users', JSON.stringify(users));
    }
  };

  const handleRemoveMeal = (mealId: string) => {
    setMeals(prev => prev.filter(m => m.id !== mealId));
  };

  if (!currentUser) return <Auth onLogin={handleLogin} />;
  if (!currentUser.profile) return <Onboarding userId={currentUser.id} onComplete={handleOnboardingComplete} onCancel={handleLogout} />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard profile={currentUser.profile!} meals={meals} workouts={workouts} />;
      case 'nutrition': return <NutritionLog userId={currentUser.id} profile={currentUser.profile!} meals={meals} onAddMeal={m => setMeals([m, ...meals])} onRemoveMeal={handleRemoveMeal} />;
      case 'fitness': return <FitnessTracker userId={currentUser.id} profile={currentUser.profile!} workouts={workouts} onAddWorkout={w => setWorkouts([w, ...workouts])} fatigue={fatigue} setFatigue={setFatigue} />;
      case 'coach': return <AICoach profile={currentUser.profile!} meals={meals} workouts={workouts} />;
      case 'about': return <AboutView />;
      case 'profile': return <ProfileView userId={currentUser.id} profile={currentUser.profile!} meals={meals} onUpdateProfile={handleProfileUpdate} onSignOut={handleLogout} />;
      default: return <Dashboard profile={currentUser.profile!} meals={meals} workouts={workouts} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main ref={mainRef} className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto pb-24 md:pb-8">
          {renderContent()}
        </div>
      </main>
      
      {/* Mobile Sticky Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 glass border-t flex justify-around p-4 z-50">
        {['dashboard', 'nutrition', 'fitness', 'coach', 'about', 'profile'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)} 
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === tab ? 'text-brand' : 'text-slate-400'}`}
          >
            <div className={`w-8 h-1 rounded-full ${activeTab === tab ? 'bg-brand' : 'bg-transparent'}`} />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {tab === 'nutrition' ? 'Food' : tab === 'fitness' ? 'Gym' : tab === 'dashboard' ? 'Home' : tab === 'about' ? 'Info' : tab}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default App;
