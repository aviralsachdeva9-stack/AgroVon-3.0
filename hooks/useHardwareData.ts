// src/hooks/useHardwareData.ts

import { useState, useEffect, useCallback } from 'react';
import { fetchHardwareData, HardwareData } from '../services/hardwareServiceNew';

export const useHardwareData = (pollInterval: number = 5000) => {
  const [data, setData] = useState<HardwareData>({
    sensorData: null,
    status: {
      isConnected: false,
      lastUpdate: Date.now()
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await fetchHardwareData();
      setData(result);
    } catch (error) {
      console.error('Hardware fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, pollInterval);

    return () => clearInterval(interval);
  }, [fetchData, pollInterval]);

  return {
    sensorData: data.sensorData,
    isConnected: data.status.isConnected,
    lastUpdate: data.status.lastUpdate,
    error: data.status.error,
    isLoading,
    refetch: fetchData
  };
};
