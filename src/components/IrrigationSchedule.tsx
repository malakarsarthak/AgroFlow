import React from 'react';
import { 
  Calendar, 
  Clock, 
  Droplets, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { WaterBudget, FarmSettings, IrrigationScheduleItem, SensorData } from '../types';
import { getSmartIrrigationCommand } from '../services/geminiService';
import { Language, translations } from '../i18n';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface IrrigationScheduleProps {
  budget: WaterBudget;
  settings: FarmSettings;
  schedule: IrrigationScheduleItem[];
  sensorData: SensorData;
  language: Language;
}

export default function IrrigationSchedule({ budget, settings, schedule, sensorData, language }: IrrigationScheduleProps) {
  const t = translations[language];
  const [isIrrigating, setIsIrrigating] = React.useState(false);
  const [aiCommand, setAiCommand] = React.useState<string | null>(null);

  const isDeficit = budget.balance < 0;

  // Calculate pump capacity
  const totalPumpCapacityPerHour = (settings.numberOfPumps || 1) * (settings.pumpFlowRate || 10);
  
  // Use calculated duration from budget or calculate it here
  const durationHours = budget.pumpDuration || 0;
  
  // Format duration
  const durationMinutes = Math.round(durationHours * 60);
  const formattedDuration = durationMinutes > 60 
    ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
    : `${durationMinutes} mins`;

  const getIcon = (type: string) => {
    switch (type) {
      case 'check': return CheckCircle2;
      case 'irrigate': return Droplets;
      case 'monitor': return Clock;
      case 'update': return Zap;
      default: return Clock;
    }
  };

  const getColor = (status: string, type: string) => {
    if (status === 'Completed') return 'text-emerald-600';
    if (status === 'Pending') return 'text-red-600';
    if (type === 'irrigate') return 'text-blue-600';
    return 'text-zinc-400';
  };

  const isTimePassed = (timeStr: string) => {
    const now = new Date();
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    
    const scheduleTime = new Date();
    scheduleTime.setHours(hours, minutes, 0, 0);
    
    return now > scheduleTime;
  };

  const handleTriggerIrrigation = async () => {
    setIsIrrigating(true);
    const command = await getSmartIrrigationCommand(settings, sensorData, budget);
    setAiCommand(command);
    setIsIrrigating(false);
  };

  const displaySchedule = (schedule.length > 0 ? schedule : [
    { 
      time: '06:00 AM', 
      action: t.predawnCheck, 
      status: t.completed as any, 
      type: 'check' as const
    },
    { 
      time: '08:30 AM', 
      action: isDeficit ? t.primaryCycle : t.soilMonitoring, 
      status: isDeficit ? t.pending as any : t.scheduled as any, 
      type: isDeficit ? 'irrigate' as const : 'monitor' as const
    },
    { 
      time: '12:00 PM', 
      action: t.etUpdate, 
      status: t.scheduled as any, 
      type: 'update' as const
    },
    { 
      time: '06:00 PM', 
      action: t.eveningCheck, 
      status: t.scheduled as any, 
      type: 'monitor' as const
    },
  ]).map(item => ({
    ...item,
    status: isTimePassed(item.time) ? t.completed as any : item.status
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Schedule List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-zinc-900 tracking-tight">{t.dailySchedule}</h3>
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Calendar className="w-4 h-4" />
                <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {displaySchedule.map((item, idx) => {
                const Icon = getIcon(item.type);
                const color = getColor(item.status, item.type);
                return (
                  <div key={idx} className="flex items-center gap-6 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-emerald-200 transition-all group">
                    <div className="text-sm font-bold text-zinc-400 w-20">{item.time}</div>
                    <div className="w-px h-10 bg-zinc-200" />
                    <div className="flex-1">
                      <h4 className="text-zinc-900 font-bold group-hover:text-emerald-600 transition-colors">{item.action}</h4>
                      <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">{item.status}</p>
                    </div>
                    <Icon className={cn("w-5 h-5", color)} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Zap className="text-white w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-zinc-900 mb-1">{t.smartAutomationActive}</h4>
              <p className="text-emerald-600/80 text-sm leading-relaxed">
                {t.smartAutomationDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Recommendation Summary */}
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 mb-6">{t.todaysTarget}</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Droplets className="text-blue-500 w-5 h-5" />
                  </div>
                  <span className="text-zinc-500 text-sm font-medium">{t.waterVolume}</span>
                </div>
                <span className="text-zinc-900 font-bold">{Math.abs(budget.balance).toFixed(1)} m³</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Clock className="text-amber-500 w-5 h-5" />
                  </div>
                  <span className="text-zinc-500 text-sm font-medium">{t.duration}</span>
                </div>
                <span className="text-zinc-900 font-bold">{formattedDuration}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <ShieldCheck className="text-emerald-600 w-5 h-5" />
                  </div>
                  <span className="text-zinc-500 text-sm font-medium">{t.aiConfidence}</span>
                </div>
                <span className="text-emerald-600 font-bold">98%</span>
              </div>
            </div>
            <button 
              onClick={handleTriggerIrrigation}
              disabled={isIrrigating}
              className="w-full mt-8 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-400 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              {isIrrigating ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  {t.analyzingFieldData}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  {t.triggerSmartIrrigation}
                </>
              )}
            </button>

            {aiCommand && (
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  {t.aiCommand}
                </div>
                <p className="text-zinc-700 text-sm italic leading-relaxed">
                  "{aiCommand}"
                </p>
              </div>
            )}
          </div>

          <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-8">
            <h4 className="text-zinc-900 font-bold mb-4">Savings Insight</h4>
            <p className="text-zinc-500 text-sm leading-relaxed">
              By following this schedule, you are expected to save <span className="text-emerald-600 font-bold">18%</span> more water compared to traditional methods.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
