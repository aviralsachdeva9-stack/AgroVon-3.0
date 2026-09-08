// src/services/espService.ts

const ESP_URL = import.meta.env.VITE_HARDWARE_URL || "http://192.168.4.1/data";

export interface SensorData {
  N: number;
  P: number;
  K: number;
  moisture: number;
  temp: number;
  humidity?: number; // Optional humidity sensor
}

export const fetchSensorData = async (): Promise<SensorData | null> => {
  try {
    // 2-second timeout so app doesn't freeze if ESP is off
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(ESP_URL, { 
      signal: controller.signal,
      method: 'GET'
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error("Connection Failed");
    
    return await response.json();
  } catch (error) {
    console.warn("ESP32 Offline/Unreachable");
    return null; 
  }
};
