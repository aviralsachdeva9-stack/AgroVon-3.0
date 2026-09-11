// src/services/hardwareService.ts

// Hardware device configuration (AgroVON 2.0 Raspberry Pi Edge Server)
const HARDWARE_URL = import.meta.env.VITE_HARDWARE_URL || "http://192.168.137.56:5000/api/farm-status";

export interface SensorData {
  soilTemp?: number;
  moisture?: number;
  ambientTemp?: number;
  humidity?: number;
  // Legacy fields for backward compatibility during transition
  N?: number;
  P?: number;
  K?: number;
  temp?: number;
}

export interface HardwareStatus {
  isConnected: boolean;
  lastUpdate: number;
  error?: string;
}

export interface HardwareData {
  sensorData: SensorData | null;
  status: HardwareStatus;
}

// Simple fetch from hardware device
export const fetchHardwareData = async (): Promise<HardwareData> => {
  const status: HardwareStatus = {
    isConnected: false,
    lastUpdate: Date.now()
  };

  try {
    console.log('🔌 Connecting to hardware:', HARDWARE_URL);
    
    // Fetch from hardware device with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(HARDWARE_URL, { 
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Hardware data received:', data);
    
    // Validate sensor data
    if (!isValidSensorData(data)) {
      throw new Error('Invalid sensor data format');
    }

    status.isConnected = true;
    
    return {
      sensorData: data,
      status
    };

  } catch (error) {
    status.error = error instanceof Error ? error.message : 'Unknown error';
    console.warn('❌ Hardware device offline:', status.error);
    
    return {
      sensorData: null,
      status
    };
  }
};

// Validate sensor data format (lenient for transition)
const isValidSensorData = (data: any): data is SensorData => {
  return (
    data && typeof data === 'object'
  );
};

// Test hardware connection
export const testHardwareConnection = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing hardware connection...');
    const result = await fetchHardwareData();
    console.log('🧪 Hardware test result:', result.status.isConnected);
    return result.status.isConnected;
  } catch (error) {
    console.error('🧪 Hardware test failed:', error);
    return false;
  }
};

// Get hardware device info
export const getHardwareInfo = () => {
  return {
    url: HARDWARE_URL,
    name: 'Agricultural Sensor Device',
    supportedSensors: ['Soil Temperature', 'Soil Moisture', 'Ambient Temperature', 'Air Humidity'],
    dataFormat: 'JSON'
  };
};
