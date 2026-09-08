import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, Settings, Phone, MapPin, 
  Sprout, Edit2, Globe, LogOut, 
  Award, TrendingUp, Sun, Moon, ShieldCheck, Camera 
} from 'lucide-react';
import { ViewState, UserProfile } from '../types';

interface ProfileViewProps {
  setView: (view: ViewState) => void;
  userProfile?: UserProfile;
  isDarkMode: boolean;
  toggleTheme: () => void;
  language: string;
  setLanguage: (lang: string) => void;
  onLogout: () => void; // ✅ Required for logout to work
}

// --- TRANSLATION DICTIONARY ---
const PROFILE_TEXT = {
  en: {
    header: "My Profile",
    level: "Pro Farmer • Lvl 5",
    harvests: "Harvests",
    soilScore: "Soil Score",
    profit: "Profit",
    personalDetails: "Personal Details",
    mobile: "Mobile Number",
    location: "Farm Location",
    preferences: "Preferences",
    language: "App Language",
    langSub: "Select your preferred language",
    appearance: "Appearance",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    logout: "Log Out",
    logoutMsg: "Logged out successfully!",
    footer: "AgriSmart v1.0.2 • Made for Farmers ❤️"
  },
  hi: {
    header: "मेरी प्रोफाइल",
    level: "प्रो किसान • लेवल 5",
    harvests: "कटाई",
    soilScore: "मृदा स्कोर",
    profit: "मुनाफा",
    personalDetails: "व्यक्तिगत विवरण",
    mobile: "मोबाइल नंबर",
    location: "खेत का स्थान",
    preferences: "प्राथमिकताएं",
    language: "ऐप की भाषा",
    langSub: "अपनी पसंदीदा भाषा चुनें",
    appearance: "दिखावट",
    darkMode: "डार्क मोड",
    lightMode: "लाइट मोड",
    logout: "लॉग आउट",
    logoutMsg: "सफलतापूर्वक लॉग आउट किया गया!",
    footer: "एग्रीस्मार्ट v1.0.2 • किसानों के लिए ❤️"
  },
  pb: {
    header: "ਮੇਰੀ ਪ੍ਰੋਫਾਈਲ",
    level: "ਪ੍ਰੋ ਕਿਸਾਨ • ਲੈਵਲ 5",
    harvests: "ਕਟਾਈ",
    soilScore: "ਮਿੱਟੀ ਸਕੋਰ",
    profit: "ਮੁਨਾਫਾ",
    personalDetails: "ਨਿੱਜੀ ਵੇਰਵੇ",
    mobile: "ਮੋਬਾਈਲ ਨੰਬਰ",
    location: "ਖੇਤ ਦਾ ਸਥਾਨ",
    preferences: "ਤਰਜੀਹਾਂ",
    language: "ਐਪ ਭਾਸ਼ਾ",
    langSub: "ਆਪਣੀ ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ ਚੁਣੋ",
    appearance: "ਦਿੱਖ",
    darkMode: "ਡਾਰਕ ਮੋਡ",
    lightMode: "ਲਾਈਟ ਮੋਡ",
    logout: "ਲੌਗ ਆਉਟ",
    logoutMsg: "ਸਫਲਤਾਪੂਰਵਕ ਲੌਗ ਆਉਟ!",
    footer: "ਐਗਰੀਸਮਾਰਟ v1.0.2 • ਕਿਸਾਨਾਂ ਲਈ ❤️"
  },
  te: {
    header: "నా ప్రొఫైల్",
    level: "ప్రో రైతు • స్థాయి 5",
    harvests: "పంటలు",
    soilScore: "మట్టి స్కోర్",
    profit: "లాభం",
    personalDetails: "వ్యక్తిగత వివరాలు",
    mobile: "మొబైల్ సంఖ్య",
    location: "పొలం స్థానం",
    preferences: "ప్రాధాన్యతలు",
    language: "యాప్ భాష",
    langSub: "మీకు నచ్చిన భాషను ఎంచుకోండి",
    appearance: "కనిపించే తీరు",
    darkMode: "డార్క్ మోడ్",
    lightMode: "లైట్ మోడ్",
    logout: "లాగ్ అవుట్",
    logoutMsg: "విజయవంతంగా లాగ్ అవుట్ అయ్యారు!",
    footer: "అగ్రిస్మార్ట్ v1.0.2 • రైతుల కోసం ❤️"
  }
};

// --- NAME MAPPING ---
const NAME_TRANSLATIONS: any = {
  "aviral": { en: "Aviral", hi: "अविरल", pb: "ਅਵੀਰਲ", te: "అవిరల్" },
  "kisan": { en: "Kisan", hi: "किसान", pb: "ਕਿਸਾਨ", te: "రైతు" }
};

const ProfileView: React.FC<ProfileViewProps> = ({ 
  setView, userProfile, isDarkMode, toggleTheme, language, setLanguage, onLogout 
}) => {
  
  const t = PROFILE_TEXT[language as keyof typeof PROFILE_TEXT] || PROFILE_TEXT['en'];

  // --- 1. PROFILE PICTURE STATE ---
  const [avatar, setAvatar] = useState<string | null>(() => {
    return localStorage.getItem('agriSmart_avatar') || null;
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatar(result);
        localStorage.setItem('agriSmart_avatar', result); // Persist image
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // --- 2. NAME TRANSLATION LOGIC ---
  const getTranslatedName = (name: string) => {
    if (!name) return "User";
    const lowerName = name.toLowerCase().split(' ')[0];
    if (NAME_TRANSLATIONS[lowerName]) {
      return NAME_TRANSLATIONS[lowerName][language] || name;
    }
    return name;
  };

  const displayName = getTranslatedName(userProfile?.name || 'Aviral');

  const stats = [
    { label: t.harvests, value: "12", icon: <Sprout className="w-4 h-4 text-green-400" /> },
    { label: t.soilScore, value: "85%", icon: <ShieldCheck className="w-4 h-4 text-blue-400" /> },
    { label: t.profit, value: "+18%", icon: <TrendingUp className="w-4 h-4 text-yellow-400" /> },
  ];

  return (
    <div className={`flex flex-col min-h-screen animate-fade-in pb-24 ${isDarkMode ? 'bg-[#0d1f18] text-white' : 'bg-gray-100 text-gray-900'}`}>
      
      {/* --- HEADER --- */}
      <div className={`relative pt-8 pb-6 px-6 rounded-b-[40px] shadow-2xl ${isDarkMode ? 'bg-gradient-to-b from-[#1a4a36] to-[#0d1f18]' : 'bg-gradient-to-b from-green-600 to-green-500'}`}>
        
        {/* Nav Bar */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setView(ViewState.HOME)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur-md">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-bold tracking-wide text-white">{t.header}</h1>
          <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 backdrop-blur-md">
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div 
              className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gradient-to-tr from-green-400 to-green-600 border-4 border-[#0d1f18] text-white' : 'bg-white border-4 border-green-200 text-green-700'}`}
            >
              {avatar ? (
                <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                userProfile?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AV'
              )}
            </div>
            
            {/* Edit Button */}
            <button 
              onClick={triggerFileInput}
              className="absolute bottom-0 right-0 p-2 bg-white text-green-800 rounded-full border-2 border-[#0d1f18] shadow-md hover:bg-gray-100 active:scale-95 transition-transform"
            >
              <Camera className="w-4 h-4" />
            </button>
            
            {/* Hidden File Input */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload}
            />
          </div>
          
          <h2 className="text-2xl font-bold mt-4 capitalize text-white tracking-wide">{displayName}</h2>
          
          <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-white/10 rounded-full border border-white/5">
            <Award className="w-3 h-3 text-yellow-400" />
            <span className="text-xs font-medium text-yellow-400 uppercase tracking-wider">{t.level}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex justify-between gap-3 mt-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 p-3 rounded-2xl flex flex-col items-center gap-1 hover:bg-white/10 transition-colors">
              <div className="p-1.5 bg-white/5 rounded-full mb-1">{stat.icon}</div>
              <span className="text-lg font-bold text-white">{stat.value}</span>
              <span className="text-[10px] text-gray-200 uppercase tracking-widest">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="px-5 mt-6 space-y-6">
        
        {/* Personal Details */}
        <div className={`rounded-3xl p-5 border shadow-sm ${isDarkMode ? 'bg-[#1a2e28] border-[#2d4a3e]' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.personalDetails}</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#0d1f18] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t.mobile}</p>
                {/* ✅ Changed to userProfile.mobile to fix dummy data issue */}
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>+91 {userProfile?.mobile || '9876543210'}</p>
              </div>
            </div>
            <div className={`w-full h-[1px] ${isDarkMode ? 'bg-[#2d4a3e]' : 'bg-gray-100'}`}></div>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#0d1f18] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                <MapPin className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t.location}</p>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{userProfile?.district || 'Noida'}, {userProfile?.state ? (userProfile.state === "Uttar Pradesh" ? "UP" : userProfile.state) : "India"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* App Settings */}
        <div className={`rounded-3xl p-5 border shadow-sm ${isDarkMode ? 'bg-[#1a2e28] border-[#2d4a3e]' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.preferences}</h3>
          
          {/* Language Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t.language}</p>
                <p className="text-xs text-gray-500">{t.langSub}</p>
              </div>
            </div>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className={`text-xs py-2 px-3 rounded-lg border outline-none cursor-pointer ${isDarkMode ? 'bg-[#0d1f18] text-white border-[#2d4a3e]' : 'bg-gray-50 text-gray-900 border-gray-300'}`}
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="pb">ਪੰਜਾਬੀ</option>
              <option value="te">తెలుగు</option>
            </select>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-orange-500" />}
              </div>
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t.appearance}</p>
                <p className="text-xs text-gray-500">{isDarkMode ? t.darkMode : t.lightMode}</p>
              </div>
            </div>
            <button 
              onClick={toggleTheme} 
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${isDarkMode ? 'bg-green-600' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
          </div>
        </div>

        {/* Logout */}
        <button 
          onClick={() => {
             alert(t.logoutMsg);
             onLogout(); // ✅ Explicitly calling the logout function
          }}
          className="w-full py-4 rounded-2xl border border-red-500/30 text-red-400 font-bold flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors active:scale-95"
        >
          <LogOut className="w-5 h-5" /> {t.logout}
        </button>

        <p className={`text-center text-[10px] pb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>{t.footer}</p>
      </div>
    </div>
  );
};

export default ProfileView;