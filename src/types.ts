export enum IrrigationMethod {
  DRIP = 'Drip Irrigation',
  SPRINKLER = 'Sprinkler Irrigation',
  FLOOD = 'Flood Irrigation',
  SMART_DRIP = 'Smart Drip (AI Controlled)',
}

export enum CropType {
  WHEAT = 'Wheat',
  RICE = 'Rice',
  MAIZE = 'Maize',
  COTTON = 'Cotton',
  VEGETABLES = 'Vegetables',
  FRUITS = 'Fruits',
}

export enum Season {
  KHARIF = 'Kharif (Monsoon)',
  RABI = 'Rabi (Winter)',
  ZAID = 'Zaid (Summer)',
}

export type FirebaseStatus = 'connected' | 'disconnected' | 'error' | 'connecting' | 'idle';

export interface FarmSettings {
  location: string;
  farmSize: number; // in hectares
  crop: CropType;
  irrigationMethod: IrrigationMethod;
  season: Season;
  numberOfPumps: number;
  pumpFlowRate: number; // m3 per hour per pump
  firebaseUrl?: string;
  firebaseApiKey?: string;
  firebasePath?: string;
}

export interface SensorData {
  timestamp: string;
  soilMoisture: number; // percentage
  rainfall: number; // mm
  groundwaterLevel: number; // meters below surface
  temperature: number; // celsius
  humidity: number; // percentage
}

export interface WaterBudget {
  availableWater: number; // m3
  cropDemand: number; // m3
  rainfallContribution: number; // m3
  groundwaterStatus: 'Critical' | 'Stable' | 'Abundant';
  balance: number; // m3
  recommendation: string;
  pumpDuration?: number; // hours
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  farmName?: string;
}

export interface IrrigationScheduleItem {
  time: string;
  action: string;
  status: 'Completed' | 'Pending' | 'Scheduled';
  type: 'check' | 'irrigate' | 'monitor' | 'update';
}
