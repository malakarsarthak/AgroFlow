import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { WaterBudget, FarmSettings } from '../types';
import { Language, translations } from '../i18n';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AnalyticsProps {
  budget: WaterBudget;
  settings: FarmSettings;
  language: Language;
}

export default function Analytics({ budget, settings, language }: AnalyticsProps) {
  const t = translations[language];
  // Dynamic Calculations
  const getEfficiencyBase = (method: string) => {
    switch (method) {
      case 'Flood Irrigation': return 62;
      case 'Sprinkler Irrigation': return 78;
      case 'Drip Irrigation': return 91;
      case 'Smart Drip (AI Controlled)': return 96;
      default: return 75;
    }
  };

  const waterUseEfficiency = getEfficiencyBase(settings.irrigationMethod) + (budget.balance >= 0 ? 2.5 : -5.2);
  const pumpingSavings = (budget.rainfallContribution * 0.45).toFixed(0); // $0.45 per m3 saved
  const yieldImpact = budget.balance < -50 ? -8 : (budget.balance < 0 ? 4 : 14);
  const carbonReduction = (parseFloat(pumpingSavings) * 0.12).toFixed(1);

  const barData = [
    { name: t.available, value: budget.availableWater, fill: '#3b82f6' },
    { name: t.demand, value: budget.cropDemand, fill: '#ef4444' },
    { name: t.balance, value: Math.abs(budget.balance), fill: budget.balance >= 0 ? '#10b981' : '#f59e0b' },
  ];

  const pieData = [
    { name: t.soilStorage, value: budget.availableWater - budget.rainfallContribution },
    { name: t.rainfall, value: budget.rainfallContribution },
    { name: t.groundwaterUsed, value: budget.balance < 0 ? Math.abs(budget.balance) : 0 },
  ];

  const COLORS = ['#3b82f6', '#6366f1', '#14b8a6'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Comparison Chart */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-zinc-900 tracking-tight">{t.waterVolumeComparison}</h3>
            <p className="text-zinc-500 text-sm">{t.availableVsDemand}</p>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e4e4e7', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-zinc-900 tracking-tight">{t.usageDistribution}</h3>
            <p className="text-zinc-500 text-sm">{t.breakdownOfSources}</p>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e4e4e7', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  formatter={(value) => <span className="text-zinc-500 text-sm font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Efficiency Metrics */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
        <h3 className="text-xl font-bold text-zinc-900 tracking-tight mb-8">{t.systemEfficiencyMetrics}</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-2">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{t.waterUseEfficiency}</p>
            <h4 className="text-3xl font-bold text-emerald-600">{waterUseEfficiency.toFixed(1)}%</h4>
            <div className="w-full bg-zinc-100 rounded-full h-1.5 border border-zinc-200">
              <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${Math.min(100, waterUseEfficiency)}%` }} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{t.pumpingCostSavings}</p>
            <h4 className="text-3xl font-bold text-blue-600">${pumpingSavings}</h4>
            <p className="text-zinc-400 text-xs font-medium">{t.estimatedMonthlySavings}</p>
          </div>
          <div className="space-y-2">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{t.cropYieldImpact}</p>
            <h4 className={cn("text-3xl font-bold", yieldImpact >= 0 ? "text-indigo-600" : "text-red-500")}>
              {yieldImpact >= 0 ? '+' : ''}{yieldImpact}%
            </h4>
            <p className="text-zinc-400 text-xs font-medium">{t.projectedIncrease}</p>
          </div>
          <div className="space-y-2">
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">{t.carbonFootprint}</p>
            <h4 className="text-3xl font-bold text-zinc-400">-{carbonReduction}%</h4>
            <p className="text-zinc-400 text-xs font-medium">{t.reduction}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
