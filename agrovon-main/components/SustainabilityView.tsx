import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Leaf, Droplets, Thermometer, 
  Wind, AlertTriangle, CheckCircle, Clock, Volume2, RefreshCw, MapPin 
} from 'lucide-react';
import { ViewState, Crop, UserProfile } from '../types';
import { analyzeSoil, speakText } from '../services/grokService';
// ✅ RESTORED: Import the hardware service
import { fetchSensorData } from '../services/espService'; 

interface SustainabilityViewProps {
  setView: (view: ViewState) => void;
  crops: Crop[];
  language: string;
  userProfile?: UserProfile;
  isDarkMode?: boolean;
}

const SustainabilityView: React.FC<SustainabilityViewProps> = ({ setView, language, userProfile, isDarkMode = true }) => {
  
  // Default State
  const [data, setData] = useState<any>({ N: 0, P: 0, K: 0, moisture: 0, temp: 0 });
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');

  const loadDataAndAnalyze = async () => {
    setLoading(true);
    
    try {
        // ✅ 1. FETCH REAL HARDWARE DATA
        const sensorData = await fetchSensorData();
        
        if (sensorData) {
            setData(sensorData);
            setConnectionStatus('connected');

            // ✅ 2. ASK AI BASED ON REAL DATA
            setAiLoading(true);
            const aiAdvice = await analyzeSoil(sensorData, language);
            const setRec = (v: string | any[]) => setRecommendations(Array.isArray(v) ? v : [{ title: 'AI Advice', description: v, severity: 'info', duration: 'now' }]);
            setRec(aiAdvice);
            setAiLoading(false);
        } else {
            console.warn("No data received from ESP32");
            setConnectionStatus('disconnected');
            // Optional: Keep old data or show zeros
        }
    } catch (error) {
        console.error("Hardware Fetch Error:", error);
        setConnectionStatus('disconnected');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadDataAndAnalyze();
    
    // Optional: Auto-refresh every 30 seconds
    const interval = setInterval(loadDataAndAnalyze, 30000);
    return () => clearInterval(interval);
  }, [language]);

  const getSeverityColor = (severity: string) => {
    if (isDarkMode) {
      switch (severity?.toLowerCase()) {
        case 'high': return 'text-red-400 bg-red-400/10 border-red-400/20';
        case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
        default: return 'text-green-400 bg-green-400/10 border-green-400/20';
      }
    } else {
      switch (severity?.toLowerCase()) {
        case 'high': return 'text-red-600 bg-red-50 border-red-200';
        case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        default: return 'text-green-600 bg-green-50 border-green-200';
      }
    }
  };

  // Theme classes
  const themeClasses = {
    background: isDarkMode ? 'bg-[#0d1f18]' : 'bg-gray-50',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    headerBg: isDarkMode ? 'bg-[#1a2e28]' : 'bg-white',
    headerBorder: isDarkMode ? 'border-[#2d4a3e]' : 'border-gray-200',
    cardBg: isDarkMode ? 'bg-[#1a2e28]' : 'bg-white',
    cardBorder: isDarkMode ? 'border-[#2d4a3e]' : 'border-gray-200',
    subText: isDarkMode ? 'text-gray-400' : 'text-gray-600',
    mutedText: isDarkMode ? 'text-gray-500' : 'text-gray-500',
    buttonBg: isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200',
    voiceButtonBg: isDarkMode ? 'bg-[#0d1f18] border-[#2d4a3e] hover:bg-[#1f3a30]' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
  };

  // Profile Data Logic
  const farmName = userProfile?.name ? `${userProfile.name.split(' ')[0]}'s Farm` : "My Farm";
  const locationText = userProfile?.district 
    ? `${userProfile.district}, ${userProfile.state || "India"}` 
    : "Location Syncing...";

  return (
    <div className={`flex flex-col min-h-screen ${themeClasses.background} ${themeClasses.text} animate-fade-in pb-24`}>
      
      {/* HEADER */}
      <div className={`flex justify-between items-center p-6 ${themeClasses.headerBg} ${themeClasses.headerBorder} border-b shadow-lg sticky top-0 z-10`}>
        <button onClick={() => setView(ViewState.HOME)} className={`p-2 rounded-full ${themeClasses.buttonBg}`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Soil Health Dashboard</h1>
        <button onClick={loadDataAndAnalyze} className={`p-2 rounded-full ${themeClasses.buttonBg} ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        
        {/* LOCATION & STATUS CARD */}
        <div className={`${themeClasses.cardBg} ${themeClasses.cardBorder} border p-4 rounded-2xl flex items-center justify-between`}>
           <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'} flex items-center justify-center ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                 <MapPin className="w-5 h-5" />
              </div>
              <div>
                 <h2 className={`font-bold text-sm capitalize ${themeClasses.text}`}>{farmName}</h2>
                 <p className={`text-xs ${themeClasses.subText}`}>{locationText}</p>
              </div>
           </div>
           <div className="text-right">
              {connectionStatus === 'connected' ? (
                <span className={`text-[10px] ${isDarkMode ? 'text-green-400 bg-green-400/10' : 'text-green-600 bg-green-100'} px-2 py-1 rounded-full border ${isDarkMode ? 'border-green-400/20' : 'border-green-200'} flex items-center gap-1`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-green-400' : 'bg-green-600'} animate-pulse`}></span> Sensor Active
                </span>
              ) : (
                <span className={`text-[10px] ${isDarkMode ? 'text-red-400 bg-red-400/10' : 'text-red-600 bg-red-100'} px-2 py-1 rounded-full border ${isDarkMode ? 'border-red-400/20' : 'border-red-200'} flex items-center gap-1`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isDarkMode ? 'bg-red-400' : 'bg-red-600'}`}></span> Disconnected
                </span>
              )}
              <p className={`text-[10px] ${themeClasses.mutedText} mt-1`}>
                  {loading ? "Syncing..." : "Updated"}
              </p>
           </div>
        </div>

        {/* REAL HARDWARE SENSOR GRID */}
        <div>
          <div className="flex items-center justify-between mb-4">
             <h2 className={`text-sm font-bold ${themeClasses.subText} uppercase tracking-wider`}>Live Soil Parameters</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Nitrogen */}
            <div className={`${themeClasses.cardBg} p-4 rounded-2xl ${themeClasses.cardBorder} border`}>
               <div className="flex items-center gap-2 mb-2 text-yellow-400">
                  <Leaf className="w-4 h-4" /> <span className="text-xs font-bold">Nitrogen</span>
               </div>
               <span className="text-2xl font-bold">{data.N ?? '--'}</span> <span className={`text-xs ${themeClasses.mutedText}`}>mg/kg</span>
            </div>

            {/* Phosphorus */}
            <div className={`${themeClasses.cardBg} p-4 rounded-2xl ${themeClasses.cardBorder} border`}>
               <div className="flex items-center gap-2 mb-2 text-green-400">
                  <Leaf className="w-4 h-4" /> <span className="text-xs font-bold">Phosphorus</span>
               </div>
               <span className="text-2xl font-bold">{data.P ?? '--'}</span> <span className={`text-xs ${themeClasses.mutedText}`}>mg/kg</span>
            </div>

            {/* Moisture */}
            <div className={`${themeClasses.cardBg} p-4 rounded-2xl ${themeClasses.cardBorder} border`}>
               <div className="flex items-center gap-2 mb-2 text-blue-400">
                  <Droplets className="w-4 h-4" /> <span className="text-xs font-bold">Moisture</span>
               </div>
               <span className="text-2xl font-bold">{data.moisture ?? '--'}</span> <span className={`text-xs ${themeClasses.mutedText}`}>%</span>
            </div>

            {/* Temperature */}
            <div className={`${themeClasses.cardBg} p-4 rounded-2xl ${themeClasses.cardBorder} border`}>
               <div className="flex items-center gap-2 mb-2 text-orange-400">
                  <Thermometer className="w-4 h-4" /> <span className="text-xs font-bold">Temp</span>
               </div>
               <span className="text-2xl font-bold">{data.temp ?? '--'}</span> <span className={`text-xs ${themeClasses.mutedText}`}>°C</span>
            </div>
          </div>
        </div>

        {/* AI RECOMMENDATIONS */}
        <div>
          <h2 className={`text-sm font-bold ${themeClasses.subText} uppercase tracking-wider mb-4`}>
             AI Agronomist Report
          </h2>

          {aiLoading ? (
            <div className="space-y-3">
               <div className={`h-32 ${themeClasses.cardBg} rounded-2xl animate-pulse ${themeClasses.cardBorder} border`}></div>
               <div className={`h-32 ${themeClasses.cardBg} rounded-2xl animate-pulse ${themeClasses.cardBorder} border`}></div>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.length > 0 ? recommendations.map((rec, idx) => (
                <div key={idx} className={`${themeClasses.cardBg} p-5 rounded-3xl ${themeClasses.cardBorder} border shadow-lg relative overflow-hidden`}>
                   <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border flex items-center gap-1 ${getSeverityColor(rec.severity)}`}>
                         <AlertTriangle className="w-3 h-3" /> {rec.severity?.toUpperCase() || 'INFO'}
                      </span>
                      <span className={`text-[10px] ${themeClasses.subText} flex items-center gap-1 ${isDarkMode ? 'bg-black/20' : 'bg-gray-100'} px-2 py-1 rounded-full`}>
                         <Clock className="w-3 h-3" /> {rec.duration || '24h'}
                      </span>
                   </div>

                   <h3 className={`text-lg font-bold ${themeClasses.text} mb-2`}>{rec.title}</h3>
                   <p className={`text-sm ${themeClasses.subText} leading-relaxed mb-4`}>
                      {rec.advice}
                   </p>

                   <div className="flex gap-3">
                      <button 
                        onClick={() => speakText(rec.advice)}
                        className={`p-2 rounded-xl ${themeClasses.voiceButtonBg} ${isDarkMode ? 'text-green-400' : 'text-green-600'} transition-colors`}
                      >
                         <Volume2 className="w-5 h-5" />
                      </button>
                      <button className={`flex-1 ${isDarkMode ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-600'} text-white font-bold text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2`}>
                         Apply Fix <CheckCircle className="w-4 h-4" />
                      </button>
                   </div>
                </div>
              )) : (
                <div className={`text-center ${themeClasses.subText} text-sm py-10`}>
                   {connectionStatus === 'connected' 
                     ? "Soil health is good. No issues found."
                     : "Connect sensors to see analysis."}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SustainabilityView;