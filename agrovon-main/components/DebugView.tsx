// src/components/DebugView.tsx

import React from 'react';
import { ViewState } from '../types';
import HardwareDebug from './HardwareDebug';

interface DebugViewProps {
  setView: (view: ViewState) => void;
}

const DebugView: React.FC<DebugViewProps> = ({ setView }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Hardware Debug Panel</h1>
          <button
            onClick={() => setView(ViewState.HOME)}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back to Home
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HardwareDebug />
          
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Hardware Status</h2>
            <div className="space-y-2">
              <p><strong>Device URL:</strong> http://192.168.4.1/data</p>
              <p><strong>Environment:</strong> {import.meta.env.VITE_HARDWARE_URL || 'Not set'}</p>
              <p><strong>Status:</strong> <span className="text-yellow-600">Testing Required</span></p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Expected Data Format</h2>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`{
  "N": number,      // Nitrogen (kg/ha)
  "P": number,      // Phosphorus (kg/ha)  
  "K": number,      // Potassium (kg/ha)
  "moisture": number, // Soil moisture (%)
  "temp": number,   // Temperature (°C)
  "humidity": number // Optional humidity (%)
}`}
            </pre>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">Troubleshooting</h2>
            <div className="space-y-2 text-sm">
              <p>• Ensure device is powered on</p>
              <p>• Check network connectivity</p>
              <p>• Verify URL: http://192.168.4.1/data</p>
              <p>• Check browser console for errors</p>
              <p>• Test with curl: curl http://192.168.4.1/data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugView;
