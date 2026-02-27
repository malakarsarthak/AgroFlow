import React from 'react';
import { Bell, Search, User as UserIcon, MapPin, Mic, Languages } from 'lucide-react';

import { User } from '../types';
import { Language } from '../i18n';

interface HeaderProps {
  title: string;
  location: string;
  user: User;
  onOpenVoiceAssistant: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function Header({ title, location, user, onOpenVoiceAssistant, language, onLanguageChange }: HeaderProps) {
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
  return (
    <header className="h-16 lg:h-20 border-b border-zinc-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-2 lg:gap-4">
        <h2 className="text-lg lg:text-2xl font-bold text-zinc-900 tracking-tight truncate max-w-[120px] lg:max-w-none">{title}</h2>
        <div className="hidden lg:block h-6 w-px bg-zinc-200 mx-2" />
        <div className="hidden lg:flex items-center gap-2 text-zinc-500">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-medium">{location}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-6">
        <div className="flex items-center bg-zinc-100 rounded-xl p-1 border border-zinc-200 scale-90 lg:scale-100">
          {[
            { code: Language.EN, label: 'EN' },
            { code: Language.HI, label: 'हिं' },
            { code: Language.MR, label: 'म' },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => onLanguageChange(lang.code)}
              className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${
                language === lang.code 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <button 
          onClick={onOpenVoiceAssistant}
          className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-bold text-sm transition-all border border-emerald-200/50 group"
        >
          <div className="relative">
            <Mic className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <span className="hidden lg:inline">Voice Assistant</span>
        </button>

        <div className="relative hidden xl:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search analytics..." 
            className="bg-zinc-50 border border-zinc-200 rounded-xl py-2 pl-10 pr-4 text-sm text-zinc-700 focus:outline-none focus:border-emerald-500/50 w-64 transition-all"
          />
        </div>
        
        <button className="relative p-2 text-zinc-400 hover:text-zinc-900 transition-colors hidden lg:block">
          <Bell className="w-6 h-6" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        <div className="flex items-center gap-2 lg:gap-3 pl-2 lg:pl-6 border-l border-zinc-200">
          <div className="text-right hidden lg:block">
            <p className="text-sm font-bold text-zinc-900">{user.name}</p>
            <p className="text-xs text-zinc-500">{user.farmName || 'Premium Farmer'}</p>
          </div>
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xs lg:text-base">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
