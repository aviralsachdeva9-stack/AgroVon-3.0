// src/components/HardwareDebug.tsx

import React, { useState, useEffect } from 'react';
import { useHardwareData } from '../hooks/useHardwareData';

const HardwareDebug: React.FC = () => {
  const { sensorData, isConnected, lastUpdate, error, isLoading, refetch } = useHardwareData(3000);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    addLog(`Connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);
    if (sensorData) {
      addLog(`Data received: N=${sensorData.N}, P=${sensorData.P}, K=${sensorData.K}, moisture=${sensorData.moisture}, temp=${sensorData.temp}`);
    }
    if (error) {
      addLog(`Error: ${error}`);
    }
    if (isLoading) {
      addLog('Loading...');
    }
  }, [isConnected, sensorData, error, isLoading]);

  const handleManualTest = async () => {
    addLog('Manual test started...');
    try {
      const response = await fetch('http://192.168.4.1/data');
      addLog(`HTTP Status: ${response.status} ${response.statusText}`);
      const text = await response.text();
      addLog(`Raw response: ${text.substring(0, 200)}...`);
      
      if (response.ok) {
        const data = JSON.parse(text);
        addLog(`Parsed data: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      addLog(`Manual test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-4xl">
      <h3 className="text-lg font-bold mb-4">Hardware Debug Panel</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={`p-3 rounded ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <div className="font-semibold">Status</div>
          <div>{isConnected ? 'Connected' : 'Disconnected'}</div>
        </div>
        <div className={`p-3 rounded ${isLoading ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
          <div className="font-semibold">Loading</div>
          <div>{isLoading ? 'Yes' : 'No'}</div>
        </div>
      </div>

      {sensorData && (
        <div className="bg-blue-50 p-3 rounded mb-4">
          <div className="font-semibold text-blue-800 mb-2">Current Sensor Data:</div>
          <div className="text-sm">
            <div>N: {sensorData.N} kg/ha</div>
            <div>P: {sensorData.P} kg/ha</div>
            <div>K: {sensorData.K} kg/ha</div>
            <div>Moisture: {sensorData.moisture}%</div>
            <div>Temperature: {sensorData.temp}°C</div>
            {sensorData.humidity && <div>Humidity: {sensorData.humidity}%</div>}
          </div>
          <div className="text-xs text-gray-600 mt-2">
            Last update: {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-3 rounded mb-4">
          <div className="font-semibold text-red-800">Error:</div>
          <div className="text-sm">{error}</div>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={refetch}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
        >
          Refetch
        </button>
        <button
          onClick={handleManualTest}
          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
        >
          Manual Test
        </button>
        <button
          onClick={() => setLogs([])}
          className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
        >
          Clear Logs
        </button>
      </div>

      <div className="bg-gray-100 p-3 rounded">
        <div className="font-semibold mb-2">Debug Logs:</div>
        <div className="text-xs font-mono max-h-40 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="border-b border-gray-200 pb-1 mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HardwareDebug;
