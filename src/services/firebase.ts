import { initializeApp, getApp, deleteApp } from 'firebase/app';
import { getDatabase, ref, onValue, off, Database } from 'firebase/database';
import { SensorData, FarmSettings, FirebaseStatus } from '../types';

let currentApp: any = null;
let currentDb: Database | null = null;

const initializeFirebase = async (settings: FarmSettings) => {
  const config = {
    apiKey: settings.firebaseApiKey || import.meta.env.VITE_FIREBASE_API_KEY,
    databaseURL: settings.firebaseUrl || import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  };

  if (!config.apiKey || !config.databaseURL) {
    return null;
  }

  try {
    if (currentApp) {
      await deleteApp(currentApp);
    }
    currentApp = initializeApp(config, 'AgroFlowDynamic');
    currentDb = getDatabase(currentApp);
    return currentDb;
  } catch (error) {
    console.error("Firebase dynamic initialization error", error);
    try {
      currentApp = getApp('AgroFlowDynamic');
      currentDb = getDatabase(currentApp);
      return currentDb;
    } catch (innerError) {
      return null;
    }
  }
};

export const subscribeToSensorData = (
  settings: FarmSettings,
  callback: (data: Partial<SensorData>) => void,
  onStatusChange?: (status: FirebaseStatus) => void
) => {
  let sensorRef: any = null;
  let listener: any = null;
  let connectedRef: any = null;
  let connectedListener: any = null;
  let active = true;

  const setup = async () => {
    onStatusChange?.('connecting');
    const db = await initializeFirebase(settings);
    if (!db || !active) {
      onStatusChange?.('idle');
      return;
    }

    // Monitor connection status
    connectedRef = ref(db, '.info/connected');
    connectedListener = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        onStatusChange?.('connected');
      } else {
        onStatusChange?.('disconnected');
      }
    });

    const dataPath = settings.firebasePath || 'soilMoisture';
    sensorRef = ref(db, dataPath);
    listener = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      console.log(`Firebase data received from ${dataPath}:`, data);
      
      if (data !== null && data !== undefined) {
        // Handle if data is a primitive (like just the moisture percentage)
        if (typeof data === 'number') {
          callback({ soilMoisture: data });
        } else if (typeof data === 'object') {
          callback(data);
        }
      }
    }, (error) => {
      console.error("Firebase read error:", error);
      onStatusChange?.('error');
    });
  };

  setup();

  return () => {
    active = false;
    if (sensorRef && listener) {
      off(sensorRef, 'value', listener);
    }
    if (connectedRef && connectedListener) {
      off(connectedRef, 'value', connectedListener);
    }
  };
};
