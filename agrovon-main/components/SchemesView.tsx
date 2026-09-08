import React, { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, ShieldCheck, ChevronRight, CheckCircle2, FileText, Calendar } from 'lucide-react';
import { ViewState } from '../types';
import { getSchemes, Scheme } from '../services/schemesService';

interface SchemesViewProps {
  setView: (view: ViewState) => void;
  language: string;
}

// --- 1. UI TRANSLATIONS (Static Text) ---
const UI_TEXT = {
  en: {
    header: "Govt Schemes",
    detailsHeader: "Scheme Details",
    loading: "Loading Schemes...",
    benefit: "Benefit",
    desc: "Description",
    eligibility: "Eligibility",
    docs: "Required Docs",
    apply: "Apply on Official Website",
    due: "Due:",
    provider: "Provider",
    viewBtn: "View Details"
  },
  hi: {
    header: "सरकारी योजनाएं",
    detailsHeader: "योजना विवरण",
    loading: "योजनाएं लोड हो रही हैं...",
    benefit: "लाभ",
    desc: "विवरण",
    eligibility: "पात्रता",
    docs: "आवश्यक दस्तावेज",
    apply: "आधिकारिक वेबसाइट पर आवेदन करें",
    due: "अंतिम तिथि:",
    provider: "प्रदाता",
    viewBtn: "विवरण देखें"
  },
  pb: {
    header: "ਸਰਕਾਰੀ ਸਕੀਮਾਂ",
    detailsHeader: "ਸਕੀਮ ਦੇ ਵੇਰਵੇ",
    loading: "ਸਕੀਮਾਂ ਲੋਡ ਹੋ ਰਹੀਆਂ ਹਨ...",
    benefit: "ਲਾਭ",
    desc: "ਵੇਰਵਾ",
    eligibility: "ਯੋਗਤਾ",
    docs: "ਲੋੜੀਂਦੇ ਦਸਤਾਵੇਜ਼",
    apply: "ਅਧਿਕਾਰਤ ਵੈੱਬਸਾਈਟ 'ਤੇ ਅਪਲਾਈ ਕਰੋ",
    due: "ਆਖਰੀ ਮਿਤੀ:",
    provider: "ਪ੍ਰਦਾਤਾ",
    viewBtn: "ਵੇਰਵੇ ਵੇਖੋ"
  },
  te: {
    header: "ప్రభుత్వ పథకాలు",
    detailsHeader: "పథకం వివరాలు",
    loading: "పథకాలు లోడ్ అవుతున్నాయి...",
    benefit: "లాభం",
    desc: "వివరణ",
    eligibility: "అర్హత",
    docs: "అవసరమైన పత్రాలు",
    apply: "అధికారిక వెబ్‌సైట్‌లో దరఖాస్తు చేయండి",
    due: "గడువు:",
    provider: "ప్రొవైడర్",
    viewBtn: "వివరాలను వీక్షించండి"
  }
};

// --- 2. DATA TRANSLATIONS (The Schemes Content) ---
// Keys correspond to Scheme IDs from schemesService.ts
const SCHEME_TRANSLATIONS: any = {
  "1": { // PM Kisan
    hi: { name: "पीएम किसान सम्मान निधि", desc: "सभी भूमिधारक किसान परिवारों को प्रति वर्ष ₹6,000 की वित्तीय सहायता, तीन समान किस्तों में देय।", benefit: "₹6,000 / वर्ष" },
    pb: { name: "ਪੀਐਮ ਕਿਸਾਨ ਸਨਮਾਨ ਨਿਧੀ", desc: "ਸਾਰੇ ਜ਼ਮੀਨ ਮਾਲਕ ਕਿਸਾਨ ਪਰਿਵਾਰਾਂ ਨੂੰ ਪ੍ਰਤੀ ਸਾਲ ₹6,000 ਦੀ ਵਿੱਤੀ ਸਹਾਇਤਾ।", benefit: "₹6,000 / ਸਾਲ" },
    te: { name: "పీఎం కిసాన్ సమ్మాన్ నిధి", desc: "భూమి ఉన్న రైతు కుటుంబాలకు సంవత్సరానికి ₹6,000 ఆర్థిక సహాయం.", benefit: "₹6,000 / సంవత్సరం" }
  },
  "2": { // Fasal Bima
    hi: { name: "प्रधानमंत्री फसल बीमा योजना", desc: "अनपेक्षित घटनाओं से फसल के नुकसान/क्षति से पीड़ित किसानों को वित्तीय सहायता प्रदान करने वाली फसल बीमा योजना।", benefit: "फसल बीमा कवर" },
    pb: { name: "ਪ੍ਰਧਾਨ ਮੰਤਰੀ ਫਸਲ ਬੀਮਾ ਯੋਜਨਾ", desc: "ਫਸਲਾਂ ਦੇ ਨੁਕਸਾਨ ਲਈ ਵਿੱਤੀ ਸਹਾਇਤਾ ਪ੍ਰਦਾਨ ਕਰਨ ਵਾਲੀ ਫਸਲ ਬੀਮਾ ਯੋਜਨਾ।", benefit: "ਫਸਲ ਬੀਮਾ ਕਵਰ" },
    te: { name: "ప్రధాన మంత్రి ఫసల్ బీమా యోజన", desc: "ఊహించని సంఘటనల వల్ల పంట నష్టపోయిన రైతులకు ఆర్థిక సహాయం.", benefit: "పంట బీమా" }
  },
  "3": { // KCC
    hi: { name: "किसान क्रेडिट कार्ड (KCC)", desc: "बैंकिंग प्रणाली से किसानों को सरल और लचीली प्रक्रिया के साथ पर्याप्त और समय पर ऋण सहायता प्रदान करता है।", benefit: "कम ब्याज ऋण (4%)" },
    pb: { name: "ਕਿਸਾਨ ਕ੍ਰੈਡਿਟ ਕਾਰਡ (KCC)", desc: "ਕਿਸਾਨਾਂ ਨੂੰ ਆਸਾਨ ਪ੍ਰਕਿਰਿਆ ਰਾਹੀਂ ਸਮੇਂ ਸਿਰ ਕਰਜ਼ਾ ਸਹਾਇਤਾ ਪ੍ਰਦਾਨ ਕਰਦਾ ਹੈ।", benefit: "ਘੱਟ ਵਿਆਜ ਕਰਜ਼ਾ (4%)" },
    te: { name: "కిసాన్ క్రెడిట్ కార్డ్ (KCC)", desc: "సరళీకృత ప్రక్రియతో రైతులకు తగినంత మరియు సమయానుకూల రుణ మద్దతు.", benefit: "తక్కువ వడ్డీ రుణం (4%)" }
  },
  "4": { // UP Machinery
    hi: { name: "यूपी कृषि यंत्र सब्सिडी", desc: "मशीनीकरण को बढ़ावा देने के लिए रोटावेटर, ट्रैक्टर और सोलर पंप जैसे कृषि उपकरणों की खरीद पर सब्सिडी।", benefit: "50% तक सब्सिडी" },
    pb: { name: "ਯੂਪੀ ਖੇਤੀਬਾੜੀ ਮਸ਼ੀਨਰੀ ਸਬਸਿਡੀ", desc: "ਖੇਤੀਬਾੜੀ ਸੰਦਾਂ ਜਿਵੇਂ ਕਿ ਟ੍ਰੈਕਟਰ ਅਤੇ ਸੋਲਰ ਪੰਪਾਂ ਦੀ ਖਰੀਦ 'ਤੇ ਸਬਸਿਡੀ।", benefit: "50% ਤੱਕ ਸਬਸਿਡੀ" },
    te: { name: "యుపి వ్యవసాయ యంత్రాల రాయితీ", desc: "యాంత్రీకరణను ప్రోత్సహించడానికి వ్యవసాయ పరికరాల కొనుగోలుపై రాయితీ.", benefit: "50% వరకు రాయితీ" }
  },
  "5": { // Soil Health
    hi: { name: "मृदा स्वास्थ्य कार्ड योजना", desc: "सरकार आपके खेत की मिट्टी में पोषक तत्वों की स्थिति और उर्वरकों की खुराक पर सलाह देने वाला कार्ड प्रदान करती है।", benefit: "मुफ्त मिट्टी परीक्षण" },
    pb: { name: "ਮਿੱਟੀ ਸਿਹਤ ਕਾਰਡ ਸਕੀਮ", desc: "ਸਰਕਾਰ ਤੁਹਾਡੀ ਮਿੱਟੀ ਦੀ ਸਿਹਤ ਅਤੇ ਖਾਦਾਂ ਦੀ ਵਰਤੋਂ ਬਾਰੇ ਸਲਾਹ ਦਿੰਦੀ ਹੈ।", benefit: "ਮੁਫਤ ਮਿੱਟੀ ਪਰਖ" },
    te: { name: "సాయిల్ హెల్త్ కార్డ్ స్కీమ్", desc: "మీ పొలం యొక్క మట్టి పోషక స్థితిని తెలిపే కార్డును ప్రభుత్వం అందిస్తుంది.", benefit: "ఉచిత మట్టి పరీక్ష" }
  }
};

const SchemesView: React.FC<SchemesViewProps> = ({ setView, language }) => {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(true);

  // Get UI Strings based on Language
  const ui = UI_TEXT[language as keyof typeof UI_TEXT] || UI_TEXT['en'];

  useEffect(() => {
    loadSchemes();
  }, []);

  const loadSchemes = async () => {
    setLoading(true);
    const data = await getSchemes();
    setSchemes(data);
    setLoading(false);
  };

  const handleApply = (link: string) => {
    window.open(link, '_blank');
  };

  // Helper to get translated content for a specific scheme
  const getLocalizedSchemeContent = (scheme: Scheme) => {
    const translation = SCHEME_TRANSLATIONS[scheme.id]?.[language];
    return {
      name: translation?.name || scheme.name,
      description: translation?.desc || scheme.description,
      benefit: translation?.benefit || scheme.benefit
    };
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0d1f18] text-white animate-fade-in pb-24">
      
      {/* HEADER */}
      <div className="flex justify-between items-center p-6 bg-[#1a2e28] border-b border-[#2d4a3e] shadow-lg">
        <button onClick={() => selectedScheme ? setSelectedScheme(null) : setView(ViewState.HOME)} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">{selectedScheme ? ui.detailsHeader : ui.header}</h1>
        <div className="w-9"></div> {/* Spacer for alignment */}
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-4">
        
        {loading ? (
          <div className="text-center py-20 text-gray-400">{ui.loading}</div>
        ) : selectedScheme ? (
          
          /* --- DETAIL VIEW (Clickable Feature) --- */
          <div className="animate-slide-up">
            {/* Logic to get translated details */}
            {(() => {
               const content = getLocalizedSchemeContent(selectedScheme);
               return (
                <div className="bg-[#1a2e28] rounded-3xl p-6 border border-[#2d4a3e] shadow-lg">
                  <div className="flex items-start justify-between mb-4">
                     <div>
                        <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded-full uppercase tracking-wider">{selectedScheme.provider}</span>
                        <h2 className="text-2xl font-bold mt-2 leading-tight">{content.name}</h2>
                     </div>
                     <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                        <ShieldCheck className="w-8 h-8 text-green-500" />
                     </div>
                  </div>
                  
                  <div className="space-y-6">
                     <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">{ui.benefit}</h3>
                        <p className="text-xl font-bold text-yellow-400">{content.benefit}</p>
                     </div>

                     <div>
                        <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">{ui.desc}</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">{content.description}</p>
                     </div>

                     <div className="bg-[#0d1f18] rounded-xl p-4 border border-[#2d4a3e]">
                        <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                           <CheckCircle2 className="w-4 h-4 text-blue-400" /> {ui.eligibility}
                        </h3>
                        <ul className="space-y-2">
                           {selectedScheme.eligibility.map((item, idx) => (
                              <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                                 <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mt-1.5 shrink-0"></span> {item}
                              </li>
                           ))}
                        </ul>
                     </div>

                     <div className="bg-[#0d1f18] rounded-xl p-4 border border-[#2d4a3e]">
                        <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                           <FileText className="w-4 h-4 text-purple-400" /> {ui.docs}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                           {selectedScheme.documents.map((doc, idx) => (
                              <span key={idx} className="text-xs bg-white/10 px-2 py-1 rounded-md text-gray-300 border border-white/5">
                                 {doc}
                              </span>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* APPLY NOW BUTTON */}
                  <button 
                     onClick={() => handleApply(selectedScheme.officialLink)}
                     className="w-full mt-8 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                     {ui.apply} <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
               );
            })()}
          </div>

        ) : (

          /* --- LIST VIEW --- */
          <div className="space-y-3">
             {schemes.map((scheme) => {
                const content = getLocalizedSchemeContent(scheme);
                return (
                  <div 
                    key={scheme.id} 
                    onClick={() => setSelectedScheme(scheme)}
                    className="bg-[#1a2e28] p-5 rounded-2xl border border-[#2d4a3e] active:scale-[0.98] transition-transform flex justify-between items-center"
                  >
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${scheme.category === 'Insurance' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                              {scheme.category.toUpperCase()}
                           </span>
                           {scheme.deadline && (
                              <span className="text-[10px] flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                                 <Calendar className="w-3 h-3" /> {ui.due} {scheme.deadline}
                              </span>
                           )}
                        </div>
                        <h3 className="font-bold text-white text-lg">{content.name}</h3>
                        <p className="text-xs text-green-400 font-bold mt-1">{content.benefit}</p>
                     </div>
                     <div className="bg-[#0d1f18] p-2 rounded-full border border-[#2d4a3e]">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                     </div>
                  </div>
                );
             })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemesView;