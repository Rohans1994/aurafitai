
import React from 'react';
import { NAVIGATION_ITEMS } from '../constants';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="hidden md:flex flex-col w-64 glass border-r h-full p-6">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white font-bold text-xl">
          A
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-brand to-emerald-700 bg-clip-text text-transparent">
          AuraFit AI
        </h1>
      </div>

      <nav className="flex-1 space-y-2">
        {NAVIGATION_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-brand text-white shadow-lg shadow-emerald-200'
                : 'text-slate-500 hover:bg-emerald-50 hover:text-brand'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Weekly Streak removed per user request */}
    </aside>
  );
};

export default Sidebar;
