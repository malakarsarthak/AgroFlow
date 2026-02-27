import { GoogleGenAI, Type } from "@google/genai";
import { FarmSettings, SensorData, WaterBudget, Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Simple in-memory cache to prevent hitting rate limits too quickly
const envDataCache = new Map<string, { data: Partial<SensorData>, timestamp: number }>();
const scheduleCache = new Map<string, { data: any[], timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 15; // 15 minutes

export async function getLocationEnvironmentalData(location: string): Promise<Partial<SensorData>> {
  const now = Date.now();
  const cached = envDataCache.get(location);
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Find the current weather and environmental data for ${location}.
    I need:
    1. Current temperature in Celsius.
    2. Total rainfall in the last 24 hours in mm.
    3. Approximate groundwater level in meters below surface for this region (if specific data isn't available, provide a regional estimate).
    4. Current humidity percentage.
    
    Return the data in a structured format.
  `;

  const fallbackData = {
    temperature: 25,
    rainfall: 0,
    groundwaterLevel: 10,
    humidity: 50
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        // Removed googleSearch tool as it can cause Rpc/XHR errors in some environments
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            temperature: { type: Type.NUMBER },
            rainfall: { type: Type.NUMBER },
            groundwaterLevel: { type: Type.NUMBER },
            humidity: { type: Type.NUMBER },
          },
          required: ["temperature", "rainfall", "groundwaterLevel", "humidity"]
        }
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      envDataCache.set(location, { data, timestamp: now });
      return data;
    }
    throw new Error("No data returned from Gemini");
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    const isTransientError = 
      errorMessage.includes("429") || 
      errorMessage.includes("quota") || 
      errorMessage.includes("xhr error") || 
      errorMessage.includes("Rpc failed") ||
      error?.status === "RESOURCE_EXHAUSTED";

    if (isTransientError) {
      console.warn("Gemini API transient error or rate limit. Using fallback environmental data.");
    } else {
      console.error("Error fetching environmental data:", error);
    }
    return fallbackData;
  }
}

export async function getDynamicIrrigationSchedule(
  farmSettings: FarmSettings,
  sensorData: SensorData,
  waterBudget: WaterBudget
): Promise<any[]> {
  const cacheKey = `${farmSettings.location}-${farmSettings.crop}-${farmSettings.irrigationMethod}`;
  const now = Date.now();
  const cached = scheduleCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Generate a dynamic 24-hour irrigation schedule for a farm with the following details:
    - Location: ${farmSettings.location}
    - Crop: ${farmSettings.crop}
    - Irrigation Method: ${farmSettings.irrigationMethod}
    - Soil Moisture: ${sensorData.soilMoisture}%
    - Rainfall: ${sensorData.rainfall} mm
    - Water Balance: ${waterBudget.balance} m³
    - Groundwater Status: ${waterBudget.groundwaterStatus}
    
    The schedule should include 4-6 key actions throughout the day.
    Each action must have:
    1. time (e.g., "06:00 AM")
    2. action (e.g., "Pre-dawn Moisture Check")
    3. status ("Completed", "Pending", or "Scheduled")
    4. type ("check", "irrigate", "monitor", or "update")
    
    Return the schedule as a JSON array of objects.
  `;

  const fallbackSchedule = [
    { time: "06:00 AM", action: "Morning Moisture Check", status: "Completed", type: "check" },
    { time: "08:00 AM", action: "Start Irrigation Cycle", status: "Pending", type: "irrigate" },
    { time: "12:00 PM", action: "Midday System Monitor", status: "Scheduled", type: "monitor" },
    { time: "05:00 PM", action: "Evening Moisture Update", status: "Scheduled", type: "update" }
  ];

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              time: { type: Type.STRING },
              action: { type: Type.STRING },
              status: { type: Type.STRING, enum: ["Completed", "Pending", "Scheduled"] },
              type: { type: Type.STRING, enum: ["check", "irrigate", "monitor", "update"] }
            },
            required: ["time", "action", "status", "type"]
          }
        }
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      scheduleCache.set(cacheKey, { data, timestamp: now });
      return data;
    }
    return fallbackSchedule;
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    const isTransientError = 
      errorMessage.includes("429") || 
      errorMessage.includes("quota") || 
      errorMessage.includes("xhr error") || 
      errorMessage.includes("Rpc failed") ||
      error?.status === "RESOURCE_EXHAUSTED";

    if (isTransientError) {
      console.warn("Gemini API transient error or rate limit. Using fallback irrigation schedule.");
    } else {
      console.error("Error generating dynamic schedule:", error);
    }
    return fallbackSchedule;
  }
}

export async function getSmartIrrigationCommand(
  farmSettings: FarmSettings,
  sensorData: SensorData,
  waterBudget: WaterBudget
): Promise<string> {
  const model = "gemini-3-flash-preview";
  
    const prompt = `
    As AgroFlow AI, provide a specific, one-sentence smart irrigation command for the following situation:
    - Location: ${farmSettings.location}
    - Crop: ${farmSettings.crop}
    - Soil Moisture: ${sensorData.soilMoisture}%
    - Water Balance: ${waterBudget.balance} m³
    - Groundwater: ${sensorData.groundwaterLevel}m
    - Pumps: ${farmSettings.numberOfPumps} pumps at ${farmSettings.pumpFlowRate} m³/h each
    - Calculated Duration: ${waterBudget.pumpDuration?.toFixed(1)} hours
    
    If irrigation is needed, specify the duration and volume. If not, explain why.
    Keep it authoritative and technical.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    return response.text || "Continue monitoring soil moisture levels.";
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    const isTransientError = 
      errorMessage.includes("429") || 
      errorMessage.includes("quota") || 
      errorMessage.includes("xhr error") || 
      errorMessage.includes("Rpc failed") ||
      error?.status === "RESOURCE_EXHAUSTED";

    if (isTransientError) {
      console.warn("Gemini API transient error or rate limit. Using default smart command.");
    } else {
      console.error("Error getting smart command:", error);
    }
    return "System ready. Awaiting sensor stabilization.";
  }
}

export async function getAgroFlowAdvice(
  userMessage: string,
  history: Message[],
  farmSettings: FarmSettings,
  sensorData: SensorData,
  waterBudget: WaterBudget
) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are AgroFlow AI, a professional agricultural assistant for a smart irrigation system.
    Your goal is to help farmers optimize water usage, protect groundwater, and improve crop productivity.
    
    Current Farm Context:
    - Location: ${farmSettings.location}
    - Farm Size: ${farmSettings.farmSize} hectares
    - Crop: ${farmSettings.crop}
    - Irrigation Method: ${farmSettings.irrigationMethod}
    - Season: ${farmSettings.season}
    - Pumps: ${farmSettings.numberOfPumps} pumps at ${farmSettings.pumpFlowRate} m³/h each
    
    Current Sensor Data:
    - Soil Moisture: ${sensorData.soilMoisture}%
    - Rainfall: ${sensorData.rainfall} mm
    - Groundwater Level: ${sensorData.groundwaterLevel} m below surface
    - Temperature: ${sensorData.temperature}°C
    - Humidity: ${sensorData.humidity}%
    
    Current Water Budget:
    - Available Water: ${waterBudget.availableWater.toFixed(2)} m³
    - Crop Demand: ${waterBudget.cropDemand.toFixed(2)} m³
    - Water Balance: ${waterBudget.balance.toFixed(2)} m³
    - Groundwater Status: ${waterBudget.groundwaterStatus}
    - Recommendation: ${waterBudget.recommendation}
    
    Instructions:
    1. Be professional, helpful, and concise.
    2. Use the provided data to give specific advice.
    3. If the farmer asks "Should I irrigate?", refer to the current recommendation and balance.
    4. If the balance is negative, explain why and how much water is needed.
    5. Encourage water-saving practices if the groundwater status is "Critical".
    6. Keep responses friendly but data-driven.
  `;

  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));

  contents.push({
    role: "user",
    parts: [{ text: userMessage }]
  });

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    const isTransientError = 
      errorMessage.includes("429") || 
      errorMessage.includes("quota") || 
      errorMessage.includes("xhr error") || 
      errorMessage.includes("Rpc failed") ||
      error?.status === "RESOURCE_EXHAUSTED";

    if (isTransientError) {
      console.warn("Gemini API transient error or rate limit. Using fallback advice.");
      return "I'm currently experiencing high traffic and cannot process your request right now. Please try again in a few minutes.";
    }
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to my brain right now. Please try again later.";
  }
}
