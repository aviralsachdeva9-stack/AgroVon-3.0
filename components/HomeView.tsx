import React, { useState, useEffect } from 'react';
import { 
  Search, Sun, Moon, CloudRain, Wind, ArrowRight, PlayCircle, Sprout, 
  Thermometer, Leaf, FlaskConical, ChevronRight, ShieldCheck, Globe, 
  ChevronDown, User, MapPin, Cloud, History, Droplets, Eye 
} from 'lucide-react';
import { ViewState, Product, UserProfile } from '../types';
import { TRANSLATIONS } from '../utils/translations';
import { fetchLiveNews, NewsItem } from '../services/newsService';
import { fetchWeather, fetchForecast, getWeatherIcon, WeatherData, ForecastDay } from '../services/weatherService';
import { useHardwareData } from '../hooks/useHardwareData';

interface HomeViewProps {
  setView: (view: ViewState) => void;
  selectProduct: (product: Product) => void;
  userProfile?: UserProfile;
  isDarkMode: boolean;
  toggleTheme: () => void;
  language: string;
  setLanguage: (lang: string) => void;
  soilData?: { N: number; P: number; K: number; moisture: number; temp: number };
  setSoilData?: (data: { N: number; P: number; K: number; moisture: number; temp: number }) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ 
  setView, selectProduct, userProfile, isDarkMode, toggleTheme, language, setLanguage, soilData: propSoilData, setSoilData: propSetSoilData 
}) => {
  const t = TRANSLATIONS[language]?.home || TRANSLATIONS['en'].home;
  const t_planner = TRANSLATIONS[language]?.planner || TRANSLATIONS['en'].planner;
  const t_market = TRANSLATIONS[language]?.market || TRANSLATIONS['en'].market;
  const schemesList = TRANSLATIONS[language]?.schemes || TRANSLATIONS['en'].schemes;

  // --- STATE ---
  const [soilData, setSoilData] = useState(propSoilData || { N: 45, P: 32, K: 180, moisture: 24, temp: 27 });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [avatar, setAvatar] = useState<string | null>(() => localStorage.getItem('agriSmart_avatar'));
  const [locationName, setLocationName] = useState("Noida"); 
  const [mandiData, setMandiData] = useState<any>(null);
  const [liveNews, setLiveNews] = useState<NewsItem[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  // --- HARDWARE DATA HOOK ---
  const { sensorData, isConnected, lastUpdate, error, isLoading } = useHardwareData(5000);

  // Update soil data when hardware data changes
  useEffect(() => {
    if (sensorData) {
      const newData = {
        N: sensorData.N,
        P: sensorData.P,
        K: sensorData.K,
        moisture: sensorData.moisture,
        temp: sensorData.temp
      };
      setSoilData(newData);

      // Sync with parent component if available
      if (propSetSoilData) {
        propSetSoilData(newData);
      }
    }
  }, [sensorData, propSetSoilData]);

  // Log hardware status for debugging
  useEffect(() => {
    console.log('🔌 Hardware Status:', { isConnected, lastUpdate, error, isLoading });
  }, [isConnected, lastUpdate, error, isLoading]);

  // Weather Data Loading
  useEffect(() => {
    const loadWeatherData = async () => {
      setWeatherLoading(true);
      try {
        const [weatherData, forecastData] = await Promise.all([
          fetchWeather(locationName),
          fetchForecast(locationName)
        ]);
        
        if (weatherData) {
          setCurrentWeather(weatherData);
          setLocationName(weatherData.location);
        }
        
        if (forecastData.length > 0) {
          setForecast(forecastData);
        }
      } catch (error) {
        console.error("Weather loading error:", error);
      } finally {
        setWeatherLoading(false);
      }
    };

    loadWeatherData();
  }, [locationName]);

  // Mock Mandi Data (Keep existing)
  useEffect(() => {
    setMandiData({ bestPrice: 2150, bestMandiName: "Dadri Mandi", percentHigher: 12 });
  }, []);

  // Live News Loading
  useEffect(() => {
    const loadNews = async () => {
      try {
        const newsData = await fetchLiveNews(language);
        setLiveNews(newsData);
      } catch (error) {
        console.error("News loading error:", error);
      }
    };

    loadNews();
  }, [language]);

  // Update current date
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // --- HELPERS ---
  const getLocale = () => (language === 'pb' ? 'pa-IN' : language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-GB');
  const formatDate = (date: Date) => date.toLocaleDateString(getLocale(), { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
  const formatTime = (date: Date) => date.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });
  const getDayName = (date: Date) => date.toLocaleDateString(getLocale(), { weekday: 'short' });
  
  const getWeatherIconComponent = (iconCode: string, condition: string, size: string = "w-6 h-6") => {
    const iconName = getWeatherIcon(iconCode, condition);
    const iconProps: any = { className: `${size} text-yellow-500` };
    
    switch (iconName) {
      case 'Sun': return <Sun {...iconProps} />;
      case 'Moon': return <Moon {...iconProps} />;
      case 'CloudRain': return <CloudRain {...iconProps} className={`${size} text-blue-500`} />;
      case 'Wind': return <Wind {...iconProps} className={`${size} text-gray-500`} />;
      default: return <Cloud {...iconProps} className={`${size} text-gray-400`} />;
    }
  };

  const NEWS_FALLBACKS = [
    "https://images.unsplash.com/photo-1625246333195-551e11fb696d?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=400&q=80"
  ];

  return (
    // Fixed Dimensions
    <div 
      className="p-6 pb-24 space-y-6 animate-fade-in bg-gray-50 dark:bg-[#0d1f18] text-gray-900 dark:text-white transition-colors duration-300 shadow-2xl mx-auto my-auto border border-gray-200 dark:border-gray-800 rounded-[30px] overflow-hidden overflow-y-auto scrollbar-hide"
      style={{ width: '448px', height: '785px' }}
    >
      
      {/* HEADER */}
      <div>
        <div className="flex justify-between items-center mb-4">
            <div className="relative">
                <button onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} className="flex items-center gap-2 bg-white dark:bg-[#1a2e28] border border-gray-200 dark:border-[#2d4a3e] px-3 py-1.5 rounded-full text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2d4a3e] transition-colors">
                  <Globe className="w-3 h-3" />
                  {language === 'en' ? 'English' : language === 'hi' ? 'हिंदी' : language === 'pb' ? 'ਪੰਜਾਬੀ' : 'తెలుగు'}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {isLangMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-32 bg-white dark:bg-[#1a2e28] border border-gray-200 dark:border-[#2d4a3e] rounded-xl shadow-xl overflow-hidden z-50">
                    {['en', 'hi', 'pb', 'te'].map((lang) => (
                      <button key={lang} onClick={() => { setLanguage(lang); setIsLangMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#2d4a3e] text-xs text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-[#2d4a3e] last:border-0">
                        {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : lang === 'pb' ? 'ਪੰਜਾਬੀ' : 'తెలుగు'}
                      </button>
                    ))}
                  </div>
                )}
            </div>
            <div className="flex gap-2">
                <button onClick={() => setView(ViewState.DEBUG)} className="p-2 rounded-full bg-orange-500 dark:bg-orange-600 border border-orange-200 dark:border-orange-400 text-white hover:bg-orange-600 dark:hover:bg-orange-700 transition-colors shadow-sm">
                  🔧
                </button>
                <button onClick={toggleTheme} className="p-2 rounded-full bg-white dark:bg-[#1a2e28] border border-gray-200 dark:border-[#2d4a3e] text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2d4a3e] transition-colors shadow-sm">
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
            </div>
        </div>

        <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{t.hello}, <span className="text-green-600 dark:text-green-400 uppercase">{userProfile?.name?.split(' ')[0] || 'KISAN'}</span></h1>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 flex gap-2 items-center font-medium"><span>{formatDate(currentDate)}</span><span className="w-1 h-1 rounded-full bg-gray-400"></span><span className="font-mono text-green-600 dark:text-green-400">{formatTime(currentDate)}</span></p>
            </div>
            <div onClick={() => setView(ViewState.PROFILE)} className="w-12 h-12 rounded-full bg-white dark:bg-[#1a2e28] border-2 border-gray-200 dark:border-[#2d4a3e] p-0.5 shadow-sm cursor-pointer hover:border-green-500 transition-colors flex items-center justify-center overflow-hidden">
               {avatar ? <img src={avatar} alt="Profile" className="w-full h-full rounded-full object-cover" /> : <div className="w-full h-full rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center"><User className="w-6 h-6 text-green-600 dark:text-green-400" /></div>}
            </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
        <input type="text" placeholder={t.askPlaceholder || t.searchPlaceholder} className="w-full bg-white dark:bg-[#1a2e28] border border-gray-200 dark:border-[#2d4a3e] rounded-2xl py-3 pl-12 pr-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-green-500 shadow-sm" onFocus={() => setView(ViewState.AI_CHAT)} />
        <div className="absolute right-2 top-2 p-1.5 bg-green-600 text-white rounded-xl"><ArrowRight className="w-4 h-4" /></div>
      </div>

      {/* WEATHER */}
      <div className="bg-white dark:bg-[#1a2e28] rounded-3xl p-5 shadow-lg border border-gray-100 dark:border-[#2d4a3e] relative overflow-hidden">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 mb-1">
              <MapPin className="w-3 h-3" />
              <span className="text-xs font-bold tracking-wider uppercase">{locationName}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-5xl font-bold tracking-tighter text-gray-900 dark:text-white">
                {weatherLoading ? '--' : currentWeather?.temp || '--'}°
              </h2>
              <span className="text-lg text-gray-500 dark:text-gray-400 font-medium">
                {weatherLoading ? 'Loading...' : currentWeather?.description || 'Loading...'}
              </span>
            </div>
            {currentWeather && (
              <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3 h-3" />
                  {currentWeather.humidity}%
                </span>
                <span className="flex items-center gap-1">
                  <Wind className="w-3 h-3" />
                  {currentWeather.windSpeed} m/s
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Feels {currentWeather.feelsLike}°
                </span>
              </div>
            )}
          </div>
          {weatherLoading ? (
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-green-500 rounded-full"></div>
          ) : (
            getWeatherIconComponent(currentWeather?.icon || '01d', currentWeather?.condition || 'Clear', "w-12 h-12")
          )}
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
           {forecast.map((day, index) => (
              <div key={index} className={`flex flex-col items-center gap-2 min-w-[70px] p-3 rounded-2xl border ${index === 0 ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30' : 'bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-[#2d4a3e]'}`}>
                 <span className={`text-xs font-bold ${index === 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                   {index === 0 ? (t.live || 'Today') : getDayName(day.date)}
                 </span>
                 {getWeatherIconComponent(day.icon, day.condition, "w-5 h-5")}
                 <span className="text-sm font-bold text-gray-900 dark:text-white">{day.temp}°</span>
                 <span className="text-xs text-gray-500 dark:text-gray-400">
                   {day.humidity}%
                 </span>
              </div>
           ))}
        </div>
      </div>

      {/* SENSORS (Hardware Display) */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div><h2 className="font-semibold text-gray-900 dark:text-white text-lg">{t.soilParameters}</h2><p className="text-xs text-gray-500 dark:text-gray-400">{isConnected ? 'Live: Agro-Bozo WiFi' : t.liveData}</p></div>
          <div className="flex items-center gap-2"><span className="relative flex h-3 w-3"><span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'} opacity-75`}></span><span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></span></span><span className={`text-xs font-bold ${isConnected ? 'text-green-500' : 'text-yellow-500'}`}>{isConnected ? t.live : 'SIMULATION'}</span></div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Connection Status Indicator */}
          <div className={`col-span-2 p-3 rounded-lg border ${
            isConnected 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? '🔌 Hardware Connected' : '🔌 Hardware Offline'}
                </span>
              </div>
              {error && (
                <span className="text-xs opacity-75">{error}</span>
              )}
            </div>
            {sensorData && (
              <div className="text-xs mt-1 opacity-75">
                Last update: {new Date(lastUpdate).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-[#1a2e28] p-4 rounded-2xl border border-gray-100 dark:border-[#2d4a3e] relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><FlaskConical className="w-12 h-12 text-yellow-500" /></div>
            <div><span className="text-2xl font-bold text-gray-900 dark:text-white">{soilData.N}</span><span className="text-xs text-gray-400 ml-1">kg/ha</span></div>
            <div className="mt-2 text-[10px] font-bold text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-500/10 px-2 py-0.5 rounded-full w-fit">{t.nitrogen}</div>
          </div>
          <div className="bg-white dark:bg-[#1a2e28] p-4 rounded-2xl border border-gray-100 dark:border-[#2d4a3e] relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Sprout className="w-12 h-12 text-green-500" /></div>
            <div><span className="text-2xl font-bold text-gray-900 dark:text-white">{soilData.P}</span><span className="text-xs text-gray-400 ml-1">kg/ha</span></div>
            <div className="mt-2 text-[10px] font-bold text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-500/10 px-2 py-0.5 rounded-full w-fit">{t.phosphorus}</div>
          </div>
          <div className="bg-white dark:bg-[#1a2e28] p-4 rounded-2xl border border-gray-100 dark:border-[#2d4a3e] relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Leaf className="w-12 h-12 text-emerald-500" /></div>
            <div><span className="text-2xl font-bold text-gray-900 dark:text-white">{soilData.K}</span><span className="text-xs text-gray-400 ml-1">kg/ha</span></div>
            <div className="mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full w-fit">{t_planner.potassium || 'Potassium'}</div>
          </div>
          <div className="bg-white dark:bg-[#1a2e28] p-4 rounded-2xl border border-gray-100 dark:border-[#2d4a3e] relative overflow-hidden group shadow-sm">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Droplets className="w-12 h-12 text-blue-500" /></div>
            <div><span className="text-2xl font-bold text-gray-900 dark:text-white">{soilData.moisture}%</span><span className="text-xs text-gray-400 ml-1">moisture</span></div>
            <div className="mt-2 text-[10px] font-bold text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-500/10 px-2 py-0.5 rounded-full w-fit">{t_planner.moisture || 'Moisture'}</div>
          </div>
          <div className="bg-white dark:bg-[#1a2e28] p-4 rounded-2xl border border-gray-100 dark:border-[#2d4a3e] relative overflow-hidden group shadow-sm">
             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Thermometer className="w-12 h-12 text-orange-500" /></div>
             <div><span className="text-2xl font-bold text-gray-900 dark:text-white">{soilData.temp}°</span><span className="text-xs text-gray-400 ml-1">C</span></div>
             <div className="mt-2 text-[10px] font-bold text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-500/10 px-2 py-0.5 rounded-full w-fit">{t_planner.temperature || 'Temp'}</div>
          </div>
        </div>
      </div>

      {/* SENSOR HISTORY */}
      <div>
        <div className="flex justify-between items-end mb-4">
           <div><h2 className="font-semibold text-gray-900 dark:text-white text-lg">{t.sensorHistory || "Sensor History"}</h2><p className="text-xs text-gray-500 dark:text-gray-400">{t.recentCloudData || "Recent Cloud Data"}</p></div>
           <History className="w-4 h-4 text-gray-400" />
        </div>
        <div className="bg-white dark:bg-[#1a2e28] border border-gray-100 dark:border-[#2d4a3e] rounded-3xl overflow-hidden shadow-sm">
           <div className="grid grid-cols-6 gap-2 p-3 bg-gray-50 dark:bg-black/20 border-b border-gray-100 dark:border-[#2d4a3e] text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center">
              <div>{t.time || "Time"}</div>
              <div>N</div>
              <div>P</div>
              <div>K</div>
              <div>{t.mois || "Mois."}</div>
              <div>TEMP</div>
           </div>
           <div className="max-h-48 overflow-y-auto">
              {history.length === 0 ? (
                 <div className="p-4 text-center text-xs text-gray-500">Waiting for hardware data...</div>
              ) : (
                 history.slice(0, 10).map((item, index) => (
                    <div key={index} className="grid grid-cols-6 gap-2 p-3 border-b border-gray-100 dark:border-[#2d4a3e] text-xs text-gray-900 dark:text-white text-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                       <div className="font-mono text-gray-400">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                       <div className="font-bold text-yellow-500">{item.N}</div>
                       <div className="font-bold text-green-500">{item.P}</div>
                       <div className="font-bold text-gray-700 dark:text-white">{item.K}</div>
                       <div className="font-bold text-blue-500">{item.moisture}%</div>
                       <div className="font-bold text-orange-500">{item.temp}°C</div>
                    </div>
                 ))
              )}
           </div>
        </div>
      </div>

      {/* MANDI PRICES */}
      <div className="bg-white dark:bg-[#1a2e28] p-4 rounded-3xl border border-gray-100 dark:border-[#2d4a3e] shadow-sm">
         <div className="flex justify-between items-center mb-3">
            <div><h3 className="text-lg font-bold text-gray-900 dark:text-white">💰 {t_market?.title || "Mandi Prices"}</h3><p className="text-xs text-gray-500 dark:text-gray-400">Live Agmarknet</p></div>
            <button onClick={() => setView(ViewState.MARKET)} className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1">{t.viewAll} <ChevronRight className="w-3 h-3" /></button>
         </div>
         {mandiData ? (
           <div className="bg-gray-50 dark:bg-black/20 rounded-2xl p-4 border border-gray-100 dark:border-[#2d4a3e] flex justify-between items-center">
             <div><p className="text-3xl font-bold text-green-600 dark:text-green-500">₹ {mandiData.bestPrice}</p><p className="text-xs font-bold text-gray-700 dark:text-gray-200 mt-1 uppercase tracking-wide">{mandiData.bestMandiName}</p></div>
             <div className="text-right"><div className="bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 text-xs font-bold px-3 py-1.5 rounded-full inline-block">+{mandiData.percentHigher}%</div></div>
           </div>
         ) : <div className="text-center p-4 text-xs text-gray-500">Loading rates...</div>}
      </div>

      {/* SCHEMES */}
      <div>
        <div className="flex justify-between items-end mb-4">
           <div><h2 className="font-semibold text-gray-900 dark:text-white text-lg">{t.schemesTitle}</h2><p className="text-xs text-gray-500 dark:text-gray-400">{t.schemesSubtitle}</p></div>
           <button onClick={() => setView(ViewState.SCHEMES)} className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">{t.viewAll} <ChevronRight className="w-3 h-3" /></button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {schemesList && schemesList.map((scheme: any) => (
             <div key={scheme.id} onClick={() => setView(ViewState.SCHEMES)} className="min-w-[240px] bg-white dark:bg-[#1a2e28] border border-gray-100 dark:border-[#2d4a3e] rounded-2xl p-4 shadow-sm flex flex-col gap-3 active:scale-95 transition-transform cursor-pointer">
                <div className="flex justify-between items-start">
                   <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-500"><ShieldCheck className="w-5 h-5" /></div>
                   <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${scheme.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500' : 'bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-500'}`}>{scheme.status}</span>
                </div>
                <div><h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{scheme.name}</h3><p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{scheme.eligibility}</p></div>
             </div>
          ))}
        </div>
      </div>

      {/* NEWS */}
      <div>
        <div className="flex justify-between items-end mb-4">
           <div><h2 className="font-semibold text-gray-900 dark:text-white text-lg">{t.newsTitle}</h2><p className="text-xs text-gray-500 dark:text-gray-400">{t.newsSubtitle}</p></div>
           <button onClick={() => setView(ViewState.NEWS)} className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">{t.viewAll} <ChevronRight className="w-3 h-3" /></button>
        </div>
        <div className="space-y-4">
          {liveNews.length > 0 ? liveNews.map((news: any, index: number) => (
            <div key={news.id} onClick={() => window.open(news.link, '_blank')} className="bg-white dark:bg-[#1a2e28] border border-gray-100 dark:border-[#2d4a3e] rounded-2xl p-4 flex gap-4 shadow-sm cursor-pointer active:scale-95 transition-transform hover:shadow-md">
               <img src={news.image || NEWS_FALLBACKS[index % NEWS_FALLBACKS.length]} alt="News" className="w-24 h-24 object-cover rounded-xl shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = NEWS_FALLBACKS[index % NEWS_FALLBACKS.length]; }} />
               <div className="flex flex-col justify-between py-1 flex-1">
                 <div>
                   <div className="flex items-center gap-2 mb-1">
                     <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">{news.source}</span>
                     {news.category && (
                       <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                         {news.category}
                       </span>
                     )}
                     {news.readTime && (
                       <span className="text-[10px] text-gray-500 dark:text-gray-400">
                         {news.readTime}
                       </span>
                     )}
                   </div>
                   <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight line-clamp-2">{news.title}</h3>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{news.summary}</p>
                 </div>
                 <div className="flex justify-between items-center mt-2">
                   <span className="text-xs text-gray-500 dark:text-gray-400">{news.pubDate}</span>
                   <button className="p-1.5 rounded-full bg-gray-50 dark:bg-[#0d1f18] border border-gray-100 dark:border-[#2d4a3e] hover:bg-gray-100 dark:hover:bg-[#2d4a3e] transition-colors">
                     <PlayCircle className="w-4 h-4 text-gray-900 dark:text-white" />
                   </button>
                 </div>
               </div>
            </div>
          )) : (
             <div className="text-center py-10 text-gray-500 text-sm">
               <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-green-500 rounded-full mx-auto mb-3"></div>
               Loading latest agricultural news...
             </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default HomeView;