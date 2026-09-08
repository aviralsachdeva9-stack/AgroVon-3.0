import React, { useState } from 'react';
import { ViewState, UserProfile } from '../types';
import { Sprout, Loader2, Globe, Smartphone, Lock, ChevronDown } from 'lucide-react';
import { requestOTP, verifyOTP } from '../services/authService';
import { TRANSLATIONS } from '../utils/translations';

interface LoginViewProps {
  setView: (view: ViewState) => void;
  setUserProfile: (profile: UserProfile) => void;
  setLanguage: (lang: string) => void;
  currentLanguage: string;
  setMobile: (mobile: string) => void; 
}

const LoginView: React.FC<LoginViewProps> = ({ setView, setUserProfile, setLanguage, currentLanguage, setMobile }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE'); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const t = TRANSLATIONS[currentLanguage as keyof typeof TRANSLATIONS]?.login || TRANSLATIONS['en'].login;

  const handleGetOTP = async () => {
    // 1. Basic validation
    if (phone.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    // 2. Call the REAL Firebase function
    const success = await requestOTP(phone);
    
    setIsLoading(false);
    
    if (success) {
      // 3. Save the mobile number and move to OTP step
      setMobile(phone);
      setStep('OTP'); 
    } else {
      setError("Failed to send OTP. Please check your connection and try again.");
    }
  };

  const handleVerifyLogin = async () => {
    // 1. Validate 6-digit OTP
    if (otp.length !== 6) {
        setError("Please enter the 6-digit code.");
        return;
    }
    
    setIsLoading(true);
    setError('');

    // 2. Call the REAL Firebase verification function
    const isValid = await verifyOTP(otp);

    setIsLoading(false);

    if (isValid) {
      // 3. Go to ONBOARDING on success
      setView(ViewState.ONBOARDING); 
    } else {
      setError("Incorrect or expired OTP. Please try again."); 
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* LANGUAGE SWITCHER */}
      <div className="absolute top-6 right-6 z-50">
        <div className="relative">
           <button 
             onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} 
             className="flex items-center gap-2 bg-[#1e293b] px-4 py-2 rounded-full border border-gray-700 text-sm hover:bg-gray-700 transition-all text-gray-300"
           >
             <Globe className="w-4 h-4" />
             {currentLanguage === 'en' ? 'English' : currentLanguage === 'hi' ? 'हिंदी' : currentLanguage === 'pb' ? 'ਪੰਜਾਬੀ' : 'తెలుగు'}
             <ChevronDown className={`w-3 h-3 transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
           </button>
           
           {isLangMenuOpen && (
             <div className="absolute right-0 mt-2 w-32 bg-[#1e293b] border border-gray-700 rounded-xl shadow-xl overflow-hidden animate-fade-in z-50">
               <button onClick={() => { setLanguage('en'); setIsLangMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-700 text-sm border-b border-gray-700 text-gray-300">English</button>
               <button onClick={() => { setLanguage('hi'); setIsLangMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-700 text-sm border-b border-gray-700 text-gray-300">हिंदी</button>
               <button onClick={() => { setLanguage('pb'); setIsLangMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-700 text-sm border-b border-gray-700 text-gray-300">ਪੰਜਾਬੀ</button>
               <button onClick={() => { setLanguage('te'); setIsLangMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-gray-700 text-sm text-gray-300">తెలుగు</button>
             </div>
           )}
           
           {isLangMenuOpen && (
             <div className="fixed inset-0 z-40" onClick={() => setIsLangMenuOpen(false)}></div>
           )}
        </div>
      </div>

      {/* BACKGROUND EFFECTS */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-green-500/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]"></div>
      </div>

      {/* LOGIN CARD */}
      <div className="w-full max-w-sm bg-[#1e293b] border border-gray-700 rounded-3xl p-8 shadow-2xl z-10">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#10b981] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">{t.welcome}</h1>
          <p className="text-gray-400 text-sm mt-2">{t.subtitle}</p>
        </div>

        {/* INPUT FORM */}
        <div className="space-y-5">
          {step === 'PHONE' ? (
            <div className="space-y-2">
               <label className="text-xs font-semibold text-gray-400 ml-1 uppercase tracking-wider">{t.phoneLabel}</label>
               <div className="relative">
                 <Smartphone className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                 <input 
                   type="tel" 
                   placeholder="+91 98765 43210"
                   className="w-full bg-[#0f172a] border border-gray-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] focus:outline-none transition-all"
                   value={phone}
                   onChange={(e) => setPhone(e.target.value)}
                 />
               </div>
            </div>
          ) : (
            <div className="space-y-2 animate-fade-in">
               <label className="text-xs font-semibold text-gray-400 ml-1 uppercase tracking-wider">{t.otpLabel}</label>
               <div className="relative">
                 <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                 <input 
                   type="text" 
                   maxLength={6} // Updated to 6 for real Firebase OTP
                   placeholder="000000"
                   className="w-full bg-[#0f172a] border border-gray-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] focus:outline-none transition-all tracking-widest text-lg font-mono"
                   value={otp}
                   onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Restrict to numbers only
                 />
               </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-xs text-center font-medium">{error}</p>
            </div>
          )}

          <button 
            onClick={step === 'PHONE' ? handleGetOTP : handleVerifyLogin}
            disabled={isLoading}
            className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (step === 'PHONE' ? t.getOtp : t.verify)}
          </button>

          {step === 'OTP' && (
             <button 
                onClick={() => {
                  setStep('PHONE');
                  setOtp('');
                  setError('');
                }} 
                className="w-full text-xs text-gray-400 hover:text-[#10b981] transition-colors mt-4 font-medium"
             >
               {t.resend}
             </button>
          )}
        </div>
      </div>
      
      <p className="absolute bottom-6 text-[10px] text-gray-600 uppercase tracking-widest font-semibold">AgroVON v2.0 • Firebase Auth</p>
    </div>
  );
};

export default LoginView;