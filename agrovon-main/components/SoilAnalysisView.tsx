import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, RefreshCw, AlertTriangle, CheckCircle, Clock,
  TrendingUp, Droplets, Thermometer, Wind, Activity,
  Camera, ScanLine, Zap, WifiOff, Server, Cpu,
} from 'lucide-react';
import { ViewState } from '../types';
import {
  analyzeSoilData, SoilAnalysis, SoilData,
  getSoilHealthColor, getSoilHealthIcon,
} from '../services/soilAnalysisService';

const PI_URL    = 'http://172.16.32.64:5000';
const ESP32_URL = 'http://172.16.32.64:5001';
const POLL_MS   = 6000;

interface SoilAnalysisViewProps {
  setView:      (view: ViewState) => void;
  isDarkMode?:  boolean;
  soilData?:    SoilData;
  userProfile?: any;
  language?:    string;
}

interface SensorTelemetry {
  soilTemp:    number | null;
  moisture:    number | null;
  ambientTemp: number | null;
  humidity:    number | null;
}

interface PredictionResult {
  rawString:  string;
  classId:    string;
  className:  string;
  confidence: number;
  isHealthy:  boolean;
  timestamp:  string;
}

const parsePredictionString = (raw: string): PredictionResult => {
  const confMatch  = raw.match(/\((\d+\.?\d*)%\)/);
  const confidence = confMatch ? parseFloat(confMatch[1]) : 0;
  const classMatch = raw.match(/[Cc]lass\s*(\d+)/);
  const classId    = classMatch ? classMatch[1] : '—';
  const className  = classMatch ? `Class ${classId}` : raw.replace(/\(.*\)/, '').trim();
  return { rawString: raw, classId, className, confidence, isHealthy: raw.toLowerCase().includes('healthy'), timestamp: new Date().toLocaleTimeString() };
};

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
  const [sensors,   setSensors]   = useState<SensorTelemetry>({ soilTemp: null, moisture: null, ambientTemp: null, humidity: null });
  const [hwOnline,  setHwOnline]  = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [sensorError, setSensorError] = useState<string | null>(null);
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null);
  const [scanning,    setScanning]    = useState(false);
  const [prediction,  setPrediction]  = useState<PredictionResult | null>(null);
  const [scanError,   setScanError]   = useState<string | null>(null);
  const [scanY,       setScanY]       = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanFrame    = useRef<number | null>(null);
  const PREVIEW_H    = 200;

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
      const res = await fetch(`${PI_URL}/sensors`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setSensors({ soilTemp: parseFloat(d.soilTemp) ?? null, moisture: parseFloat(d.moisture) ?? null, ambientTemp: parseFloat(d.ambientTemp) ?? null, humidity: parseFloat(d.humidity) ?? null });
      setHwOnline(true); setSensorError(null); setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) { setHwOnline(false); setSensorError(`Agro-Bozo offline — ${err.message}`); }
  }, []);

  useEffect(() => { fetchSensors(); const id = setInterval(fetchSensors, POLL_MS); return () => clearInterval(id); }, [fetchSensors]);

  const startScanAnim = () => { let y = 0; const tick = () => { y = (y + 2.5) % PREVIEW_H; setScanY(y); scanFrame.current = requestAnimationFrame(tick); }; scanFrame.current = requestAnimationFrame(tick); };
  const stopScanAnim  = () => { if (scanFrame.current) cancelAnimationFrame(scanFrame.current); setScanY(0); };

  const runScan = async (blob: Blob, localUrl: string) => {
    setPreviewUrl(localUrl); setPrediction(null); setScanError(null); setScanning(true); startScanAnim();
    try {
      const form = new FormData(); form.append('image', blob, 'leaf_scan.jpg');
      const res  = await fetch(`${PI_URL}/upload`, { method: 'POST', body: form, signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`Pi server HTTP ${res.status}`);
      const ct = res.headers.get('content-type') || '';
      let raw: string;
      if (ct.includes('application/json')) {
        const j = await res.json();
        raw = j.result ?? j.prediction ?? (j.className ? `${j.className} (${(j.confidence * 100).toFixed(2)}%)` : JSON.stringify(j));
      } else { raw = await res.text(); }
      setPrediction(parsePredictionString(raw.trim()));
    } catch (err: any) { setScanError(err.message || 'Could not reach Raspberry Pi server.'); }
    finally { stopScanAnim(); setScanning(false); }
  };

  const handleESP32Scan = async () => {
    if (scanning) return;
    setPreviewUrl(null); setScanError(null); setPrediction(null); setScanning(true); startScanAnim();
    try {
      const imgRes = await fetch(`${ESP32_URL}/capture`, { signal: AbortSignal.timeout(12000) });
      if (!imgRes.ok) throw new Error(`ESP32-CAM HTTP ${imgRes.status}`);
      const blob = await imgRes.blob(); const url = URL.createObjectURL(blob);
      stopScanAnim(); await runScan(blob, url);
    } catch (err: any) { stopScanAnim(); setScanning(false); setScanError(`ESP32-CAM unreachable — ${err.message}`); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    await runScan(file, URL.createObjectURL(file)); e.target.value = '';
  };

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
        <p className={T.subText}>Connecting to Agro-Bozo…</p>
        <p className="text-xs text-gray-600">Raspberry Pi 5 · 172.16.32.64:5000</p>
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

  const SensorCard = ({ v, low, high, max, icon, label, sub, unit, chipColor }: any) => {
    const s = getStatus(v, low, high);
    return (
      <div className={`flex items-center gap-4 p-4 ${T.innerCard} rounded-2xl border border-[#2d4a3e]`}>
        <div className={`w-12 h-12 rounded-xl ${chipColor} flex flex-col items-center justify-center gap-0.5 flex-shrink-0`}>
          {icon}
          <span className="text-[8px] text-white/40 font-bold">{sub}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1.5">
            <p className="text-xs font-semibold text-white/90">{label}</p>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${s.bg} ${s.color}`}>{s.label}</span>
          </div>
          <div className="flex items-end gap-1.5 mb-2">
            <span className={`text-4xl font-black leading-none ${s.color}`}>{v !== null ? v.toFixed(1) : '—'}</span>
            <span className="text-sm text-gray-500 mb-1">{unit}</span>
          </div>
          <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-1000" style={{ width: fillPct(v, max), backgroundColor: barClr(v, low, high) }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col min-h-screen ${T.bg} ${T.text} animate-fade-in pb-24`}>

      <div className={`flex justify-between items-center p-5 ${T.headerBg} border-b ${T.headerBorder} shadow-lg sticky top-0 z-10`}>
        <button onClick={() => setView(ViewState.HOME)} className={`p-2 ${T.btnBg} rounded-full`}><ArrowLeft className="w-5 h-5" /></button>
        <div className="flex flex-col items-center">
          <h1 className="text-lg font-extrabold tracking-tight">Soil & Crop Health</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${hwOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
            <span className={`text-[10px] font-bold tracking-wide ${hwOnline ? 'text-green-400' : 'text-gray-500'}`}>{hwOnline ? `AGRO-BOZO LIVE · ${lastUpdated}` : 'HARDWARE OFFLINE'}</span>
          </div>
        </div>
        <button onClick={() => { performAnalysis(); fetchSensors(); }} className={`p-2 ${T.btnBg} rounded-full`}><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="p-4 space-y-5">

        {/* SECTION 1 — SENSOR TELEMETRY */}
        <div className={`${T.cardBg} rounded-3xl p-5 ${T.cardBorder} border shadow-xl`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center"><Activity className="w-4 h-4 text-green-400" /></div>
              <div>
                <h2 className="font-bold text-sm">Live Sensor Telemetry</h2>
                <p className="text-[10px] text-gray-500">Agro-Bozo Node · polling every {POLL_MS / 1000}s</p>
              </div>
            </div>
            {!hwOnline && <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-500/10 px-2 py-1 rounded-full border border-gray-500/20"><WifiOff className="w-3 h-3" /><span>Offline</span></div>}
          </div>
          {sensorError && <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" /><p className="text-[11px] text-red-400">{sensorError}</p></div>}
          <div className="space-y-3">
            <SensorCard v={sensors.soilTemp}    low={15} high={32}  max={60}  icon={<Thermometer className="w-5 h-5 text-orange-400" />} label="Soil Temperature"   sub="DS18B20" unit="°C" chipColor="bg-orange-500/20" />
            <SensorCard v={sensors.moisture}    low={30} high={70}  max={100} icon={<Droplets className="w-5 h-5 text-blue-400" />}     label="Soil Moisture"      sub="MOIST."  unit="%" chipColor="bg-blue-500/20" />
            <SensorCard v={sensors.ambientTemp} low={15} high={35}  max={60}  icon={<Thermometer className="w-5 h-5 text-yellow-400" />} label="Ambient Temperature" sub="DHT"     unit="°C" chipColor="bg-yellow-500/20" />
            <SensorCard v={sensors.humidity}    low={40} high={80}  max={100} icon={<Wind className="w-5 h-5 text-teal-400" />}         label="Air Humidity"       sub="DHT"     unit="%" chipColor="bg-teal-500/20" />
          </div>
        </div>

        {/* SECTION 2 — AI SCANNER */}
        <div className={`${T.cardBg} rounded-3xl ${T.cardBorder} border shadow-xl overflow-hidden`}>
          <div className="px-5 pt-5 pb-4 border-b border-[#2d4a3e]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center"><Zap className="w-5 h-5 text-green-400" /></div>
                <div>
                  <h2 className="font-extrabold text-base tracking-tight">Agro-Bozo AI Scanner</h2>
                  <p className="text-[10px] text-gray-500">ESP32-CAM Vision Node · MobileNetV2 TFLite</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end"><Server className="w-3 h-3 text-green-500" /><span className="text-[9px] text-green-400 font-bold">PI 5 EDGE</span></div>
                <p className="text-[9px] text-gray-600">172.16.32.64:5000</p>
              </div>
            </div>
          </div>

          {/* Image preview */}
          <div className="mx-4 mt-4 relative rounded-2xl overflow-hidden border border-[#2d4a3e] bg-[#0a1810]" style={{ height: PREVIEW_H }}>
            {previewUrl
              ? <img src={previewUrl} alt="Crop scan" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center"><Camera className="w-7 h-7 text-green-600" /></div>
                  <div className="text-center px-8">
                    <p className="text-sm font-semibold text-gray-400">ESP32-CAM Preview</p>
                    <p className="text-[11px] text-gray-600 mt-1">{scanning ? 'Capturing frame from vision node…' : 'Tap "Scan Crop" to trigger the ESP32-CAM and run disease detection.'}</p>
                  </div>
                </div>
            }
            {scanning && (
              <>
                <div className="absolute inset-0 bg-black/35" />
                <div className="absolute left-0 right-0 pointer-events-none" style={{ top: scanY, height: 2, background: 'linear-gradient(90deg,transparent,#22c55e 20%,#4ade80 50%,#22c55e 80%,transparent)', boxShadow: '0 0 14px 4px rgba(74,222,128,0.55)' }} />
                {['top-3 left-3 border-t-2 border-l-2 rounded-tl','top-3 right-3 border-t-2 border-r-2 rounded-tr','bottom-3 left-3 border-b-2 border-l-2 rounded-bl','bottom-3 right-3 border-b-2 border-r-2 rounded-br'].map((c,i) => <div key={i} className={`absolute w-5 h-5 border-green-400 ${c}`} />)}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3.5 py-1.5 bg-black/75 rounded-full border border-green-500/40 backdrop-blur-sm">
                  <div className="flex gap-0.5">{[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
                  <span className="text-[11px] font-bold text-green-300">{previewUrl ? 'Running Inference · MobileNetV2' : 'Fetching Frame · ESP32-CAM'}</span>
                </div>
              </>
            )}
          </div>

          {/* Prediction result */}
          {prediction && !scanning && (
            <div className={`mx-4 mt-3 p-5 rounded-2xl border ${prediction.isHealthy ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><Cpu className="w-4 h-4 text-gray-500" /><span className="text-[10px] font-black uppercase tracking-widest text-gray-400">AI Inference Result</span></div>
                <span className="text-[9px] text-gray-600">{prediction.timestamp}</span>
              </div>

              {/* Raw result string — prominent display */}
              <div className={`px-4 py-3 rounded-xl mb-4 ${prediction.isHealthy ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
                <p className={`text-base font-black leading-tight ${prediction.isHealthy ? 'text-green-300' : 'text-red-300'}`}>{prediction.rawString}</p>
                <p className="text-[10px] text-gray-500 mt-1">Raw output · Raspberry Pi 5 Flask Server</p>
              </div>

              {/* Parsed class + confidence */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-black/30 rounded-xl p-3">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Class ID</p>
                  <p className={`text-3xl font-black ${prediction.isHealthy ? 'text-green-400' : 'text-red-400'}`}>{prediction.classId}</p>
                  <p className="text-[9px] text-gray-600">{prediction.className}</p>
                </div>
                <div className="bg-black/30 rounded-xl p-3">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Confidence</p>
                  <p className={`text-3xl font-black ${prediction.isHealthy ? 'text-green-400' : 'text-red-400'}`}>{prediction.confidence.toFixed(2)}%</p>
                  <p className="text-[9px] text-gray-600">Model certainty</p>
                </div>
              </div>

              {/* Confidence bar */}
              <div className="mb-3">
                <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${prediction.confidence}%`, backgroundColor: prediction.isHealthy ? '#22c55e' : '#ef4444', boxShadow: `0 0 8px ${prediction.isHealthy ? '#22c55e88' : '#ef444488'}` }} />
                </div>
              </div>

              {/* Status badge */}
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${prediction.isHealthy ? 'bg-green-500/10 border border-green-500/25' : 'bg-red-500/10 border border-red-500/25'}`}>
                {prediction.isHealthy ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                <p className={`text-xs font-semibold ${prediction.isHealthy ? 'text-green-300' : 'text-red-300'}`}>{prediction.isHealthy ? 'Crop appears healthy. Continue regular monitoring.' : `Disease detected with ${prediction.confidence.toFixed(1)}% confidence. Use the AI Chat for treatment advice.`}</p>
              </div>
            </div>
          )}

          {scanError && !scanning && (
            <div className="mx-4 mt-3 p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-400">Scan Failed</p>
                <p className="text-[11px] text-red-400/70 mt-0.5">{scanError}</p>
                <p className="text-[10px] text-gray-600 mt-1">Ensure ESP32-CAM and Raspberry Pi are on network 172.16.x.x</p>
              </div>
            </div>
          )}

          <div className="px-4 pt-3 pb-5 space-y-2.5">
            <button onClick={handleESP32Scan} disabled={scanning}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-extrabold text-sm tracking-wide transition-all ${scanning ? 'bg-green-800/40 text-green-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white active:scale-[0.98] shadow-lg shadow-green-500/25'}`}>
              {scanning ? <><div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /><span>{previewUrl ? 'Running Edge AI Inference…' : 'Capturing from ESP32-CAM…'}</span></> : <><ScanLine className="w-5 h-5" /><span>Scan Crop for Disease</span></>}
            </button>
            <button onClick={() => fileInputRef.current?.click()} disabled={scanning}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border transition-all ${scanning ? 'border-gray-700 text-gray-600 cursor-not-allowed' : `${T.cardBorder} border text-gray-400 hover:text-gray-200 active:scale-[0.98]`}`}>
              <Camera className="w-4 h-4" /><span>Upload Image (Test Mode)</span>
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        </div>

        {/* SECTION 3+ — AI RECOMMENDATIONS (unchanged) */}
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
                <ul className="space-y-1">{items.map((item, i) => <li key={i} className="text-sm flex items-start gap-2"><span className={`${color} mt-1`}>•</span><span>{item}</span></li>)}</ul>
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
