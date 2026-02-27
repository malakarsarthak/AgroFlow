import React from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  Droplets, 
  BarChart3, 
  MessageSquareText, 
  Calendar,
  Sprout,
  LogOut
} from 'lucide-react';
import { Language, translations } from '../i18n';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
  language: Language;
}

export default function Sidebar({ activeTab, setActiveTab, onLogout, language }: SidebarProps) {
  const t = translations[language];
  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'setup', label: t.farmSetup, icon: Settings },
    { id: 'budget', label: t.waterBudget, icon: Droplets },
    { id: 'schedule', label: t.irrigationSchedule, icon: Calendar },
    { id: 'analytics', label: t.analytics, icon: BarChart3 },
    { id: 'ai', label: t.aiAssistant, icon: MessageSquareText },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-72 bg-white border-r border-zinc-200 flex-col h-screen sticky top-0 shadow-sm z-50">
        <div className="p-8 flex items-center gap-4">
          <div className="bg-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-600/20">
            <Sprout className="text-white w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tighter">AgroFlow</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
                activeTab === item.id 
                  ? "bg-emerald-600 text-white shadow-xl shadow-emerald-600/20" 
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                activeTab === item.id ? "text-white" : "text-zinc-400 group-hover:text-zinc-600"
              )} />
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
              {activeTab === item.id && (
                <div className="absolute right-0 top-0 h-full w-1 bg-white/20" />
              )}
            </button>
          ))}
        </nav>
        
        <div className="p-6 border-t border-zinc-100 space-y-6">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300 group"
          >
            <LogOut className="w-5 h-5 text-zinc-400 group-hover:text-red-500 transition-colors" />
            <span className="font-bold text-sm tracking-tight">Sign Out</span>
          </button>

          <div className="bg-zinc-50 rounded-3xl p-5 border border-zinc-100 shadow-inner">
            <p className="text-[10px] text-zinc-400 uppercase font-black tracking-widest mb-3">System Status</p>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <span className="text-xs text-zinc-600 font-bold uppercase tracking-widest">Sensors Online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-zinc-200 px-1 py-1 z-[100] flex items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.08)]">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all duration-300 min-w-[56px]",
              activeTab === item.id 
                ? "text-emerald-600" 
                : "text-zinc-400"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5",
              activeTab === item.id ? "text-emerald-600" : "text-zinc-400"
            )} />
            <span className="text-[7px] font-black uppercase tracking-tighter truncate w-full text-center">{item.label.split(' ')[0]}</span>
            {activeTab === item.id && (
              <div className="w-1 h-1 bg-emerald-600 rounded-full mt-0.5" />
            )}
          </button>
        ))}
      </div>
    </>
  );
}
