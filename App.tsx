import React, { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';
import BottomNav from './components/BottomNav';
import HomeView from './components/HomeView';
import ProductDetailView from './components/ProductDetailView';
import CropManagerView from './components/CropManagerView';
import SustainabilityView from './components/SustainabilityView';
import AIChatView from './components/AIChatView';
import LiveVoice from './components/LiveVoice';
import LoginView from './components/LoginView';
import OnboardingView from './components/OnboardingView';
import MarketView from './components/MarketView';
import ProfileView from './components/ProfileView';
import NotesView from './components/NotesView';
import SchemesView from './components/SchemesView';
import SoilAnalysisView from './components/SoilAnalysisView'; 
import NewsView from './components/NewsView'; 
import NotificationBanner from './components/NotificationBanner';
import DebugView from './components/DebugView';
import { ViewState, Product, Crop, Activity, UserProfile } from './types';
import { TRANSLATIONS } from './utils/translations';
import { speakText } from './services/grokService';
import { useHardwareData } from './hooks/useHardwareData';

function App() {
  // --- 1. STATE MANAGEMENT ---
  
  // User Profile (Persisted)
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>(() => {
    const saved = localStorage.getItem('agriSmartUser');
    return saved ? JSON.parse(saved) : undefined;
  });

  // Navigation View State
  const [currentView, setView] = useState<ViewState>(() => {
    return localStorage.getItem('agriSmartUser') ? ViewState.HOME : ViewState.LOGIN;
  });

  // Theme State (Persisted)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('agriSmartTheme');
    return saved ? JSON.parse(saved) : true;
  });

  // Language State (Persisted)
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('agriSmartLang') || 'en';
  });

  // Data States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const { sensorData, isConnected, lastUpdate, error, isLoading, refetch } = useHardwareData(5000);
  const [soilData, setSoilData] = useState({ N: 45, P: 32, K: 180, moisture: 24, temp: 27 });
  const [mobileNumber, setMobileNumber] = useState('');
  const [activeNotification, setActiveNotification] = useState<{key: string, title: string, message: string, type: 'alert' | 'info'} | null>(null);
  
  // Welcome Message Tracker
  const [hasWelcomed, setHasWelcomed] = useState(() => {
    return !!sessionStorage.getItem('agriSmartHasWelcomed');
  });

  // --- 2. EFFECTS (Side Effects) ---

  // Persist User
  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('agriSmartUser', JSON.stringify(userProfile));
    }
  }, [userProfile]);

  // Apply Theme (Dark/Light)
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('agriSmartTheme', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Persist Language
  useEffect(() => {
    localStorage.setItem('agriSmartLang', language);
  }, [language]);

  // Play Welcome Voice
  useEffect(() => {
    const playWelcome = async () => {
        if (currentView === ViewState.HOME && !hasWelcomed && userProfile && userProfile.name) {
            setHasWelcomed(true);
            sessionStorage.setItem('agriSmartHasWelcomed', 'true');

            const t = TRANSLATIONS[language]?.home || TRANSLATIONS['en'].home;
            const firstName = userProfile.name.split(' ')[0];
            const text = `${t.hello} ${firstName}, ${t.welcome}`;
            
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                await speakText(text);
            } catch (e) {
                console.error("Welcome voice error", e);
            }
        }
    }
    playWelcome();
  }, [currentView, hasWelcomed, userProfile, language]);

  // Simulate Random Notification
  useEffect(() => {
    if (currentView === ViewState.HOME && !activeNotification && userProfile) {
       const timer = setTimeout(() => {
           const notifs = TRANSLATIONS[language]?.notifications || TRANSLATIONS['en'].notifications;
           if (Math.random() > 0.7) {
               setActiveNotification({
                   key: Date.now().toString(),
                   title: notifs.weatherAlert.title,
                   message: notifs.weatherAlert.message.replace('{location}', userProfile.district || 'your area'),
                   type: 'alert'
               });
           }
       }, 8000);
       return () => clearTimeout(timer);
    }
  }, [currentView, activeNotification, language, userProfile]);

  // Update soil data when hardware data is available
  useEffect(() => {
    if (sensorData && isConnected) {
      setSoilData({
        N: sensorData.N,
        P: sensorData.P,
        K: sensorData.K,
        moisture: sensorData.moisture,
        temp: sensorData.temp
      });
      console.log('✅ Soil data updated from hardware:', sensorData);
    } else if (!isConnected && sensorData === null) {
      console.warn('⚠️ Hardware disconnected, using fallback data');
    }
  }, [sensorData, isConnected]);

  // --- 3. HANDLERS ---

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleUpdateProfile = (profile: Partial<UserProfile>) => {
      setUserProfile(prev => prev ? { ...prev, ...profile } : profile as UserProfile);
  };

  const handleLogout = () => {
      localStorage.removeItem('agriSmartUser');
      sessionStorage.removeItem('agriSmartHasWelcomed');
      setUserProfile(undefined);
      setView(ViewState.LOGIN);
      setHasWelcomed(false);
  };

  const handleAddCrop = (crop: Crop) => {
      setCrops(prev => [...prev, crop]);
  };

  const handleDeleteCrop = (id: string) => {
      setCrops(prev => prev.filter(c => c.id !== id));
  };

  const handleAddActivity = (cropId: string, activity: Activity) => {
      setCrops(prev => prev.map(c => {
          if (c.id === cropId) {
              return { ...c, activities: [activity, ...c.activities] };
          }
          return c;
      }));
  };

  // --- 4. VIEW ROUTER ---

  const renderView = () => {
    switch (currentView) {
      case ViewState.LOGIN:
        return (
          <LoginView 
            setView={setView} 
            setUserProfile={setUserProfile}
            setLanguage={setLanguage}
            currentLanguage={language}
            setMobile={setMobileNumber}
          />
        );
      case ViewState.ONBOARDING:
        return (
          <OnboardingView 
            setView={setView} 
            updateProfile={handleUpdateProfile} 
            currentMobile={mobileNumber}
            language={language} 
          />
        );
      
      case ViewState.HOME:
        return (
          <HomeView 
            setView={setView} 
            selectProduct={setSelectedProduct} 
            userProfile={userProfile} 
            isDarkMode={isDarkMode} 
            toggleTheme={toggleTheme}
            language={language}
            setLanguage={setLanguage}
            soilData={soilData}
            setSoilData={setSoilData}
          />
        );
      
      case ViewState.VOICE:
        return <LiveVoice setView={setView} language={language} />;

      case ViewState.DETAILS:
        return selectedProduct ? (
          <ProductDetailView product={selectedProduct} setView={setView} />
        ) : (
          <HomeView 
            setView={setView} 
            selectProduct={setSelectedProduct} 
            userProfile={userProfile}
            isDarkMode={isDarkMode} 
            toggleTheme={toggleTheme}
            language={language}
            setLanguage={setLanguage}
            soilData={soilData}
            setSoilData={setSoilData}
          />
        );
      case ViewState.CROP_MANAGER:
        return (
            <CropManagerView 
                setView={setView} 
                userProfile={userProfile}
                language={language}
                isDarkMode={isDarkMode}
                crops={crops}
                addCrop={handleAddCrop}
                addActivity={handleAddActivity}
                deleteCrop={handleDeleteCrop}
            />
        );
      
      case ViewState.SUSTAINABILITY:
        return (
          <SustainabilityView 
            setView={setView} 
            crops={crops} 
            language={language} 
            userProfile={userProfile}
            isDarkMode={isDarkMode}
          />
        );

      case ViewState.AI_CHAT:
        return <AIChatView setView={setView} onOpenLive={() => setView(ViewState.VOICE)} language={language} />;
      case ViewState.MARKET:
        return <MarketView setView={setView} language={language} isDarkMode={isDarkMode} />;
      case ViewState.SCHEMES: 
        return <SchemesView setView={setView} language={language} />;
      case ViewState.NEWS:
        return <NewsView setView={setView} isDarkMode={isDarkMode} />;
      case ViewState.SOIL_ANALYSIS:
        return <SoilAnalysisView setView={setView} isDarkMode={isDarkMode} soilData={soilData} userProfile={userProfile} language={language} />;
      case ViewState.PROFILE:
        return (
            <ProfileView 
                setView={setView} 
                userProfile={userProfile} 
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                language={language}
                setLanguage={setLanguage}
                onLogout={handleLogout}
            />
        );
      case ViewState.NOTES:
        return <NotesView setView={setView} />;
      case ViewState.DEBUG:
        return <DebugView setView={setView} />;
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} font-sans bg-gray-100 dark:bg-gray-900 transition-colors duration-300`}>
      {activeNotification && (
          <NotificationBanner 
            title={activeNotification.title} 
            message={activeNotification.message} 
            type={activeNotification.type} 
            onClose={() => setActiveNotification(null)} 
          />
      )}

      <div className="max-w-md mx-auto bg-white dark:bg-[#0f172a] min-h-screen relative shadow-2xl overflow-hidden flex flex-col">
        {renderView()}
        
        {/* Floating Mic Button */}
        {currentView !== ViewState.LOGIN && 
         currentView !== ViewState.ONBOARDING && 
         currentView !== ViewState.AI_CHAT && 
         currentView !== ViewState.VOICE && (
            <button 
                onClick={() => setView(ViewState.VOICE)}
                className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-[#134e4a] rounded-full shadow-lg flex items-center justify-center text-white animate-bounce-slow hover:scale-110 transition-transform max-w-md mx-auto"
                style={{ right: 'max(1rem, calc(50% - 224px + 1rem))' }}
            >
                <Mic className="w-6 h-6" />
            </button>
        )}

        {/* Bottom Navigation */}
        {currentView !== ViewState.LOGIN && 
         currentView !== ViewState.ONBOARDING && 
         currentView !== ViewState.DETAILS && 
         currentView !== ViewState.NOTES && 
         currentView !== ViewState.VOICE && (
          <BottomNav currentView={currentView} setView={setView} language={language} />
        )}
      </div>
    </div>
  );
}

export default App;