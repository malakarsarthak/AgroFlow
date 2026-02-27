import React from 'react';
import { 
  Droplets, 
  CloudRain, 
  Waves, 
  Thermometer, 
  Wind, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Settings,
  Mic,
  Clock,
  Wifi,
  WifiOff,
  Activity,
  Zap
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { SensorData, WaterBudget, FarmSettings, FirebaseStatus } from '../types';
import { Language, translations } from '../i18n';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DashboardProps {
  sensorData: SensorData[];
  waterBudget: WaterBudget;
  farmSettings: FarmSettings;
  onSensorChange?: (newData: Partial<SensorData>) => void;
  onTalkToAI?: () => void;
  language: Language;
  firebaseStatus: FirebaseStatus;
  isManualMode: boolean;
  isPumpOn: boolean;
  onPumpToggle: (status: boolean) => void;
}

export default function Dashboard({ 
  sensorData, 
  waterBudget, 
  farmSettings, 
  onSensorChange, 
  onTalkToAI, 
  language,
  firebaseStatus,
  isManualMode,
  isPumpOn,
  onPumpToggle
}: DashboardProps) {
  const t = translations[language];
  const currentSensor = sensorData[sensorData.length - 1];
  
  // Calculate pump capacity
  const totalPumpCapacityPerHour = (farmSettings.numberOfPumps || 1) * (farmSettings.pumpFlowRate || 10);
  
  // Use calculated duration from waterBudget or calculate it here
  const durationHours = waterBudget.pumpDuration || 0;
  
  // Format duration
  const durationMinutes = Math.round(durationHours * 60);
  const formattedDuration = durationMinutes > 60 
    ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
    : `${durationMinutes} mins`;

  const stats = [
    { 
      label: t.soilMoisture, 
      value: `${currentSensor.soilMoisture.toFixed(1)}%`, 
      icon: Droplets, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10',
      trend: currentSensor.soilMoisture > 40 ? t.optimal : t.low
    },
    { 
      label: t.rainfall, 
      value: `${currentSensor.rainfall.toFixed(1)} mm`, 
      icon: CloudRain, 
      color: 'text-indigo-500', 
      bg: 'bg-indigo-500/10',
      trend: currentSensor.rainfall > 0 ? t.active : t.dry
    },
    { 
      label: t.groundwater, 
      value: `${currentSensor.groundwaterLevel.toFixed(1)} m`, 
      icon: Waves, 
      color: 'text-cyan-500', 
      bg: 'bg-cyan-500/10',
      trend: t[waterBudget.groundwaterStatus.toLowerCase() as keyof typeof t] || waterBudget.groundwaterStatus
    },
    { 
      label: t.temperature, 
      value: `${currentSensor.temperature.toFixed(1)}°C`, 
      icon: Thermometer, 
      color: 'text-orange-500', 
      bg: 'bg-orange-500/10',
      trend: t.normal
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Connection Status & Mode Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 bg-white border border-zinc-100 px-6 py-3 rounded-2xl shadow-sm">
          {firebaseStatus === 'connected' ? (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Wifi className="w-5 h-5 text-emerald-500" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              </div>
              <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Firebase Connected</span>
            </div>
          ) : firebaseStatus === 'connecting' ? (
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500 animate-pulse" />
              <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Connecting to ESP32...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <WifiOff className="w-5 h-5 text-zinc-400" />
              <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Firebase Offline</span>
            </div>
          )}
        </div>

        {isManualMode && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-6 py-3 rounded-2xl animate-bounce">
              <Settings className="w-5 h-5 text-amber-600" />
              <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Manual Override Active</span>
            </div>
            <button 
              onClick={() => onSensorChange?.({})} // Sending empty object to trigger live update in App.tsx
              className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
            >
              Reset to Live
            </button>
          </div>
        )}
      </div>

      {/* Manual Controls Panel */}
      <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-600/20 flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
            <Settings className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-xl tracking-tight">{t.manualOverride}</h3>
            <p className="text-emerald-100/80 text-sm">
              {isManualMode 
                ? '⚠️ Overriding live ESP32 data' 
                : (firebaseStatus === 'connected' ? '✅ Receiving live ESP32 data' : t.adjustSliders)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-10 flex-1 justify-end relative z-10">
          <div className="space-y-3 min-w-[180px]">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-80">
              <span>{t.soilMoisture}</span>
              <span>{currentSensor.soilMoisture.toFixed(0)}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={currentSensor.soilMoisture}
              onChange={(e) => onSensorChange?.({ soilMoisture: Number(e.target.value) })}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>
          <div className="space-y-3 min-w-[180px]">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-80">
              <span>{t.rainfall}</span>
              <span>{currentSensor.rainfall.toFixed(1)} mm</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="50" 
              step="0.1"
              value={currentSensor.rainfall}
              onChange={(e) => onSensorChange?.({ rainfall: Number(e.target.value) })}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="crafted-stat-card">
            <div className="flex items-start justify-between mb-6">
              <div className={cn("p-4 rounded-2xl", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <span className={cn(
                "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                stat.trend === t.critical ? 'bg-red-500/10 text-red-500' : 
                stat.trend === t.optimal || stat.trend === t.abundant ? 'bg-emerald-500/10 text-emerald-500' : 
                'bg-zinc-100 text-zinc-500'
              )}>
                {stat.trend}
              </span>
            </div>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">
              {stat.label}
              {stat.label === t.soilMoisture && firebaseStatus === 'connected' && !isManualMode && (
                <span className="ml-2 inline-flex items-center gap-1 text-[8px] text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md animate-pulse">
                  <Activity className="w-2 h-2" />
                  LIVE
                </span>
              )}
            </p>
            <h3 className="text-3xl font-bold text-zinc-900 tracking-tighter">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Trend Chart & Pump Control */}
        <div className="lg:col-span-2 space-y-8">
          {/* Dedicated Pump Control Section */}
          <div className="crafted-card bg-zinc-900 text-white border-none shadow-2xl shadow-zinc-900/40 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full -mr-48 -mt-48 blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full -ml-32 -mb-32 blur-3xl" />
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="flex items-center gap-6">
                <div className={cn(
                  "p-6 rounded-[2.5rem] transition-all duration-700 relative",
                  isPumpOn ? "bg-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.4)] scale-105" : "bg-zinc-800"
                )}>
                  <Activity className={cn("w-12 h-12", isPumpOn ? "text-white animate-spin-slow" : "text-zinc-600")} />
                  {isPumpOn && (
                    <div className="absolute inset-0 rounded-[2.5rem] border-4 border-white/20 animate-ping" />
                  )}
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tighter mb-1">{t.pumpControl}</h3>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2.5 h-2.5 rounded-full", isPumpOn ? "bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" : "bg-zinc-700")} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                      {t.pumpStatus}: <span className={isPumpOn ? "text-emerald-400" : "text-zinc-500"}>{isPumpOn ? t.on : t.off}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-10">
                <div className="text-center md:text-left space-y-1">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.numberOfPumps}</p>
                  <p className="text-2xl font-black tracking-tight">{farmSettings.numberOfPumps}</p>
                </div>
                <div className="text-center md:text-left space-y-1">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.pumpFlowRate}</p>
                  <p className="text-2xl font-black tracking-tight">{farmSettings.pumpFlowRate} <span className="text-xs text-zinc-500">m³/h</span></p>
                </div>
                <div className="text-center md:text-left space-y-1">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t.pumpDuration}</p>
                  <p className={cn("text-2xl font-black tracking-tight", waterBudget.balance < 0 ? "text-amber-400" : "text-zinc-500")}>
                    {formattedDuration}
                  </p>
                </div>
                
                <button
                  onClick={() => onPumpToggle(!isPumpOn)}
                  className={cn(
                    "w-full lg:w-auto px-12 py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-500 shadow-2xl relative overflow-hidden group/btn",
                    isPumpOn 
                      ? "bg-red-500 hover:bg-red-400 text-white shadow-red-500/40" 
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/40"
                  )}
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    <Zap className={cn("w-4 h-4", isPumpOn && "animate-pulse")} />
                    {isPumpOn ? t.stopPump : t.startPump}
                  </span>
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                </button>
              </div>
            </div>

            {isPumpOn && (
              <div className="mt-10 pt-10 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] animate-pulse">
                    LIVE PUMPING: {totalPumpCapacityPerHour} m³/h
                  </span>
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    System Efficiency: 98.4%
                  </span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden relative">
                  <div className="absolute inset-0 bg-emerald-500/20 animate-pulse" />
                  <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 animate-[loading_2s_linear_infinite] w-1/3 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                </div>
              </div>
            )}
          </div>

          <div className="crafted-card">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">{t.soilMoisture} Trend</h3>
                <p className="text-zinc-500 text-sm">{t.realTimeMonitoring}</p>
              </div>
              <div className="flex items-center gap-2 bg-zinc-50 p-1.5 rounded-2xl border border-zinc-100">
                <button className="px-5 py-2 text-[10px] font-black text-emerald-600 bg-white shadow-sm rounded-xl uppercase tracking-widest">LIVE</button>
                <button className="px-5 py-2 text-[10px] font-black text-zinc-400 hover:text-zinc-600 transition-colors uppercase tracking-widest">HISTORY</button>
              </div>
            </div>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sensorData}>
                  <defs>
                    <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#a1a1aa" 
                    fontSize={10} 
                    fontWeight={700}
                    tickLine={false} 
                    axisLine={false}
                    interval={4}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#a1a1aa" 
                    fontSize={10} 
                    fontWeight={700}
                    tickLine={false} 
                    axisLine={false}
                    domain={[0, 100]}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e4e4e7', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', border: 'none' }}
                    itemStyle={{ color: '#059669', fontWeight: 700 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="soilMoisture" 
                    stroke="#10b981" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorMoisture)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Zones Section */}
          <div className="crafted-card">
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight mb-8">{t.fieldZones}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((zone) => (
                <div key={zone} className="bg-zinc-50/50 border border-zinc-100 rounded-[2rem] p-6 space-y-4 hover:border-emerald-200 transition-all group">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Zone {zone}</span>
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      zone === 1 && currentSensor.soilMoisture < 40 ? "bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    )} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-zinc-900 tracking-tighter group-hover:text-emerald-600 transition-colors">
                      {zone === 1 ? currentSensor.soilMoisture.toFixed(0) : (currentSensor.soilMoisture + (zone * 2)).toFixed(0)}%
                    </p>
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">{t.soilMoisture}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendation Card */}
        <div className="crafted-card flex flex-col border-emerald-100 bg-emerald-50/30">
          <div className="mb-10">
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">{t.aiRecommendation}</h3>
            <p className="text-zinc-500 text-sm">{t.smartIrrigationIntelligence}</p>
          </div>
          
          <div className={cn(
            "flex-1 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center gap-6",
            waterBudget.balance < 0 ? "bg-red-50 border border-red-100 shadow-lg shadow-red-500/5" : "bg-white border border-emerald-100 shadow-lg shadow-emerald-500/5"
          )}>
            {waterBudget.balance < 0 ? (
              <div className="p-5 bg-red-100 rounded-3xl">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
            ) : (
              <div className="p-5 bg-emerald-100 rounded-3xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
            )}
            <div>
              <h4 className={cn(
                "text-xl font-bold mb-3 tracking-tight",
                waterBudget.balance < 0 ? "text-red-600" : "text-emerald-600"
              )}>
                {waterBudget.balance < 0 ? t.irrigationRequired : t.optimalStatus}
              </h4>
              <p className="text-zinc-600 text-sm leading-relaxed font-medium">
                {waterBudget.recommendation}
              </p>
            </div>
          </div>

          <div className="mt-10 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{t.aiConfidence}</span>
              <span className="text-emerald-600 text-sm font-black">94%</span>
            </div>
            <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden border border-zinc-200">
              <div className="bg-emerald-500 h-full w-[94%] rounded-full" />
            </div>
            {waterBudget.balance < 0 && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest">{t.pumpDuration}</p>
                    <p className="text-sm font-bold text-amber-900">{formattedDuration}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest">Capacity</p>
                  <p className="text-sm font-bold text-amber-900">{totalPumpCapacityPerHour} m³/h</p>
                </div>
              </div>
            )}
            <button 
              onClick={onTalkToAI}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 group"
            >
              <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {t.talkToAI}
            </button>
          </div>
        </div>
      </div>

      {/* Water Budget Summary */}
      <div className="crafted-card">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">{t.waterBudgetSummary}</h3>
            <p className="text-zinc-500 text-sm">{t.dailyBalance} {farmSettings.crop} field</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Available</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Demand</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-3">
            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">{t.availableWater}</p>
            <h4 className="text-4xl font-bold text-zinc-900 tracking-tighter">{waterBudget.availableWater.toFixed(1)} <span className="text-lg text-zinc-300 font-medium">m³</span></h4>
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
              <TrendingUp className="w-4 h-4" />
              <span>Includes {waterBudget.rainfallContribution.toFixed(1)} m³ rainfall</span>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">{t.cropDemand}</p>
            <h4 className="text-4xl font-bold text-zinc-900 tracking-tighter">{waterBudget.cropDemand.toFixed(1)} <span className="text-lg text-zinc-300 font-medium">m³</span></h4>
            <p className="text-zinc-500 text-xs font-bold">Based on {farmSettings.irrigationMethod}</p>
          </div>
          <div className="space-y-3">
            <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">{t.waterBalance}</p>
            <h4 className={cn(
              "text-4xl font-bold tracking-tighter",
              waterBudget.balance < 0 ? "text-red-500" : "text-emerald-500"
            )}>
              {waterBudget.balance > 0 ? '+' : ''}{waterBudget.balance.toFixed(1)} <span className="text-lg opacity-30 font-medium">m³</span>
            </h4>
            <p className="text-zinc-500 text-xs font-bold">
              {waterBudget.balance < 0 ? t.deficitDetected : t.surplusAvailable}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
