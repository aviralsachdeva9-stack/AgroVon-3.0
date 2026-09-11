import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, MapPin, TrendingUp, TrendingDown, Navigation, Search, X, AlertCircle } from 'lucide-react';
import { ViewState } from '../types';
import { fetchMandiByGPS, fetchLiveMandiPrices, findBestMandi, MandiRecord, MandiResult, SUPPORTED_STATES } from '../services/mandiService';

interface MarketViewProps {
  setView: (view: ViewState) => void;
  language: string;
  isDarkMode?: boolean;
}

// --- INTERNAL TRANSLATIONS FOR MARKET VIEW ---
const MARKET_TEXT = {
  en: {
    title: "Mandi Bhav (Live)",
    searchHeader: "Search Location",
    searchPlaceholder: "Enter District (e.g. Meerut)",
    checkPrices: "Check Prices",
    fetching: "Finding best rates...",
    noData: "No data found for",
    trySearch: "Try searching a different district.",
    maxPrice: "Max Price",
    minPrice: "Min Price",
    avgMarket: "Avg Market",
    bestOption: "Best Option",
    sellAdvice: "Sell your",
    at: "at",
    higherAvg: "higher than average",
    navigate: "Navigate",
    setAlert: "Set Alert",
    listHeader: "Mandi Rates List",
    results: "results",
    profit: "Profit",
    quintal: "/ quintal"
  },
  hi: {
    title: "मंडी भाव (लाइव)",
    searchHeader: "मंडी खोजें",
    searchPlaceholder: "जिला दर्ज करें (जैसे मेरठ)",
    checkPrices: "भाव देखें",
    fetching: "रेट लोड हो रहे हैं...",
    noData: "कोई डेटा नहीं मिला:",
    trySearch: "कृपया दूसरा जिला खोजें।",
    maxPrice: "अधिकतम मूल्य",
    minPrice: "न्यूनतम मूल्य",
    avgMarket: "औसत बाजार",
    bestOption: "सबसे अच्छा विकल्प",
    sellAdvice: "अपनी फसल यहाँ बेचें:",
    at: "", 
    higherAvg: "औसत से अधिक",
    navigate: "नेविगेट करें",
    setAlert: "अलर्ट सेट करें",
    listHeader: "मंडी रेट लिस्ट",
    results: "परिणाम",
    profit: "मुनाफा",
    quintal: "/ क्विंटल"
  },
  pb: {
    title: "ਮੰਡੀ ਭਾਅ (ਲਾਈਵ)",
    searchHeader: "ਮੰਡੀ ਖੋਜੋ",
    searchPlaceholder: "ਜ਼ਿਲ੍ਹਾ ਦਰਜ ਕਰੋ (ਜਿਵੇਂ ਮੇਰਠ)",
    checkPrices: "ਭਾਅ ਦੇਖੋ",
    fetching: "ਰੇਟ ਲੋਡ ਹੋ ਰਹੇ ਹਨ...",
    noData: "ਕੋਈ ਡਾਟਾ ਨਹੀਂ ਮਿਲਿਆ:",
    trySearch: "ਕਿਰਪਾ ਕਰਕੇ ਦੂਜਾ ਜ਼ਿਲ੍ਹਾ ਖੋਜੋ",
    maxPrice: "ਵਧੇਰੇ ਮੁੱਲ",
    minPrice: "ਘੱਟੋ-ਘੱਟ ਮੁੱਲ",
    avgMarket: "ਔਸਤ ਬਜ਼ਾਰ",
    bestOption: "ਵਧੀਆ ਵਿਕਲਪ",
    sellAdvice: "ਆਪਣੀ ਫਸਲ ਇੱਥੇ ਵੇਚੋ:",
    at: "",
    higherAvg: "ਔਸਤ ਤੋਂ ਵੱਧ",
    navigate: "ਨੈਵੀਗੇਟ ਕਰੋ",
    setAlert: "ਅਲਰਟ ਲਗਾਓ",
    listHeader: "ਮੰਡੀ ਰੇਟ ਸੂਚੀ",
    results: "ਨਤੀਜੇ",
    profit: "ਮੁਨਾਫਾ",
    quintal: "/ ਕੁਇੰਟਲ"
  },
  te: {
    title: "మండి ధరలు (లైవ్)",
    searchHeader: "స్థానాన్ని వెతకండి",
    searchPlaceholder: "జిల్లాను నమోదు చేయండి",
    checkPrices: "ధరలను తనిఖీ చేయండి",
    fetching: "రేట్లు పొందుతున్నారు...",
    noData: "డెటా కనుగొనబడలేదు",
    trySearch: "వేరే జిల్లాను ప్రయత్నించండి",
    maxPrice: "గరిష్ట ధర",
    minPrice: "కనిష్ట ధర",
    avgMarket: "సగటు మార్కెట్",
    bestOption: "ఉత్తమ ఎంపిక",
    sellAdvice: "మీ పంటను ఇక్కడ అమ్మండి:",
    at: "",
    higherAvg: "సగటు కంటే ఎక్కువ",
    navigate: "నావిగేట్ చేయండి",
    setAlert: "హెచ్చరిక సెట్ చేయండి",
    listHeader: "మండి ధరల జాబితా",
    results: "ఫలితాలు",
    profit: "లాభం",
    quintal: "/ క్వింటాల్"
  }
};

const MarketView: React.FC<MarketViewProps> = ({ setView, language, isDarkMode = true }) => {
  const t = MARKET_TEXT[language as keyof typeof MARKET_TEXT] || MARKET_TEXT['en'];

  const [selectedCrop, setSelectedCrop] = useState("Wheat");
  const [mandiList, setMandiList] = useState<MandiRecord[]>([]);
  const [bestMandi, setBestMandi] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [isFallbackAllCrops, setIsFallbackAllCrops] = useState(false);
  
  // --- SEARCH STATE ---
  const [showSearch, setShowSearch] = useState(false);
  const [searchState, setSearchState] = useState("Uttar Pradesh");
  const [searchDistrict, setSearchDistrict] = useState("");
  const [detectedLocation, setDetectedLocation] = useState("Detecting location...");

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
    inputBg: isDarkMode ? 'bg-black/20 border-white/10' : 'bg-gray-50 border-gray-300',
    searchOverlay: isDarkMode ? 'bg-[#1a2e28] border-green-500/50' : 'bg-white border-green-500/30',
    bestCardBg: isDarkMode ? 'from-green-600 to-green-800' : 'from-green-500 to-green-600',
    selectBg: isDarkMode ? 'bg-transparent' : 'bg-transparent'
  };

  // Initial Load — GPS auto-detect
  useEffect(() => {
    autoDetectAndLoad();
  }, [selectedCrop]);

  const autoDetectAndLoad = async () => {
    setLoading(true);
    setApiError(null);
    setMandiList([]);
    try {
      // Try GPS → Nominatim → OGD
      const result: MandiResult = await fetchMandiByGPS(selectedCrop);
      applyResult(result);
    } catch (gpsErr: any) {
      // GPS denied — show search panel and ask user to enter manually
      console.warn("📍 GPS denied:", gpsErr?.message);
      setDetectedLocation("Location denied — search manually");
      setApiError("Location permission denied. Please search your district below.");
      setShowSearch(true);
      setLoading(false);
    }
  };

  const applyResult = (result: MandiResult) => {
    if (result.records.length > 0) {
      setMandiList(result.records);
      setBestMandi(findBestMandi(result.records));
      setDetectedLocation(`${result.district}, ${result.state}`);
      setIsFallback(result.isFallback);
      setIsFallbackAllCrops(result.isFallbackAllCrops);
      setApiError(null);
      setShowSearch(false);
    } else {
      setMandiList([]);
      setBestMandi(null);
      setIsFallback(false);
      setIsFallbackAllCrops(false);
      setDetectedLocation(`${result.district} — No data`);
      setApiError(result.error || `No Mandi records found for ${result.district}, ${result.state}`);
    }
    setLoading(false);
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchDistrict.trim()) return;
    setLoading(true);
    setApiError(null);
    setMandiList([]);
    const result = await fetchLiveMandiPrices(searchState, searchDistrict.trim(), selectedCrop);
    applyResult(result);
  };

  return (
    <div className={`p-6 pb-24 space-y-6 animate-fade-in min-h-screen ${themeClasses.background}`}>
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <button onClick={() => setView(ViewState.HOME)} className={`p-2 rounded-full ${themeClasses.buttonBg} ${themeClasses.text}`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className={`text-xl font-bold ${themeClasses.text}`}>{t.title}</h1>
        <button className={`p-2 rounded-full ${themeClasses.buttonBg} ${themeClasses.text}`}>
          <Bell className="w-5 h-5" />
        </button>
      </div>

      {/* --- SEARCH BOX (Overlay) --- */}
      {showSearch && (
        <div className={`${themeClasses.searchOverlay} p-4 rounded-2xl border shadow-2xl animate-in fade-in zoom-in duration-200`}>
           <div className="flex justify-between items-center mb-3">
              <h3 className={`font-bold text-sm ${themeClasses.text}`}>{t.searchHeader}</h3>
              <button onClick={() => setShowSearch(false)}><X className={`w-4 h-4 ${themeClasses.subText}`} /></button>
           </div>
           <form onSubmit={handleManualSearch} className="space-y-3">
              <select 
                value={searchState} 
                onChange={(e) => setSearchState(e.target.value)}
                className={`w-full ${themeClasses.inputBg} p-3 rounded-xl border outline-none text-sm ${themeClasses.text}`}
              >
                {SUPPORTED_STATES.map((s) => (
                  <option key={s} value={s} className="text-black">{s}</option>
                ))}
              </select>
              <input 
                type="text" 
                placeholder={t.searchPlaceholder} 
                value={searchDistrict}
                onChange={(e) => setSearchDistrict(e.target.value)}
                className={`w-full ${themeClasses.inputBg} p-3 rounded-xl border outline-none text-sm ${themeClasses.text} placeholder-${themeClasses.subText}`}
              />
              <button type="submit" className={`w-full ${isDarkMode ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-600'} text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2`}>
                 <Search className="w-4 h-4" /> {t.checkPrices}
              </button>
           </form>
        </div>
      )}

      {/* DROPDOWNS & LOCATION BAR */}
      {!showSearch && (
        <div className="flex gap-3">
            <div className={`flex-1 ${themeClasses.cardBg} p-3 rounded-xl ${themeClasses.cardBorder} border flex items-center justify-between ${themeClasses.text} relative`}>
            <select 
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className={`${themeClasses.selectBg} w-full outline-none font-bold appearance-none z-10 ${themeClasses.text}`}
            >
                <option value="Wheat" className="text-black">Wheat (Gehu)</option>
                <option value="Rice" className="text-black">Rice (Dhan)</option>
                <option value="Potato" className="text-black">Potato (Aloo)</option>
                <option value="Tomato" className="text-black">Tomato (Tamatar)</option>
                <option value="Onion" className="text-black">Onion (Pyaaz)</option>
                <option value="Mustard" className="text-black">Mustard (Sarso)</option>
            </select>
            <div className="absolute right-3 pointer-events-none">▼</div>
            </div>
            
            {/* CLICKABLE LOCATION BADGE */}
            <button 
                onClick={() => setShowSearch(true)}
                className={`flex-1 ${themeClasses.cardBg} p-3 rounded-xl ${themeClasses.cardBorder} border flex items-center justify-between ${themeClasses.text} ${isDarkMode ? 'active:bg-[#2d4a3e]' : 'active:bg-gray-100'} transition-colors`}
            >
                <span className={`text-sm font-medium opacity-80 truncate text-left ${themeClasses.text}`}>{detectedLocation}</span>
                <Search className="w-4 h-4 text-green-500 shrink-0" />
            </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mb-2"></div>
          <p className={`text-sm ${themeClasses.subText}`}>{t.fetching}</p>
        </div>
      ) : mandiList.length === 0 ? (
        <div className={`text-center py-16 ${themeClasses.subText} space-y-3`}>
          <AlertCircle className="w-10 h-10 mx-auto opacity-40" />
          <p className="font-semibold text-sm">{t.noData} {selectedCrop}</p>
          {apiError && (
            <p className={`text-xs px-4 py-2 rounded-xl mx-4 ${
              isDarkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
            }`}>{apiError}</p>
          )}
          <button
            onClick={() => setShowSearch(true)}
            className="text-xs text-green-500 underline mt-2"
          >
            {t.trySearch}
          </button>
        </div>
      ) : (
        <>
          {/* STATS ROW */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`${themeClasses.cardBg} p-4 rounded-xl ${themeClasses.cardBorder} border`}>
               <div className="flex items-center gap-2 mb-1 text-green-400 text-xs font-bold uppercase tracking-wider">
                  <TrendingUp className="w-3 h-3" /> {t.maxPrice}
               </div>
               <div className={`text-2xl font-bold ${themeClasses.text}`}>₹{bestMandi?.bestPrice || '---'}</div>
               <div className={`text-[10px] ${themeClasses.subText} line-clamp-1`}>{bestMandi?.bestMandiName}</div>
            </div>
            <div className={`${themeClasses.cardBg} p-4 rounded-xl ${themeClasses.cardBorder} border`}>
               <div className="flex items-center gap-2 mb-1 text-red-400 text-xs font-bold uppercase tracking-wider">
                  <TrendingDown className="w-3 h-3" /> {t.minPrice}
               </div>
               <div className={`text-2xl font-bold ${themeClasses.text}`}>₹{mandiList[mandiList.length-1]?.modal_price || '---'}</div>
               <div className={`text-[10px] ${themeClasses.subText}`}>{t.avgMarket}</div>
            </div>
          </div>

          {/* BEST PLACE TO SELL CARD */}
          {bestMandi && (
            <div className={`bg-gradient-to-br ${themeClasses.bestCardBg} p-5 rounded-3xl relative overflow-hidden shadow-lg border ${isDarkMode ? 'border-white/10' : 'border-white/20'}`}>
              <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="w-24 h-24 text-white" /></div>
              
              <div className="relative z-10">
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                  {t.bestOption}
                </span>
                <h3 className="text-lg font-bold text-white mt-3 leading-tight">
                  {t.sellAdvice} {selectedCrop} {t.at} <br/>
                  <span className="text-yellow-300 text-2xl">{bestMandi.bestMandiName}</span>
                </h3>
                <p className="text-green-100 text-sm mt-1">
                  {t.profit}: <span className="font-bold text-white">{bestMandi.percentHigher}%</span> {t.higherAvg}.
                </p>

                <div className="flex gap-3 mt-4">
                   <button className={`flex-1 ${isDarkMode ? 'bg-white text-green-800 hover:bg-gray-100' : 'bg-white text-green-700 hover:bg-gray-50'} py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors`}>
                      <Navigation className="w-4 h-4" /> {t.navigate}
                   </button>
                   <button className={`flex-1 ${isDarkMode ? 'bg-black/20 hover:bg-black/30' : 'bg-black/10 hover:bg-black/20'} text-white py-2.5 rounded-xl font-bold text-sm ${isDarkMode ? 'border-white/10' : 'border-white/20'} border transition-colors`}>
                      {t.setAlert}
                   </button>
                </div>
              </div>
            </div>
          )}

          {/* FALLBACK BANNER — L2: state+crop / L3: all crops */}
          {(isFallback || isFallbackAllCrops) && (
            <div className={`flex items-start gap-3 px-4 py-3 rounded-2xl border ${
              isDarkMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                {isFallbackAllCrops ? (
                  <>
                    No <strong>{selectedCrop}</strong> data found in {mandiList[0]?.state} today.<br />
                    <span className="font-semibold">Showing all available crops from nearby markets.</span>
                  </>
                ) : (
                  <>
                    No data for your exact district.<br />
                    <span className="font-semibold">Showing latest <strong>{selectedCrop}</strong> prices from nearby markets in {mandiList[0]?.state}.</span>
                  </>
                )}
              </p>
            </div>
          )}

          {/* MANDI LIST */}
          <div>
            <div className="flex justify-between items-end mb-4">
               <h2 className={`font-bold ${themeClasses.text} text-lg`}>{t.listHeader}</h2>
               <span className={`text-xs ${themeClasses.subText}`}>{mandiList.length} {t.results}</span>
            </div>
            
            <div className="space-y-3">
              {mandiList.map((mandi, index) => (
                <div key={index} className={`${themeClasses.cardBg} p-4 rounded-2xl ${themeClasses.cardBorder} border flex justify-between items-center`}>
                  <div>
                    <h3 className={`font-bold ${themeClasses.text} text-md`}>{mandi.market}</h3>
                    <div className={`flex items-center gap-1 text-xs ${themeClasses.subText} mt-1`}>
                       <MapPin className="w-3 h-3" />
                       <span>{mandi.district}, {mandi.state}</span>
                       {isFallback && (
                         <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                           isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-600'
                         }`}>Nearby</span>
                       )}
                    </div>
                    {mandi.arrival_date && (
                      <div className={`text-[10px] ${themeClasses.mutedText} mt-0.5`}>
                        📅 {mandi.arrival_date}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${themeClasses.text}`}>₹{mandi.modal_price}</div>
                    <div className={`text-[10px] ${themeClasses.subText}`}>{t.quintal}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MarketView;