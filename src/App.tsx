import React from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import FarmSetup from './components/FarmSetup';
import WaterBudgetView from './components/WaterBudgetView';
import IrrigationSchedule from './components/IrrigationSchedule';
import Analytics from './components/Analytics';
import AIAssistant from './components/AIAssistant';
import VoiceAssistant from './components/VoiceAssistant';
import Auth from './components/Auth';
import { Language, translations } from './i18n';
import { 
  FarmSettings, 
  SensorData, 
  WaterBudget, 
  CropType, 
  IrrigationMethod, 
  Season,
  User,
  IrrigationScheduleItem,
  FirebaseStatus
} from './types';
import { calculateWaterBudget, generateMockSensorData } from './utils/calculations';
import { getLocationEnvironmentalData, getDynamicIrrigationSchedule } from './services/geminiService';
import { subscribeToSensorData } from './services/firebase';
import { AlertTriangle } from 'lucide-react';

export default function App() {
  const [user, setUser] = React.useState<User | null>(null);
  const [activeTab, setActiveTab] = React.useState('dashboard');
  const [aiInitialPrompt, setAiInitialPrompt] = React.useState<string | undefined>();
  const [farmSettings, setFarmSettings] = React.useState<FarmSettings>({
    location: 'Nashik, Maharashtra',
    farmSize: 2.5,
    crop: CropType.FRUITS,
    irrigationMethod: IrrigationMethod.DRIP,
    season: Season.ZAID,
    numberOfPumps: 1,
    pumpFlowRate: 10,
  });

  const [sensorHistory, setSensorHistory] = React.useState<SensorData[]>([]);
  const [waterBudget, setWaterBudget] = React.useState<WaterBudget | null>(null);
  const [irrigationSchedule, setIrrigationSchedule] = React.useState<IrrigationScheduleItem[]>([]);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = React.useState(false);
  const [language, setLanguage] = React.useState<Language>(Language.EN);
  const [firebaseStatus, setFirebaseStatus] = React.useState<FirebaseStatus>('idle');
  const [isManualMode, setIsManualMode] = React.useState(false);
  const [isPumpOn, setIsPumpOn] = React.useState(false);

  const t = translations[language];

  // Initialize data and handle location-based updates
  React.useEffect(() => {
    const syncEnvironmentalData = async () => {
      setIsSyncing(true);
      const envData = await getLocationEnvironmentalData(farmSettings.location);
      
      setSensorHistory(prev => {
        const baseData = prev.length > 0 ? prev : generateMockSensorData();
        const last = baseData[baseData.length - 1];
        const updated = {
          ...last,
          ...envData,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        const newHistory = [...baseData.slice(0, -1), updated];
        const budget = calculateWaterBudget(farmSettings, updated);
        setWaterBudget(budget);
        
        // Fetch dynamic schedule
        getDynamicIrrigationSchedule(farmSettings, updated, budget).then(setIrrigationSchedule);
        
        return newHistory;
      });
      setIsSyncing(false);
    };

    syncEnvironmentalData();

    // Subscribe to Firebase for real-time ESP32 data
    const unsubscribe = subscribeToSensorData(
      farmSettings, 
      (newData) => {
        console.log("App received Firebase update:", newData);
        setIsManualMode(false); // Switch back to live mode when data arrives
        setSensorHistory(prev => {
          const baseData = prev.length > 0 ? prev : generateMockSensorData();
          const last = baseData[baseData.length - 1];
          const next: SensorData = {
            ...last,
            ...newData,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          
          console.log("Updating sensor history with:", next);
          
          const newHistory = prev.length > 0 
            ? [...prev.slice(1), next]
            : [...baseData.slice(0, -1), next];
            
          setWaterBudget(calculateWaterBudget(farmSettings, next));
          return newHistory;
        });
      },
      setFirebaseStatus
    );

    // Simulate real-time updates every 60 seconds (slower since we use real search)
    // Only used if Firebase is not providing data
    const interval = setInterval(() => {
      setSensorHistory(prev => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        const next: SensorData = {
          ...last,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          soilMoisture: Math.max(0, Math.min(100, last.soilMoisture + (Math.random() * 4 - 2.5))),
        };
        const newHistory = [...prev.slice(1), next];
        setWaterBudget(calculateWaterBudget(farmSettings, next));
        return newHistory;
      });
    }, 60000);

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [farmSettings.location, farmSettings.firebaseUrl, farmSettings.firebaseApiKey, farmSettings.firebasePath]);

  const handleSaveSettings = (newSettings: FarmSettings) => {
    setFarmSettings(newSettings);
    if (sensorHistory.length > 0) {
      setWaterBudget(calculateWaterBudget(newSettings, sensorHistory[sensorHistory.length - 1]));
    }
  };

  const handleSensorOverride = (newData: Partial<SensorData>) => {
    if (Object.keys(newData).length === 0) {
      setIsManualMode(false);
      return;
    }
    setIsManualMode(true);
    setSensorHistory(prev => {
      const last = prev[prev.length - 1];
      const updated = { ...last, ...newData, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      const newHistory = [...prev.slice(0, -1), updated];
      
      // Immediately update budget
      setWaterBudget(calculateWaterBudget(farmSettings, updated));
      
      return newHistory;
    });
  };

  const renderContent = () => {
    if (!waterBudget || sensorHistory.length === 0) return null;

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            sensorData={sensorHistory} 
            waterBudget={waterBudget} 
            farmSettings={farmSettings}
            onSensorChange={handleSensorOverride}
            onTalkToAI={() => setActiveTab('ai')}
            language={language}
            firebaseStatus={firebaseStatus}
            isManualMode={isManualMode}
            isPumpOn={isPumpOn}
            onPumpToggle={setIsPumpOn}
          />
        );
      case 'setup':
        return <FarmSetup settings={farmSettings} onSave={handleSaveSettings} language={language} />;
      case 'budget':
        return <WaterBudgetView budget={waterBudget} settings={farmSettings} language={language} />;
      case 'schedule':
        return (
          <IrrigationSchedule 
            budget={waterBudget} 
            settings={farmSettings} 
            schedule={irrigationSchedule} 
            sensorData={sensorHistory[sensorHistory.length - 1]}
            language={language}
          />
        );
      case 'analytics':
        return <Analytics budget={waterBudget} settings={farmSettings} language={language} />;
      case 'ai':
        return <AIAssistant farmSettings={farmSettings} sensorData={sensorHistory[sensorHistory.length - 1]} waterBudget={waterBudget} language={language} initialPrompt={aiInitialPrompt} />;
      default:
        return (
          <Dashboard 
            sensorData={sensorHistory} 
            waterBudget={waterBudget} 
            farmSettings={farmSettings} 
            language={language} 
            firebaseStatus={firebaseStatus}
            isManualMode={isManualMode}
            isPumpOn={isPumpOn}
            onPumpToggle={setIsPumpOn}
          />
        );
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return t.dashboard;
      case 'setup': return t.farmSetup;
      case 'budget': return t.waterBudget;
      case 'schedule': return t.irrigationSchedule;
      case 'analytics': return t.analytics;
      case 'ai': return t.aiAssistant;
      default: return t.dashboard;
    }
  };

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  const currentSensorData = sensorHistory.length > 0 ? sensorHistory[sensorHistory.length - 1] : null;
  let criticalMessage = null;
  if (currentSensorData) {
    if (currentSensorData.soilMoisture < 30) {
      criticalMessage = t.criticalLowMoisture || 'Critical: Soil moisture is too low!';
    } else if (currentSensorData.soilMoisture > 80) {
      criticalMessage = t.criticalHighMoisture || 'Critical: Soil moisture is too high!';
    }
  }

  const handleCriticalClick = () => {
    if (currentSensorData && currentSensorData.soilMoisture < 30) {
      setAiInitialPrompt('The soil moisture is critically low. What should I do to solve this immediately?');
    } else if (currentSensorData && currentSensorData.soilMoisture > 80) {
      setAiInitialPrompt('The soil moisture is critically high. What should I do to solve this immediately?');
    }
    setActiveTab('ai');
  };

  return (
    <div className="flex min-h-screen bg-[#fdfcfb] text-zinc-900 font-sans selection:bg-emerald-500/30 selection:text-emerald-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setUser(null)} language={language} />
      
      <main className="flex-1 flex flex-col min-w-0 relative">
        {isSyncing && (
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20 z-50">
            <div className="h-full bg-emerald-500 animate-[loading_2s_ease-in-out_infinite] w-1/3" />
          </div>
        )}
        <Header 
          title={getTitle()} 
          location={farmSettings.location} 
          user={user} 
          onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
          language={language}
          onLanguageChange={setLanguage}
        />
        
        <div className="flex-1 p-4 lg:p-8 overflow-y-auto pb-24 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            {criticalMessage && activeTab !== 'ai' && (
              <div 
                onClick={handleCriticalClick}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-4 cursor-pointer hover:bg-red-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-red-800 font-bold">{criticalMessage}</h4>
                  <p className="text-red-600 text-sm">Click here to ask the AI Assistant for a solution.</p>
                </div>
              </div>
            )}
            {renderContent()}
          </div>
        </div>

        <VoiceAssistant 
          isOpen={isVoiceAssistantOpen}
          onClose={() => setIsVoiceAssistantOpen(false)}
          farmSettings={farmSettings}
          sensorData={sensorHistory[sensorHistory.length - 1]}
          waterBudget={waterBudget!}
        />
      </main>
    </div>
  );
}
