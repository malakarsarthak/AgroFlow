import React from 'react';
import { 
  Droplets, 
  CloudRain, 
  Waves, 
  ArrowRight, 
  Info,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { WaterBudget, FarmSettings } from '../types';
import { Language, translations } from '../i18n';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface WaterBudgetViewProps {
  budget: WaterBudget;
  settings: FarmSettings;
  language: Language;
}

export default function WaterBudgetView({ budget, settings, language }: WaterBudgetViewProps) {
  const t = translations[language];
  const isDeficit = budget.balance < 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Main Balance Card */}
      <div className={cn(
        "relative overflow-hidden border rounded-[3rem] p-12 shadow-2xl transition-all duration-700",
        isDeficit ? "bg-red-50 border-red-100 shadow-red-500/5" : "bg-emerald-50 border-emerald-100 shadow-emerald-500/5"
      )}>
        <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 100 C 20 0, 50 0, 100 100 Z" fill="currentColor" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="space-y-6 text-center lg:text-left flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-white/20 backdrop-blur-md">
              <div className={cn("w-2 h-2 rounded-full", isDeficit ? "bg-red-500 animate-pulse" : "bg-emerald-500")} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Real-time Analysis</span>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-zinc-400 text-xs font-black uppercase tracking-[0.3em]">{t.waterBalance}</h3>
              <div className="flex items-baseline gap-4 justify-center lg:justify-start">
                <span className={cn(
                  "text-8xl font-black tracking-tighter leading-none",
                  isDeficit ? "text-red-600" : "text-emerald-600"
                )}>
                  {budget.balance > 0 ? '+' : ''}{budget.balance.toFixed(1)}
                </span>
                <span className="text-3xl font-black text-zinc-300">m³</span>
              </div>
            </div>

            <p className="text-zinc-500 max-w-lg leading-relaxed font-medium text-lg">
              {isDeficit 
                ? `Your field is currently in a water deficit. To maintain optimal growth for ${settings.crop}, you need to apply irrigation.` 
                : `Your field has a healthy water surplus. No immediate irrigation is required to sustain your ${settings.crop} crop.`}
            </p>
          </div>

          <div className="bg-white rounded-[2.5rem] p-10 w-full lg:w-[450px] space-y-8 shadow-2xl shadow-zinc-900/5 border border-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
            
            <div className="flex items-center justify-between">
              <h4 className="text-zinc-900 font-black text-xs uppercase tracking-widest">Resource Allocation</h4>
              <span className={cn(
                "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest",
                isDeficit ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
              )}>
                {isDeficit ? 'Deficit Detected' : 'Optimal Status'}
              </span>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Available Water</span>
                  </div>
                  <span className="text-zinc-900 font-black">{budget.availableWater.toFixed(1)} <span className="text-[10px] text-zinc-400">m³</span></span>
                </div>
                <div className="w-full bg-zinc-50 rounded-full h-3 border border-zinc-100 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (budget.availableWater / (budget.availableWater + budget.cropDemand)) * 100)}%` }} 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-red-500" />
                    <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Crop Demand</span>
                  </div>
                  <span className="text-zinc-900 font-black">{budget.cropDemand.toFixed(1)} <span className="text-[10px] text-zinc-400">m³</span></span>
                </div>
                <div className="w-full bg-zinc-50 rounded-full h-3 border border-zinc-100 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-red-600 to-red-400 h-full rounded-full shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-all duration-1000" 
                    style={{ width: `${Math.min(100, (budget.cropDemand / (budget.availableWater + budget.cropDemand)) * 100)}%` }} 
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-50 flex items-center justify-between text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              <span>Updated: Just Now</span>
              <span>Confidence: 98%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <Droplets className="text-blue-500 w-6 h-6" />
            </div>
            <h4 className="text-zinc-900 font-bold">Soil Reservoir</h4>
          </div>
          <p className="text-zinc-500 text-sm leading-relaxed">
            The current water stored in the root zone based on soil moisture sensors.
          </p>
          <div className="pt-4 border-t border-zinc-100 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900">{(budget.availableWater - budget.rainfallContribution).toFixed(1)}</span>
            <span className="text-zinc-400 text-sm font-bold">m³</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <CloudRain className="text-indigo-500 w-6 h-6" />
            </div>
            <h4 className="text-zinc-900 font-bold">Rainfall Credit</h4>
          </div>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Effective rainfall captured by the field in the last 24 hours.
          </p>
          <div className="pt-4 border-t border-zinc-100 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900">{budget.rainfallContribution.toFixed(1)}</span>
            <span className="text-zinc-400 text-sm font-bold">m³</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-3xl p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-50 rounded-2xl">
              <Waves className="text-cyan-500 w-6 h-6" />
            </div>
            <h4 className="text-zinc-900 font-bold">Groundwater</h4>
          </div>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Current status of the local aquifer. High levels indicate sustainable pumping.
          </p>
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-lg font-bold text-zinc-900">{budget.groundwaterStatus}</span>
            <div className={cn(
              "w-3 h-3 rounded-full",
              budget.groundwaterStatus === 'Critical' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
            )} />
          </div>
        </div>
      </div>

      {/* Actionable Insights */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Info className="text-emerald-600 w-5 h-5" />
          <h4 className="text-zinc-900 font-bold">Budget Insights</h4>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 font-bold text-sm">1</div>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Your irrigation efficiency is set to <span className="text-zinc-900 font-bold">{settings.irrigationMethod}</span>. Upgrading to Smart Drip could save an additional <span className="text-emerald-600 font-bold">12.5 m³</span> per day.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 font-bold text-sm">2</div>
            <p className="text-zinc-500 text-sm leading-relaxed">
              The upcoming 48-hour forecast shows a 20% chance of rain. Consider delaying non-critical irrigation to maximize natural water capture.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
