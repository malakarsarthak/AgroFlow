import { FarmSettings, SensorData, WaterBudget, CropType, IrrigationMethod } from '../types';

// Constants for crop water requirements (m3 per hectare per day - simplified)
const CROP_WATER_NEED: Record<CropType, number> = {
  [CropType.WHEAT]: 40,
  [CropType.RICE]: 120,
  [CropType.MAIZE]: 60,
  [CropType.COTTON]: 80,
  [CropType.VEGETABLES]: 50,
  [CropType.FRUITS]: 70,
};

// Efficiency factors for irrigation methods
const IRRIGATION_EFFICIENCY: Record<IrrigationMethod, number> = {
  [IrrigationMethod.DRIP]: 0.9,
  [IrrigationMethod.SPRINKLER]: 0.75,
  [IrrigationMethod.FLOOD]: 0.5,
  [IrrigationMethod.SMART_DRIP]: 0.95,
};

export function calculateWaterBudget(settings: FarmSettings, sensor: SensorData): WaterBudget {
  const { farmSize, crop, irrigationMethod, numberOfPumps, pumpFlowRate } = settings;
  
  // 1. Calculate Crop Demand (m3)
  // Base demand * size / efficiency
  const baseDemand = CROP_WATER_NEED[crop] * farmSize;
  const efficiency = IRRIGATION_EFFICIENCY[irrigationMethod];
  const totalDemand = baseDemand / efficiency;

  // 2. Calculate Rainfall Contribution (m3)
  // 1mm rainfall on 1 hectare = 10 m3
  const rainfallM3 = sensor.rainfall * farmSize * 10;

  // 3. Available Water from Soil Moisture (simplified)
  // Assume 100% moisture means soil holds 500m3/ha of available water
  const soilWaterAvailable = (sensor.soilMoisture / 100) * 500 * farmSize;

  // 4. Groundwater Status
  let groundwaterStatus: 'Critical' | 'Stable' | 'Abundant' = 'Stable';
  if (sensor.groundwaterLevel > 50) groundwaterStatus = 'Critical';
  else if (sensor.groundwaterLevel < 15) groundwaterStatus = 'Abundant';

  // 5. Final Balance
  // Balance = (Soil Water + Rainfall) - Demand
  const balance = (soilWaterAvailable + rainfallM3) - totalDemand;

  // 6. Calculate Pump Duration (hours)
  // If balance is negative, we need to pump water
  let pumpDuration = 0;
  if (balance < 0) {
    const waterNeeded = Math.abs(balance);
    const totalFlowRate = numberOfPumps * pumpFlowRate;
    if (totalFlowRate > 0) {
      pumpDuration = waterNeeded / totalFlowRate;
    }
  }

  // 7. Recommendation
  let recommendation = '';
  if (sensor.soilMoisture < 30) {
    recommendation = `Urgent: Irrigate ${Math.abs(balance).toFixed(1)} m³ immediately. Run pumps for ${pumpDuration.toFixed(1)} hours.`;
  } else if (balance < 0) {
    recommendation = `Scheduled: Apply ${Math.abs(balance).toFixed(1)} m³ water today. Run pumps for ${pumpDuration.toFixed(1)} hours.`;
  } else if (sensor.rainfall > 10) {
    recommendation = 'No irrigation needed. Significant rainfall detected.';
  } else {
    recommendation = 'Soil moisture optimal. No irrigation required today.';
  }

  return {
    availableWater: soilWaterAvailable + rainfallM3,
    cropDemand: totalDemand,
    rainfallContribution: rainfallM3,
    groundwaterStatus,
    balance,
    recommendation,
    pumpDuration,
  };
}

export function generateMockSensorData(): SensorData[] {
  const data: SensorData[] = [];
  const now = new Date();
  
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    data.push({
      timestamp: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      soilMoisture: 45 + Math.random() * 20 - 10,
      rainfall: Math.random() > 0.8 ? Math.random() * 5 : 0,
      groundwaterLevel: 25 + Math.random() * 2,
      temperature: 28 + Math.random() * 10 - 5,
      humidity: 60 + Math.random() * 20 - 10,
    });
  }
  return data;
}
