import React from 'react';
import { 
  MapPin, 
  Maximize2, 
  Sprout, 
  Droplets, 
  Sun, 
  Save,
  CheckCircle2,
  Navigation,
  Loader2,
  Settings2,
  Zap,
  Database
} from 'lucide-react';
import { FarmSettings, CropType, IrrigationMethod, Season } from '../types';
import { Language, translations } from '../i18n';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FarmSetupProps {
  settings: FarmSettings;
  onSave: (settings: FarmSettings) => void;
  language: Language;
}

export default function FarmSetup({ settings, onSave, language }: FarmSetupProps) {
  const t = translations[language];
  const [formData, setFormData] = React.useState<FarmSettings>(settings);
  const [isSaved, setIsSaved] = React.useState(false);
  const [isDetecting, setIsDetecting] = React.useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // We'll use the coordinates as the location string. 
        // Gemini's search tool is very good at understanding lat/long.
        const locationString = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setFormData(prev => ({ ...prev, location: locationString }));
        setIsDetecting(false);
      },
      (error) => {
        console.error("Error detecting location:", error);
        alert("Unable to retrieve your location. Please enter it manually.");
        setIsDetecting(false);
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-8 duration-700">
      <div className="crafted-card overflow-hidden !p-0">
        <div className="p-10 border-b border-zinc-100 bg-zinc-50/50">
          <h3 className="text-3xl font-bold text-zinc-900 tracking-tight">{t.farmConfiguration}</h3>
          <p className="text-zinc-500 text-sm mt-2 font-medium">{t.defineParameters}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Location */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                <MapPin className="w-4 h-4 text-emerald-600" />
                {t.locationDistrict}
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 pl-5 pr-14 text-zinc-900 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                  placeholder="e.g. Nashik, Maharashtra"
                />
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetecting}
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all",
                    isDetecting ? "text-emerald-500 bg-emerald-50" : "text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50"
                  )}
                  title="Detect current location"
                >
                  {isDetecting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Navigation className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Farm Size */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                <Maximize2 className="w-4 h-4 text-emerald-600" />
                {t.farmSizeHectares}
              </label>
              <input
                type="number"
                value={formData.farmSize}
                onChange={(e) => setFormData({ ...formData, farmSize: Number(e.target.value) })}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                step="0.1"
              />
            </div>

            {/* Crop Selection */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                <Sprout className="w-4 h-4 text-emerald-600" />
                {t.cropSelection}
              </label>
              <select
                value={formData.crop}
                onChange={(e) => setFormData({ ...formData, crop: e.target.value as CropType })}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none cursor-pointer"
              >
                {Object.values(CropType).map((crop) => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
            </div>

            {/* Irrigation Method */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                <Droplets className="w-4 h-4 text-emerald-600" />
                {t.irrigationMethod}
              </label>
              <select
                value={formData.irrigationMethod}
                onChange={(e) => setFormData({ ...formData, irrigationMethod: e.target.value as IrrigationMethod })}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none cursor-pointer"
              >
                {Object.values(IrrigationMethod).map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            {/* Season */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                <Sun className="w-4 h-4 text-emerald-600" />
                {t.season}
              </label>
              <select
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value as Season })}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all appearance-none cursor-pointer"
              >
                {Object.values(Season).map((season) => (
                  <option key={season} value={season}>{season}</option>
                ))}
              </select>
            </div>

            {/* Number of Pumps */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                <Settings2 className="w-4 h-4 text-emerald-600" />
                {t.numberOfPumps || 'Number of Pumps'}
              </label>
              <input
                type="number"
                value={formData.numberOfPumps}
                onChange={(e) => setFormData({ ...formData, numberOfPumps: Number(e.target.value) })}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                min="1"
                step="1"
              />
            </div>

            {/* Pump Flow Rate */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                <Zap className="w-4 h-4 text-emerald-600" />
                {t.pumpFlowRate || 'Pump Flow Rate (m³/h)'}
              </label>
              <input
                type="number"
                value={formData.pumpFlowRate}
                onChange={(e) => setFormData({ ...formData, pumpFlowRate: Number(e.target.value) })}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                min="0.5"
                step="0.5"
              />
            </div>
          </div>

          <div className="pt-10 border-t border-zinc-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
                <Database className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-zinc-900">{t.firebaseSetup}</h4>
                <p className="text-zinc-500 text-xs font-medium">{t.firebaseDesc}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  {t.firebaseUrl}
                </label>
                <input
                  type="url"
                  value={formData.firebaseUrl || ''}
                  onChange={(e) => setFormData({ ...formData, firebaseUrl: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                  placeholder="https://your-project-default-rtdb.firebaseio.com"
                />
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  {t.firebaseApiKey}
                </label>
                <input
                  type="password"
                  value={formData.firebaseApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, firebaseApiKey: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                  placeholder="AIzaSy..."
                />
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  {t.firebasePath}
                </label>
                <input
                  type="text"
                  value={formData.firebasePath || ''}
                  onChange={(e) => setFormData({ ...formData, firebasePath: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                  placeholder="soilMoisture"
                />
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-zinc-400">
              <CheckCircle2 className={cn("w-6 h-6 transition-all duration-500", isSaved ? "text-emerald-500 scale-110" : "text-zinc-200")} />
              <span className="text-sm font-bold">{isSaved ? t.settingsSaved : t.unsavedChanges}</span>
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all duration-300 shadow-xl shadow-emerald-600/20 uppercase tracking-widest text-xs"
            >
              <Save className="w-5 h-5" />
              {t.saveConfiguration}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: t.whyThisMatters, content: t.accurateSettingsDesc },
          { title: t.efficiencyBoost, content: t.switchingToDripDesc },
          { title: t.dataPrivacy, content: t.dataPrivacyDesc }
        ].map((item, idx) => (
          <div key={idx} className="crafted-card">
            <h4 className="text-zinc-900 font-black text-xs uppercase tracking-widest mb-4">{item.title}</h4>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">
              {item.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
