import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Bell, RefreshCw, Tractor, FlaskConical, Droplets, Sprout, 
  Thermometer, TrendingUp, TrendingDown, MoveRight, Clock, MapPin, 
  Volume2, Plus, AlertTriangle, Wind, Camera
} from 'lucide-react';
import { ViewState, Crop, Activity as CropActivity, UserProfile } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { speakText } from '../services/grokService';
import { useHardwareData } from '../hooks/useHardwareData';

interface CropManagerViewProps {
  setView: (view: ViewState) => void;
  crops: Crop[];
  addCrop: (crop: Crop) => void;
  addActivity: (cropId: string, activity: CropActivity) => void;
  deleteCrop: (cropId: string) => void;
  language: string;
  userProfile?: UserProfile;
  isDarkMode?: boolean;
}

const CropManagerView: React.FC<CropManagerViewProps> = ({ setView, language, userProfile, isDarkMode = true }) => {
  const t = TRANSLATIONS[language]?.planner || TRANSLATIONS['en'].planner;
  
  const [playingId, setPlayingId] = useState<number | null>(null);

  // --- HARDWARE DATA HOOK ---
  const { sensorData: hardwareData, isConnected } = useHardwareData(5000);

  // Default Initial State (Simulation Fallback) matching AgroVON 2.0 specs
  const [sensorData, setSensorData] = useState({ 
    soilTemp: 24, moisture: 32, ambientTemp: 26, humidity: 65 
  });

  // Update sensor data when hardware data changes
  useEffect(() => {
    if (hardwareData) {
      setSensorData({
        soilTemp: hardwareData.soilTemp ?? hardwareData.temp ?? 24,
        moisture: hardwareData.moisture ?? 32,
        ambientTemp: hardwareData.ambientTemp ?? hardwareData.temp ?? 26,
        humidity: hardwareData.humidity ?? 65
      });
    }
  }, [hardwareData]);

  const handleSpeak = (text: string, id: number) => {
    if (playingId === id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    setPlayingId(id);
    speakText(text);
    setTimeout(() => { if (playingId === id) setPlayingId(null); }, 3000);
  };

  const farmName = userProfile?.name ? `${userProfile.name.split(' ')[0]}'s Farm` : 'My Farm';
  const location = userProfile?.district ? `${userProfile.district}, ${userProfile.state}` : 'Location not set';

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
    priorityHigh: isDarkMode ? 'bg-red-400/10 text-red-400 border-red-400/20' : 'bg-red-50 text-red-600 border-red-200',
    priorityMedium: isDarkMode ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' : 'bg-yellow-50 text-yellow-600 border-yellow-200',
    iconBg: isDarkMode ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-green-100 border-green-200 text-green-600'
  };

  const getParameterStatus = (value: number, type: string) => {
    switch(type) {
      case 'moisture':
        return value < 20 ? 'Dry' : value > 35 ? 'Wet' : 'Optimal';
      case 'temp':
        return value < 18 ? 'Cold' : value > 32 ? 'Hot' : 'Optimal';
      case 'humidity':
        return value < 40 ? 'Low' : value > 70 ? 'High' : 'Optimal';
      default:
        return 'Optimal';
    }
  };

  const getParameterTrend = (value: number, type: string) => {
    switch(type) {
      case 'moisture':
        return value < 20 ? 'down' : value > 35 ? 'down' : 'up';
      case 'temp':
        return value > 30 ? 'up' : value < 20 ? 'down' : 'flat';
      default:
        return 'flat';
    }
  };

  // Dynamic hardware parameters (AgroVON 2.0 sensors)
  const parameters = [
      { 
        id: 1, 
        name: 'Soil Temperature', 
        value: sensorData.soilTemp, 
        unit: '°C', 
        status: getParameterStatus(sensorData.soilTemp, 'temp'), 
        icon: Thermometer, 
        color: 'text-orange-400', 
        bg: 'bg-orange-500/20', 
        trend: getParameterTrend(sensorData.soilTemp, 'temp'), 
        gradient: 'from-orange-400/20 to-red-500/20' 
      },
      { 
        id: 2, 
        name: 'Soil Moisture', 
        value: sensorData.moisture, 
        unit: '%', 
        status: getParameterStatus(sensorData.moisture, 'moisture'), 
        icon: Droplets, 
        color: 'text-blue-400', 
        bg: 'bg-blue-500/20', 
        trend: getParameterTrend(sensorData.moisture, 'moisture'), 
        gradient: 'from-blue-400/20 to-cyan-500/20' 
      },
      { 
        id: 3, 
        name: 'Ambient Temp', 
        value: sensorData.ambientTemp, 
        unit: '°C', 
        status: getParameterStatus(sensorData.ambientTemp, 'temp'), 
        icon: Thermometer, 
        color: 'text-yellow-400', 
        bg: 'bg-yellow-500/20', 
        trend: getParameterTrend(sensorData.ambientTemp, 'temp'), 
        gradient: 'from-yellow-400/20 to-amber-500/20' 
      },
      { 
        id: 4, 
        name: 'Air Humidity', 
        value: sensorData.humidity, 
        unit: '%', 
        status: getParameterStatus(sensorData.humidity, 'humidity'), 
        icon: Wind, 
        color: 'text-teal-400', 
        bg: 'bg-teal-500/20', 
        trend: getParameterTrend(sensorData.humidity, 'humidity'), 
        gradient: 'from-teal-400/20 to-emerald-500/20' 
      }
  ];

  const generateRecommendations = () => {
    const recs = [];
    const moisture = sensorData.moisture;
    const ambientTemp = sensorData.ambientTemp;

    if (moisture < 20) {
      recs.push({
        id: 105,
        title: "Increase Irrigation Immediately",
        desc: `Soil moisture is critically low at ${moisture}%. Increase irrigation frequency to prevent crop stress and yield loss.`,
        priority: 'High',
        time: 'Today'
      });
    }

    if (ambientTemp > 35) {
      recs.push({
        id: 106,
        title: "High Heat Stress Warning",
        desc: `Ambient temperature has reached ${ambientTemp}°C. Ensure adequate watering and consider shading for sensitive crops.`,
        priority: 'Medium',
        time: 'Ongoing'
      });
    }

    if (recs.length === 0) {
      recs.push({
        id: 107,
        title: "Optimal Conditions",
        desc: "All monitored soil parameters and ambient weather conditions are within optimal ranges. Continue current farming practices.",
        priority: 'Low',
        time: 'Routine'
      });
    }
    return recs;
  };

  const recommendations = generateRecommendations();

  return (
    <div className={`flex flex-col min-h-screen ${themeClasses.background} ${themeClasses.text} animate-fade-in`}>
      
      {/* 1. Header & Location */}
      <div className={`${themeClasses.headerBg} p-5 pb-6 border-b ${themeClasses.headerBorder} shadow-sm rounded-b-3xl relative z-10`}>
        <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-3">
                <button onClick={() => setView(ViewState.HOME)} className={`p-2.5 rounded-full ${themeClasses.buttonBg} transition-colors`}>
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">{farmName}</h1>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <MapPin className={`w-3.5 h-3.5 ${themeClasses.subText}`} />
                        <span className={`text-xs ${themeClasses.subText} font-medium`}>{location}</span>
                    </div>
                </div>
            </div>
            <button className={`relative p-2.5 rounded-full ${themeClasses.buttonBg} transition-colors`}>
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#1a2e28]"></span>
            </button>
        </div>

        {/* Action Buttons Row */}
        <div className="flex gap-3">
            <button className={`flex-1 py-3 px-4 ${isDarkMode ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-600'} text-white rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg transition-transform hover:scale-105 active:scale-95`}>
                <Tractor className="w-5 h-5" /> Add Log
            </button>
            <button onClick={() => setView(ViewState.SOIL_ANALYSIS)} className={`flex-1 py-3 px-4 ${themeClasses.iconBg} rounded-2xl flex items-center justify-center gap-2 font-bold transition-transform hover:scale-105 active:scale-95`}>
                <FlaskConical className="w-5 h-5" /> Analyze
            </button>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* 2.5 AI Scanner Quick Access */}
        <div 
            onClick={() => setView(ViewState.SOIL_ANALYSIS)}
            className={`mt-2 ${themeClasses.cardBg} rounded-3xl p-5 shadow-lg ${themeClasses.cardBorder} border flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform`}
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center border border-green-500/30">
                    <Camera className="w-6 h-6 text-green-400" />
                </div>
                <div>
                    <h3 className={`text-base font-bold ${themeClasses.text}`}>Agro-Bozo AI Scanner</h3>
                    <p className={`text-xs ${themeClasses.subText}`}>Detect diseases with Edge AI</p>
                </div>
            </div>
            <MoveRight className="w-5 h-5 text-gray-400" />
        </div>

        {/* 3. Soil Parameters Grid - Enhanced */}
        <div className="mt-4">
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t.soilParams}</h3>
                    <p className={`text-xs ${themeClasses.subText} mt-1`}>Real-time sensor data from your farm</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                    <span className={`text-xs ${themeClasses.mutedText}`}>{isConnected ? 'LIVE' : 'SIMULATION'}</span>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                {parameters.map((param) => (
                    <div key={param.id} className={`relative overflow-hidden group ${themeClasses.cardBg} rounded-3xl shadow-lg ${themeClasses.cardBorder} border`}>
                        {/* Gradient Background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${param.gradient || 'from-gray-400/10 to-gray-600/10'} rounded-3xl`}></div>
                        
                        {/* Content */}
                        <div className="relative p-5 h-40 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className={`w-12 h-12 rounded-2xl ${param.bg} flex items-center justify-center ${param.color} shadow-lg`}>
                                    <param.icon className="w-6 h-6" />
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {param.trend === 'up' && <TrendingUp className={`w-4 h-4 ${param.color}`} />}
                                    {param.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
                                    {param.trend === 'flat' && <MoveRight className={`w-4 h-4 ${themeClasses.mutedText}`} />}
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${param.status === 'Optimal' ? 'bg-green-100 text-green-700 border border-green-200' : param.status === 'Low' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'} ${isDarkMode ? param.status === 'Optimal' ? 'bg-green-500/20 text-green-400 border-green-500/30' : param.status === 'Low' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : ''}`}>
                                        {param.status}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div>
                                    <span className={`text-xs ${themeClasses.subText} block mb-1`}>{param.name}</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-3xl font-bold ${themeClasses.text}`}>{param.value}</span>
                                        <span className={`text-sm ${themeClasses.mutedText}`}>{param.unit}</span>
                                    </div>
                                </div>
                                
                                {/* Progress Bar */}
                                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className={`h-full transition-all duration-700 ${
                                        param.status === 'Optimal' ? 'bg-green-500 w-3/4' : 
                                        param.status === 'Low' ? 'bg-red-500 w-1/4' : 
                                        'bg-yellow-500 w-1/2'
                                    }`}></div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Hover Effect */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>
                    </div>
                ))}
            </div>
        </div>

        {/* 4. Priority Recommendations */}
        <div>
            <div className="flex justify-between items-end mb-4">
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t.priorityRecs}</h3>
                <button onClick={() => setView(ViewState.SOIL_ANALYSIS)} className={`${isDarkMode ? 'text-green-400' : 'text-green-600'} text-sm font-semibold hover:underline`}>{t.viewAll}</button>
            </div>
            
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {recommendations.map((rec) => (
                    <div key={rec.id} className={`min-w-[280px] ${themeClasses.cardBg} rounded-2xl p-5 shadow-lg ${themeClasses.cardBorder} border relative border-l-4 border-l-green-500 flex flex-col`}>
                        <div className="flex justify-between items-start mb-3">
                             <span className={`${themeClasses.priorityHigh} px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 border`}>
                                 <AlertTriangle className="w-3 h-3" /> {rec.priority}
                             </span>
                             <span className={`${themeClasses.priorityMedium} px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 border`}>
                                 <Clock className="w-3 h-3" /> {rec.time}
                             </span>
                        </div>
                        
                        <h4 className={`font-bold ${themeClasses.text} text-base mb-2`}>{rec.title}</h4>
                        <p className={`text-sm ${themeClasses.subText} leading-relaxed mb-4 line-clamp-3`}>
                            {rec.desc}
                        </p>
                        
                        <div className="mt-auto flex gap-3">
                            <button 
                                onClick={() => handleSpeak(`${rec.title}. ${rec.desc}`, rec.id)}
                                className={`flex-1 py-2 rounded-xl border border-green-500 ${isDarkMode ? 'text-green-400' : 'text-green-600'} text-sm font-semibold flex items-center justify-center gap-2 hover:bg-green-500/10 transition-colors ${playingId === rec.id ? 'bg-green-500/20 animate-pulse' : ''}`}
                            >
                                <Volume2 className="w-4 h-4" /> {t.listen}
                            </button>
                            <button className={`flex-1 py-2 rounded-xl ${isDarkMode ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-600'} text-white text-sm font-bold transition-colors`}>
                                {t.viewDetails}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* 5. Floating Action Button */}
      <button className={`fixed bottom-24 right-5 w-14 h-14 ${isDarkMode ? 'bg-green-600 shadow-green-900/40' : 'bg-green-500 shadow-green-200/40'} text-white rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 transition-transform z-30 border ${isDarkMode ? 'border-green-500' : 'border-green-400'}`}>
          <Plus className="w-8 h-8" />
      </button>

    </div>
  );
};

export default CropManagerView;
