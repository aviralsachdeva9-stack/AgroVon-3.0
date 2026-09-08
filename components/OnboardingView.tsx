import React, { useState } from 'react';
import { Sprout, MapPin, Navigation, User, Ruler } from 'lucide-react';
import { ViewState, UserProfile } from '../types';

interface OnboardingViewProps {
  setView: (view: ViewState) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  currentMobile: string;
  language: string; // ✅ Added Language Prop
}

// --- TRANSLATION DICTIONARY ---
const TEXT = {
  en: {
    title: "Setup Profile",
    subtitle: "Tell us about your farm so AI can help you better.",
    labelName: "Full Name",
    placeName: "Enter your name",
    labelLoc: "Farm Location",
    btnLoc: "Use Current Location",
    placeState: "State",
    placeDist: "District",
    labelSize: "Land Size (Acres)",
    placeSize: "e.g. 2.5",
    labelCrops: "What do you grow?",
    btnSubmit: "Start Farming"
  },
  hi: {
    title: "प्रोफाइल सेटअप",
    subtitle: "अपने खेत के बारे में बताएं ताकि AI आपकी बेहतर मदद कर सके।",
    labelName: "पूरा नाम",
    placeName: "अपना नाम दर्ज करें",
    labelLoc: "खेत का स्थान",
    btnLoc: "वर्तमान स्थान का उपयोग करें",
    placeState: "राज्य",
    placeDist: "जिला",
    labelSize: "जमीन का आकार (एकड़)",
    placeSize: "जैसे 2.5",
    labelCrops: "आप क्या उगाते हैं?",
    btnSubmit: "खेती शुरू करें"
  },
  pb: {
    title: "ਪ੍ਰੋਫਾਈਲ ਸੈੱਟਅੱਪ",
    subtitle: "ਸਾਨੂੰ ਆਪਣੇ ਖੇਤ ਬਾਰੇ ਦੱਸੋ ਤਾਂ ਜੋ AI ਤੁਹਾਡੀ ਬਿਹਤਰ ਮਦਦ ਕਰ ਸਕੇ।",
    labelName: "ਪੂਰਾ ਨਾਮ",
    placeName: "ਆਪਣਾ ਨਾਮ ਦਰਜ ਕਰੋ",
    labelLoc: "ਖੇਤ ਦਾ ਸਥਾਨ",
    btnLoc: "ਮੌਜੂਦਾ ਸਥਾਨ ਵਰਤੋ",
    placeState: "ਰਾਜ",
    placeDist: "ਜ਼ਿਲ੍ਹਾ",
    labelSize: "ਜ਼ਮੀਨ ਦਾ ਆਕਾਰ (ਏਕੜ)",
    placeSize: "ਜਿਵੇਂ 2.5",
    labelCrops: "ਤੁਸੀਂ ਕੀ ਉਗਾਉਂਦੇ ਹੋ?",
    btnSubmit: "ਖੇਤੀ ਸ਼ੁਰੂ ਕਰੋ"
  },
  te: {
    title: "ప్రొఫైల్ సెటప్",
    subtitle: "మీ పొలం గురించి మాకు చెప్పండి, తద్వారా AI మీకు బాగా సహాయపడుతుంది.",
    labelName: "పూర్తి పేరు",
    placeName: "మీ పేరు నమోదు చేయండి",
    labelLoc: "పొలం స్థానం",
    btnLoc: "ప్రస్తుత స్థానాన్ని ఉపయోగించండి",
    placeState: "రాష్ట్రం",
    placeDist: "జిల్లా",
    labelSize: "భూమి పరిమాణం (ఎకరాలు)",
    placeSize: "ఉదా. 2.5",
    labelCrops: "మీరు ఏ పంటలు పండిస్తారు?",
    btnSubmit: "వ్యవసాయం ప్రారంభించండి"
  }
};

const CROPS_LIST = [
  { id: 'wheat', name: { en: 'Wheat', hi: 'गेहूं', pb: 'ਕਣਕ', te: 'గోధుమ' } },
  { id: 'rice', name: { en: 'Rice', hi: 'चावल', pb: 'ਚੌਲ', te: 'వరి' } },
  { id: 'cotton', name: { en: 'Cotton', hi: 'कपास', pb: 'ਕਪਾਹ', te: 'పత్తి' } },
  { id: 'maize', name: { en: 'Maize', hi: 'मक्का', pb: 'ਮੱਕੀ', te: 'మొక్కజొన్న' } },
  { id: 'sugarcane', name: { en: 'Sugarcane', hi: 'गन्ना', pb: 'ਗੰਨਾ', te: 'చెరకు' } },
  { id: 'potato', name: { en: 'Potato', hi: 'आलू', pb: 'ਆਲੂ', te: 'బంగాళాదుంప' } },
  { id: 'tomato', name: { en: 'Tomato', hi: 'टमाटर', pb: 'ਟਮਾਟਰ', te: 'టమోటా' } },
  { id: 'mustard', name: { en: 'Mustard', hi: 'सरसों', pb: 'ਸਰ੍ਹੋਂ', te: 'ఆవాలు' } },
];

const OnboardingView: React.FC<OnboardingViewProps> = ({ setView, updateProfile, currentMobile, language }) => {
  const t = TEXT[language as keyof typeof TEXT] || TEXT['en'];
  
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);

  const toggleCrop = (cropId: string) => {
    if (selectedCrops.includes(cropId)) {
      setSelectedCrops(selectedCrops.filter(id => id !== cropId));
    } else {
      setSelectedCrops([...selectedCrops, cropId]);
    }
  };

  const handleLocation = () => {
    // Simulate getting location
    setState('Uttar Pradesh');
    setDistrict('Gautam Budh Nagar');
  };

  const handleSubmit = () => {
    if (name && state && district) {
      updateProfile({
        name,
        state,
        district,
        farmSize,
        crops: selectedCrops,
        mobile: currentMobile,
        language: 'en'
      });
      setView(ViewState.HOME);
    } else {
      alert("Please fill in Name and Location fields.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1f18] text-white p-6 flex flex-col justify-center animate-fade-in">
      
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
          <Sprout className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t.title}</h1>
        <p className="text-gray-400 text-sm">{t.subtitle}</p>
      </div>

      <div className="space-y-5">
        {/* Name Input */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t.labelName}</label>
          <div className="relative">
            <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.placeName}
              className="w-full bg-[#1a2e28] border border-[#2d4a3e] rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>
        </div>

        {/* Location Inputs */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.labelLoc}</label>
            <button 
              onClick={handleLocation}
              className="text-[10px] bg-green-500/10 text-green-400 px-2 py-1 rounded-md flex items-center gap-1 hover:bg-green-500/20 transition-colors"
            >
              <Navigation className="w-3 h-3" /> {t.btnLoc}
            </button>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder={t.placeState}
                className="w-full bg-[#1a2e28] border border-[#2d4a3e] rounded-xl py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors text-sm"
              />
            </div>
            <div className="relative flex-1">
              <input 
                type="text" 
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={t.placeDist}
                className="w-full bg-[#1a2e28] border border-[#2d4a3e] rounded-xl py-3 pl-4 pr-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors text-sm"
              />
            </div>
          </div>
        </div>

        {/* Farm Size */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t.labelSize}</label>
          <div className="relative">
            <Ruler className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
            <input 
              type="number" 
              value={farmSize}
              onChange={(e) => setFarmSize(e.target.value)}
              placeholder={t.placeSize}
              className="w-full bg-[#1a2e28] border border-[#2d4a3e] rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
            />
          </div>
        </div>

        {/* Crop Selection */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">{t.labelCrops}</label>
          <div className="flex flex-wrap gap-2">
            {CROPS_LIST.map((crop) => (
              <button
                key={crop.id}
                onClick={() => toggleCrop(crop.name.en)}
                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                  selectedCrops.includes(crop.name.en)
                    ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-900/50'
                    : 'bg-[#1a2e28] border-[#2d4a3e] text-gray-400 hover:border-gray-500'
                }`}
              >
                {/* Display crop name in selected language */}
                {crop.name[language as keyof typeof crop.name] || crop.name.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button 
        onClick={handleSubmit}
        className="w-full bg-green-600 text-white font-bold py-4 rounded-2xl mt-8 shadow-lg shadow-green-900/30 hover:bg-green-500 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        {t.btnSubmit} <Sprout className="w-5 h-5" />
      </button>

    </div>
  );
};

export default OnboardingView;