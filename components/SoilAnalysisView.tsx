import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, Clock,
  TrendingUp, Droplets, Thermometer, Wind, Activity,
  Camera, ScanLine, Zap, WifiOff, Server, Cpu, CloudRain, Plug,
} from 'lucide-react';
import { ViewState } from '../types';
import {
  analyzeSoilData, SoilAnalysis, SoilData,
  getSoilHealthColor, getSoilHealthIcon,
} from '../services/soilAnalysisService';

const PI_URL    = 'http://192.168.137.56:5000';
const ESP32_URL = 'http://172.16.32.64:5001';
const POLL_MS   = 6000;

interface SoilAnalysisViewProps {
  setView:      (view: ViewState) => void;
  isDarkMode?:  boolean;
  soilData?:    SoilData;
  userProfile?: any;
  language?:    string;
}

const getStatus = (v: number | null, low: number, high: number) => {
  if (v === null) return { label: 'NO DATA', color: 'text-gray-500', bg: 'bg-gray-500/15 border-gray-500/25' };
  if (v < low)   return { label: 'LOW',     color: 'text-red-400',   bg: 'bg-red-500/15 border-red-500/25' };
  if (v > high)  return { label: 'HIGH',    color: 'text-yellow-400',bg: 'bg-yellow-500/15 border-yellow-500/25' };
  return               { label: 'OPTIMAL',  color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/25' };
};
const fillPct = (v: number | null, max: number) => v !== null ? `${Math.min(100, Math.max(2, (v / max) * 100)).toFixed(1)}%` : '2%';
const barClr  = (v: number | null, low: number, high: number) => { if (!v) return '#4b5563'; if (v < low) return '#ef4444'; if (v > high) return '#f59e0b'; return '#22c55e'; };

const SoilAnalysisView: React.FC<SoilAnalysisViewProps> = ({ setView, isDarkMode = true, soilData, userProfile, language = 'en' }) => {
  const [analysis,  setAnalysis]  = useState<SoilAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiError,   setAiError]   = useState<string | null>(null);
  const [farmData, setFarmData] = useState<any>({ 
    status: "Safe",
    temperature: 0,
    moisture: 0,
    rain_val: "No Rain"
  });
  const [hwOnline,  setHwOnline]  = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const defaultSoilData: SoilData = soilData || { N: 45, P: 32, K: 180, moisture: 24, temp: 27, pH: 6.8, organicMatter: 2.1 };

  const T = {
    bg: isDarkMode ? 'bg-[#0d1f18]' : 'bg-gray-50',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    headerBg: isDarkMode ? 'bg-[#1a2e28]' : 'bg-white',
    headerBorder: isDarkMode ? 'border-[#2d4a3e]' : 'border-gray-200',
    cardBg: isDarkMode ? 'bg-[#1a2e28]' : 'bg-white',
    cardBorder: isDarkMode ? 'border-[#2d4a3e]' : 'border-gray-200',
    subText: isDarkMode ? 'text-gray-400' : 'text-gray-600',
    btnBg: isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200',
    successBg: isDarkMode ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-600 border-green-200',
    innerCard: isDarkMode ? 'bg-black/30' : 'bg-gray-100',
  };

  const performAnalysis = useCallback(async () => {
    setAiLoading(true); setAiError(null);
    try { setAnalysis(await analyzeSoilData(defaultSoilData, userProfile, language)); }
    catch { setAiError('Failed to analyze soil data. Please try again.'); }
    finally { setAiLoading(false); }
  }, [soilData, userProfile, language]);

  useEffect(() => { performAnalysis(); }, [soilData]);
  const fetchSensors = useCallback(async () => {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${PI_URL}/api/farm-status`, { signal: controller.signal });
      clearTimeout(id);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setFarmData(d);
      setHwOnline(true);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      setHwOnline(false);
    }
  }, []);

  useEffect(() => { fetchSensors(); const id = setInterval(fetchSensors, POLL_MS); return () => clearInterval(id); }, [fetchSensors]);

  if (aiLoading) return (
    <div className={`flex flex-col min-h-screen ${T.bg} ${T.text} animate-fade-in pb-24`}>
      <div className={`flex justify-between items-center p-6 ${T.headerBg} border-b ${T.headerBorder} shadow-lg sticky top-0 z-10`}>
        <button onClick={() => setView(ViewState.HOME)} className={`p-2 ${T.btnBg} rounded-full`}><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-bold">Soil & Crop Health</h1>
        <div className="w-9 h-9" />
      </div>
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center animate-pulse"><Server className="w-7 h-7 text-green-400" /></div>
        <div className="animate-spin w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full" />
        <p className={T.subText}>Connecting to Agro-Bozo�</p>
        <p className="text-xs text-gray-600">Raspberry Pi 5 � 172.16.32.64:5000</p>
      </div>
    </div>
  );

  if (aiError) return (
    <div className={`flex flex-col min-h-screen ${T.bg} ${T.text} animate-fade-in pb-24`}>
      <div className={`flex justify-between items-center p-6 ${T.headerBg} border-b ${T.headerBorder} shadow-lg sticky top-0 z-10`}>
        <button onClick={() => setView(ViewState.HOME)} className={`p-2 ${T.btnBg} rounded-full`}><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-xl font-bold">Soil & Crop Health</h1>
        <button onClick={performAnalysis} className={`p-2 ${T.btnBg} rounded-full`}><RefreshCw className="w-5 h-5" /></button>
      </div>
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <p className="text-red-400 font-medium">{aiError}</p>
        <button onClick={performAnalysis} className="px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-bold">Retry</button>
      </div>
    </div>
  );

  if (!analysis) return null;

  return (
    <div className={`flex flex-col min-h-screen ${T.bg} ${T.text} animate-fade-in pb-24`}>

      <div className={`flex justify-between items-center p-5 ${T.headerBg} border-b ${T.headerBorder} shadow-lg sticky top-0 z-10`}>
        <button onClick={() => setView(ViewState.HOME)} className={`p-2 ${T.btnBg} rounded-full`}><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-extrabold tracking-tight">Soil & Crop Health</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${hwOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
            <span className={`text-[10px] font-bold tracking-wide ${hwOnline ? 'text-green-400' : 'text-gray-500'}`}>{hwOnline ? `AGRO-BOZO LIVE • ${lastUpdated}` : 'HARDWARE OFFLINE'}</span>
          </div>
        </div>
        <button onClick={() => { performAnalysis(); fetchSensors(); }} className={`p-2 ${T.btnBg} rounded-full`}><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="p-4 space-y-5">
        {/* 🔴 LIVE AI VIDEO STREAM */}
        <div className="w-full h-[260px] rounded-2xl overflow-hidden border-4 border-green-500 shadow-lg relative bg-black flex items-center justify-center">
          <img 
            src="http://192.168.137.56:5000/video_feed" 
            alt="YOLOv8 Live Stream"
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            onLoad={(e) => { e.currentTarget.style.display = 'block'; }}
          />
          <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md animate-pulse flex items-center gap-1.5 shadow-md">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div> YOLOv8 LIVE
          </div>
        </div>

        {/* 🚨 DISASTER ALERT CARD */}
        <div className={`p-4 rounded-xl shadow-sm border ${(farmData.status ?? farmData.disaster_alert) !== "Safe" ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30' : 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Disaster Status</span>
            <span className={`text-lg font-black ${(farmData.status ?? farmData.disaster_alert) !== "Safe" ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{(farmData.status ?? farmData.disaster_alert) === "Safe" ? "✅ Safe" : "🚨 " + (farmData.status ?? farmData.disaster_alert)}</span>
          </div>
        </div>

        {/* 📡 SENSOR ZONE DATA */}
        <div className={`${T.cardBg} p-4 rounded-2xl ${T.cardBorder} border shadow-xl relative overflow-hidden group`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center"><Cpu className="w-4 h-4 text-green-400" /></div>
            <div>
              <h2 className="font-bold text-sm">Zone 1 (Master Node)</h2>
              <p className="text-[10px] text-gray-500">Live Telemetry  polling every 2s</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-orange-50 dark:bg-orange-500/10 p-3 rounded-xl border border-orange-100 dark:border-orange-500/20">
              <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Temp</span>
              <span className="text-2xl font-black text-orange-500">{farmData.temperature ?? farmData.temp ?? 0}°C</span>
            </div>
            <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-xl border border-blue-100 dark:border-blue-500/20">
              <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Moisture</span>
              <span className="text-2xl font-black text-blue-500">{farmData.moisture ?? farmData.moist ?? 0}%</span>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-500/10 p-3 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
              <span className="block text-xs text-gray-500 uppercase font-bold mb-1">Rain</span>
              <span className="text-sm font-black text-indigo-500 flex items-center justify-center h-full pb-1">{farmData.rain_val ?? farmData.rain ?? "No Rain"}</span>
            </div>
          </div>
        </div>

        {/* SECTION 3+ - AI RECOMMENDATIONS (unchanged) */}
        <div className={`${T.cardBg} rounded-2xl p-4 ${T.cardBorder} border shadow-sm`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Overall Soil Health</h2>
            <span className={`text-2xl px-3 py-1 rounded-full border ${getSoilHealthColor(analysis.overallHealth)}`}>{getSoilHealthIcon(analysis.overallHealth)} {analysis.overallHealth}</span>
          </div>
          <p className={`${T.subText} text-sm`}>
            {analysis.overallHealth === 'Excellent' && 'Your soil is in optimal condition for most crops. Keep up the good work!'}
            {analysis.overallHealth === 'Good'      && 'Your soil is healthy with room for improvement. Follow recommendations for best results.'}
            {analysis.overallHealth === 'Fair'      && 'Your soil needs attention. Implement the recommendations below for better crop yields.'}
            {analysis.overallHealth === 'Poor'      && 'Your soil requires immediate intervention. Follow the urgent recommendations carefully.'}
          </p>
        </div>

        <div className={`${T.cardBg} rounded-2xl p-4 ${T.cardBorder} border shadow-sm`}>
          <h2 className="font-semibold text-lg mb-4">Recommendations</h2>
          <div className="space-y-4">
            {[
              { icon: <AlertTriangle className="w-4 h-4 text-red-500" />,    label: 'Immediate Actions',    color: 'text-red-500',    items: analysis.recommendations.immediate },
              { icon: <Clock className="w-4 h-4 text-yellow-500" />,         label: 'Short Term (2-4 wks)', color: 'text-yellow-500', items: analysis.recommendations.shortTerm },
              { icon: <TrendingUp className="w-4 h-4 text-green-500" />,     label: 'Long Term',            color: 'text-green-500',  items: analysis.recommendations.longTerm },
            ].map(({ icon, label, color, items }) => (
              <div key={label}>
                <div className="flex items-center gap-2 mb-2">{icon}<h3 className={`font-medium ${color}`}>{label}</h3></div>
                <ul className="space-y-1">{items.map((item, i) => <li key={i} className="text-sm flex items-start gap-2"><span className={`${color} mt-1`}>�</span><span>{item}</span></li>)}</ul>
              </div>
            ))}
          </div>
        </div>

        <div className={`${T.cardBg} rounded-2xl p-4 ${T.cardBorder} border shadow-sm`}>
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><Droplets className="w-5 h-5 text-blue-500" />Irrigation Advice</h2>
          <p className="text-sm">{analysis.irrigationAdvice}</p>
        </div>

        <div className={`${T.cardBg} rounded-2xl p-4 ${T.cardBorder} border shadow-sm`}>
          <h2 className="font-semibold text-lg mb-4">Recommended Crops</h2>
          <div className="flex flex-wrap gap-2">{analysis.cropSuggestions.map((c, i) => <span key={i} className={`px-3 py-1 rounded-full text-sm ${T.successBg} border`}>{c}</span>)}</div>
        </div>

        {analysis.warnings.length > 0 && (
          <div className={`${T.cardBg} rounded-2xl p-4 ${T.cardBorder} border shadow-sm`}>
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-500" />Important Warnings</h2>
            <ul className="space-y-2">{analysis.warnings.map((w, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-yellow-500 mt-1">??</span><span>{w}</span></li>)}</ul>
          </div>
        )}

        <div className={`${T.cardBg} rounded-2xl p-4 ${T.cardBorder} border shadow-sm`}>
          <h2 className="font-semibold text-lg mb-4">Next Steps</h2>
          <div className="space-y-2">{analysis.nextSteps.map((step, i) => <div key={i} className="flex items-start gap-3 p-2"><span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span><span className="text-sm">{step}</span></div>)}</div>
        </div>

      </div>
    </div>
  );
};

export default SoilAnalysisView;
