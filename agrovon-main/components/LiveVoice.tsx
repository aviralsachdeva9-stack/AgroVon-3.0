import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, Loader2, StopCircle, RefreshCw } from 'lucide-react';
import { ViewState } from '../types';
import { askAgriBot } from '../services/grokService';

interface LiveVoiceProps {
  setView: (view: ViewState) => void;
  language: string;
}

const LiveVoice: React.FC<LiveVoiceProps> = ({ setView, language }) => {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState("Initializing...");
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // --- DEBUG STATE (To see what is happening) ---
  const [debugInfo, setDebugInfo] = useState("Loading voices...");

  const recognitionRef = useRef<any>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // --- 1. AGGRESSIVE VOICE LOADER ---
  useEffect(() => {
    let attempts = 0;
    
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voicesRef.current = voices;
        setDebugInfo(`Ready. Found ${voices.length} voices.`);
        return true;
      }
      return false;
    };

    // Try immediately
    if (!loadVoices()) {
      // If failed, keep trying every 500ms for 5 seconds
      const interval = setInterval(() => {
        attempts++;
        if (loadVoices() || attempts > 10) {
          clearInterval(interval);
          if (voicesRef.current.length === 0) setDebugInfo("Error: No voices found on device.");
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, []);

  // --- 2. SPEAK FUNCTION ---
  const speakResponse = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Re-fetch voices at speak-time to avoid the race condition where
    // voicesRef was still empty when the component mounted.
    const voices = window.speechSynthesis.getVoices().length > 0
      ? window.speechSynthesis.getVoices()
      : voicesRef.current;

    let selectedVoice: SpeechSynthesisVoice | undefined;
    let targetLang = 'en-US';

    if (language === 'hi') {
      targetLang = 'hi-IN';
      // Use includes() — catches 'hi-IN', 'hi-IN-x-hix-network', 'Microsoft Swara - Hindi (India)', etc.
      selectedVoice =
        voices.find(v => v.lang.startsWith('hi') && v.name.toLowerCase().includes('google')) ||
        voices.find(v => v.lang.startsWith('hi')) ||
        voices.find(v => v.name.toLowerCase().includes('hindi')) ||
        voices.find(v => v.lang.startsWith('en-IN'));            // Indian English as last resort
    } else if (language === 'pb' || language === 'pa') {
      targetLang = 'pa-IN';
      selectedVoice =
        voices.find(v => v.lang.startsWith('pa')) ||
        voices.find(v => v.name.toLowerCase().includes('punjabi')) ||
        voices.find(v => v.lang.startsWith('hi'));               // Gurmukhi → Hindi fallback
    } else if (language === 'te') {
      targetLang = 'te-IN';
      selectedVoice =
        voices.find(v => v.lang.startsWith('te')) ||
        voices.find(v => v.name.toLowerCase().includes('telugu'));
    }

    // Always set utterance.lang so the browser knows which phoneme rules to apply,
    // even when we fall back to a generic voice.
    utterance.lang = targetLang;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      setDebugInfo(`Voice: ${selectedVoice.name} (${selectedVoice.lang})`);
    } else {
      // Log all available voices to help diagnose missing language support
      const available = voices.map(v => `${v.name}|${v.lang}`).join(', ');
      setDebugInfo(`No ${targetLang} voice. Available: ${available.slice(0, 120)}`);
      console.warn(`[TTS] No voice for ${targetLang}. Available:`, voices.map(v => `${v.name} (${v.lang})`));
    }

    utterance.rate = 0.88;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setStatus(getGreeting());
    };
    utterance.onerror = (e) => {
      console.error('[TTS] Error:', e.error);
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    setStatus('Speaking...');
    window.speechSynthesis.speak(utterance);
  };


  // --- 3. MIC SETUP ---
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setStatus("Browser not supported");
      setHasError(true);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    
    // Force Punjabi Code
    let langCode = 'en-US';
    if (language === 'hi') langCode = 'hi-IN';
    if (language === 'pb' || language === 'pa') langCode = 'pa-IN'; 
    if (language === 'te') langCode = 'te-IN';
    
    recognitionRef.current.lang = langCode;

    recognitionRef.current.onstart = () => { setIsListening(true); setHasError(false); setStatus("Listening..."); };
    recognitionRef.current.onend = () => { setIsListening(false); };
    
    recognitionRef.current.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setStatus("Thinking...");
      
      try {
        const response = await askAgriBot(text, undefined, language);
        
        setAiResponse(response);
        speakResponse(response);
      } catch (e) {
        setStatus("AI Error");
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Mic Error:", event.error);
      setHasError(true);
      
      // Auto-fix for Punjabi Mic: If it fails, switch to Hindi mic immediately
      if (event.error === 'no-speech' && (language === 'pb' || language === 'pa')) {
          setDebugInfo("Punjabi Mic failed, retrying with Hindi...");
          recognitionRef.current.lang = 'hi-IN';
      }
      
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      window.speechSynthesis.cancel();
    };
  }, [language]);

  const toggleListening = () => {
    if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
    }
    if (isListening) recognitionRef.current?.stop();
    else {
        setTranscript("");
        setAiResponse("");
        setHasError(false);
        try { recognitionRef.current?.start(); } catch (e) { setStatus("Mic Error"); }
    }
  };

  const getGreeting = () => {
    if (language === 'hi') return 'नमस्ते, आप कैसे हैं?';
    if (language === 'pb' || language === 'pa') return 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?';
    if (language === 'te') return 'నమస్కారం, నేను మీకు ఎలా సహాయపడగలను?';
    return 'How can I help you?';
  };

  return (
    <div className="fixed inset-0 bg-[#0f172a] text-white z-50 flex flex-col items-center justify-center p-6 touch-none">
      
      <button 
        onClick={() => { window.speechSynthesis.cancel(); setView(ViewState.HOME); }} 
        className="fixed top-6 right-6 z-[100] p-4 bg-gray-800/80 rounded-full text-white hover:bg-red-500 transition-colors shadow-lg cursor-pointer border border-white/20"
      >
        <X className="w-8 h-8" />
      </button>

      {/* --- DEBUG BAR (CRITICAL) --- */}
      <div className="absolute top-6 left-6 z-[60] flex flex-col items-start gap-1">
         <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-full border border-green-500/30">
            <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className="text-xs font-bold text-green-400 uppercase tracking-wider">AgriVoice AI</span>
         </div>
         <span className="text-[10px] text-yellow-400 font-mono bg-black/40 px-2 py-1 rounded ml-1">
            {debugInfo}
         </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg text-center space-y-8 z-[50]">
        <div className="space-y-4 min-h-[120px]">
           {transcript && <p className="text-xl font-medium text-gray-300 animate-slide-up">"{transcript}"</p>}
           {aiResponse && <p className="text-2xl font-bold text-green-400 leading-relaxed animate-fade-in">{aiResponse}</p>}
           {!transcript && !aiResponse && <p className="text-3xl font-bold text-gray-500">{getGreeting()}</p>}
        </div>

        <div className="relative">
            {isListening && !hasError && (
                <>
                  <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
                  <div className="absolute inset-[-20px] bg-red-500/10 rounded-full animate-pulse"></div>
                </>
            )}
            <button
              onClick={toggleListening}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 ${
                hasError ? 'bg-gray-700 border-2 border-red-500' : isSpeaking ? 'bg-blue-600' : isListening ? 'bg-red-600' : 'bg-green-600'
              }`}
            >
              {hasError ? <RefreshCw className="w-8 h-8 text-red-500" /> : isSpeaking ? <StopCircle className="w-10 h-10 text-white" /> : isListening ? <Loader2 className="w-10 h-10 text-white animate-spin" /> : <Mic className="w-10 h-10 text-white" />}
            </button>
        </div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{isSpeaking ? "SPEAKING..." : status}</p>
      </div>
    </div>
  );
};

export default LiveVoice;