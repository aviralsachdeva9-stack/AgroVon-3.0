import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Image as ImageIcon, Mic, X, Volume2, StopCircle, 
  User, Bot, Camera, Sparkles, Trash2, ChevronLeft 
} from 'lucide-react';
import { ViewState, ChatMessage } from '../types';
import { askAgriBot, speakText } from '../services/grokService';
import { TRANSLATIONS } from '../utils/translations';

interface AIChatViewProps {
  setView: (view: ViewState) => void;
  onOpenLive: () => void;
  language: string;
}

const AIChatView: React.FC<AIChatViewProps> = ({ setView, onOpenLive, language }) => {
  const t = TRANSLATIONS[language]?.chat || TRANSLATIONS['en'].chat;

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: t.placeholder || "Namaste! I am AgriSmart. Ask me about crops, pests, or weather.", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      image: selectedImage || undefined,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const responseText = await askAgriBot(userMsg.text, userMsg.image, language);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
      handleSpeak(responseText, botMsg.id);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (text: string, id: string) => {
    if (isSpeakingId === id) {
      window.speechSynthesis.cancel();
      setIsSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    setIsSpeakingId(id);
    speakText(text);
    const duration = (text.split(' ').length / 3) * 1000; 
    setTimeout(() => {
        if (isSpeakingId === id) setIsSpeakingId(null);
    }, duration + 1000);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    // ✅ STRICT DIMENSIONS ENFORCED HERE (448px x 785px)
    <div 
      className="flex flex-col bg-gray-50 dark:bg-[#0d1f18] text-gray-900 dark:text-white font-sans animate-fade-in relative overflow-hidden shadow-2xl mx-auto my-auto border border-gray-200 dark:border-gray-800 rounded-[30px]"
      style={{ width: '448px', height: '785px' }}
    >
      
      {/* --- 1. HEADER (Fixed Top) --- */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-white/95 dark:bg-[#1a2e28]/95 backdrop-blur-md border-b border-gray-200 dark:border-[#2d4a3e] p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setView(ViewState.HOME)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/30">
               <Sparkles className="w-5 h-5" />
             </div>
             <div>
                <h1 className="font-bold text-lg leading-tight">Agri Assistant</h1>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">Online</span>
                </div>
             </div>
          </div>
        </div>
        
        <button onClick={() => setMessages([])} className="p-2 text-gray-400 hover:text-red-500 rounded-full transition-colors">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* --- 2. MESSAGES --- */}
      {/* Increased padding-bottom to 150px to prevent messages from hiding behind the input bar */}
      <div className="flex-1 overflow-y-auto pt-24 pb-[150px] px-4 space-y-6 scrollbar-hide bg-gray-50 dark:bg-[#0d1f18]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in slide-in-from-bottom-2 duration-300`}>
            
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm mt-auto ${
                msg.role === 'user' 
                ? 'bg-green-600 border-green-500 text-white' 
                : 'bg-white dark:bg-[#1a2e28] border-gray-200 dark:border-white/10 text-green-600 dark:text-green-400'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
            </div>

            {/* Bubble */}
            <div className={`flex flex-col max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              
              {msg.image && (
                <div className="mb-2 overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 shadow-md">
                    <img src={msg.image} alt="Upload" className="w-48 h-32 object-cover" />
                </div>
              )}
              
              <div className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-green-600 text-white rounded-br-none' 
                  : 'bg-white dark:bg-[#1a2e28] text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-white/5'
              }`}>
                {msg.text}
              </div>

              {msg.role === 'model' && (
                <button 
                  onClick={() => handleSpeak(msg.text, msg.id)}
                  className={`mt-2 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all border ${
                      isSpeakingId === msg.id 
                      ? 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30' 
                      : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                >
                  {isSpeakingId === msg.id ? <><StopCircle className="w-3 h-3 animate-pulse" /> Stop</> : <><Volume2 className="w-3 h-3" /> Listen</>}
                </button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex gap-2 items-center text-gray-400 text-sm ml-12 animate-pulse mb-4">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce delay-150"></div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* --- 3. INPUT BAR (Positioned for 785px Height) --- */}
      {/* bottom-[68px] is the sweet spot for this specific height */}
      <div className="absolute bottom-[68px] left-0 right-0 p-3 z-40 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent dark:from-[#0d1f18] dark:via-[#0d1f18] pt-6">
        
        {/* Image Preview */}
        {selectedImage && (
           <div className="mb-2 ml-2 animate-in slide-in-from-bottom-2">
             <div className="relative inline-block group">
               <img src={selectedImage} alt="Selected" className="w-16 h-16 object-cover rounded-xl border-2 border-green-500 shadow-sm" />
               <button onClick={() => setSelectedImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"><X className="w-3 h-3" /></button>
             </div>
           </div>
        )}

        <div className="flex items-center gap-2">
          
          {/* Camera Button */}
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="p-3 rounded-full bg-white dark:bg-[#1a2e28] text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-white transition-colors border border-gray-200 dark:border-white/10 shadow-lg"
          >
            {selectedImage ? <ImageIcon className="w-5 h-5 text-green-500" /> : <Camera className="w-5 h-5" />}
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />

          {/* Input & Mic Container */}
          <div className="flex-1 flex items-center bg-white dark:bg-[#1a2e28] rounded-full px-4 border border-gray-200 dark:border-white/10 shadow-lg focus-within:border-green-500 transition-all h-12">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t.inputPlaceholder || "Ask about crops..."}
              className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none text-[15px]"
            />
            
            {/* ✅ MIC BUTTON INSIDE INPUT (Triggers Voice Mode) */}
            <button 
                onClick={onOpenLive}
                className="ml-2 p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-white/5 rounded-full transition-colors border-l border-gray-100 dark:border-white/5 pl-3"
                title="Voice Mode"
            >
                <Mic className="w-5 h-5" />
            </button>
          </div>

          {/* Send Button */}
          <button 
            onClick={handleSend}
            disabled={(!input.trim() && !selectedImage) || isLoading}
            className={`p-3 rounded-full flex items-center justify-center transition-all shadow-lg ${
              (!input.trim() && !selectedImage) || isLoading
                ? 'bg-gray-200 dark:bg-[#2d4a3e] text-gray-400'
                : 'bg-green-600 text-white hover:bg-green-500 hover:scale-105'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

    </div>
  );
};

export default AIChatView;