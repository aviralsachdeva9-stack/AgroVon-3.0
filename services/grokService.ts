import { GoogleGenerativeAI } from "@google/generative-ai";
import { translateGeminiResponse } from './translationService';

// Get API Key from Vite environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

console.log('🔑 API Key loaded:', API_KEY ? 'Yes' : 'No');
console.log('🔑 API Key length:', API_KEY?.length || 0);

if (!API_KEY || API_KEY.includes('undefined') || API_KEY === '') {
  console.error('⚠️ Gemini API Key not configured. Check .env file.');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// 1. AI CHAT BOT (Google Gemini) with translation support
export const askAgriBot = async (prompt: string, image?: string, targetLanguage: string = 'en'): Promise<string> => {
  try {
    // Check if user is connected to internet
    if (!navigator.onLine) {
      const offlineMessage = "You are offline. Please disconnect from 'Agro-Bozo' and connect to the Internet to use the Chatbot.";
      return targetLanguage !== 'en' ? await translateGeminiResponse(offlineMessage, targetLanguage) : offlineMessage;
    }

    if (!API_KEY) {
      const errorMessage = "❌ API Key not configured. Please add your Google Gemini API Key to .env file. Get it free at: https://aistudio.google.com/app/apikey";
      return targetLanguage !== 'en' ? await translateGeminiResponse(errorMessage, targetLanguage) : errorMessage;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    let result;
    if (image) {
      // Image Analysis
      const imageParts = [{
          inlineData: {
            data: image.split(',')[1],
            mimeType: "image/jpeg",
          },
      }];
      const analysisPrompt = prompt || "Analyze this crop image";
      result = await model.generateContent([analysisPrompt, ...imageParts]);
    } else {
      // Text Chat with multilingual support
      const systemInstruction = "You are AgriSmart, an expert Indian agriculture assistant. Answer in the same language the user speaks (Hindi, Punjabi, Telugu, or English). Focus on Indian crops (Wheat, Rice, Potato, Tomato, Sugarcane). If asked about weather, assume a general context or ask for location.";
      
      // Detect language
      const isHindiPrompt = /[\u0900-\u097F]/.test(prompt);
      const isPunjabiPrompt = /[\u0A00-\u0A7F]/.test(prompt);
      const isTeluguPrompt = /[\u0C00-\u0C7F]/.test(prompt);
      
      if (isHindiPrompt) {
        const hindiSystemInstruction = "आप एग्रीस्मार्ट हैं, एक विशेषज्ञ भारतीय कृषि सहायक। सरल हिंदी में उत्तर दें। भारतीय फसलों (गेहूं, चावल, आलू, टमाटर, गन्ना) पर ध्यान दें।";
        result = await model.generateContent(`${hindiSystemInstruction}\n\nउपयोगकर्ता: ${prompt}`);
      } else if (isPunjabiPrompt) {
        const punjabiSystemInstruction = "ਤੁਸੀਂ ਐਗਰੀਸਮਾਰਟ ਹੋ, ਇੱਕ ਮਾਹਰ ਭਾਰਤੀ ਖੇਤੀਬਾੜੀ ਸਹਾਇਕ। ਸਧਾਰਨ ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ। ਭਾਰਤੀ ਫਸਲਾਂ (ਗੰਨਾ, ਕਣਕ, ਚਾਵਲ, ਆਲੂ, ਟਮਾਟਰ) 'ਤੇ ਧਿਆਨ ਦਿਓ।";
        result = await model.generateContent(`${punjabiSystemInstruction}\n\nਉਪਭੋਗਤਾ: ${prompt}`);
      } else if (isTeluguPrompt) {
        const teluguSystemInstruction = "మీరు అగ్రిస్మార్ట్, నిపుణుడైన భారతీయ వ్యవసాయ సహాయకుడు. సరళమైన తెలుగులో సమాధానం ఇవ్వండి. భారతీయ పంటలు (గోధుమ, వరి, బంగాళదుంపలు, టమాటాలు, చెరకు)పై దృష్టి పెట్టండి.";
        result = await model.generateContent(`${teluguSystemInstruction}\n\nవినియోగదారు: ${prompt}`);
      } else {
        result = await model.generateContent(`${systemInstruction}\n\nUser: ${prompt}`);
      }
    }

    let response = result.response.text();

    // If the user's preferred language is different from the detected language, translate the response
    if (targetLanguage && targetLanguage !== 'en') {
      const isHindiResponse = /[\u0900-\u097F]/.test(response);
      const isPunjabiResponse = /[\u0A00-\u0A7F]/.test(response);
      const isTeluguResponse = /[\u0C00-\u0C7F]/.test(response);
      
      // If response is not already in the target language, translate it
      if ((targetLanguage === 'hi' && !isHindiResponse) ||
          (targetLanguage === 'pa' && !isPunjabiResponse) ||
          (targetLanguage === 'te' && !isTeluguResponse)) {
        response = await translateGeminiResponse(response, targetLanguage);
      }
    }

    return response;

  } catch (error: any) {
    console.error("AI Error:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    
    let errorMessage = "I am having trouble connecting to the AgriSmart Cloud. Please check your Internet Connection or API Key.";
    
    // Better error messages based on error type
    if (error.message?.includes('API_KEY')) {
      errorMessage = "❌ Invalid API Key. Please check your .env file and ensure the Gemini API Key is correct.";
    }
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      errorMessage = "⏳ API rate limit reached. Please wait a moment and try again.";
    }
    if (error.message?.includes('403')) {
      errorMessage = "🔒 Access denied. Please check if your API Key has permission to use Gemini API.";
    }
    if (error.message?.includes('404')) {
      errorMessage = "🔍 API endpoint not found. Please check your API key and model name.";
    }
    
    // Translate error message if needed
    if (targetLanguage && targetLanguage !== 'en') {
      errorMessage = await translateGeminiResponse(errorMessage, targetLanguage);
    }
    
    return errorMessage;
  }
};

// 2. UNIVERSAL ANALYZE FUNCTION (Keeps SustainabilityView working)
// Accepts (input, language) to prevent errors
export const analyzeSoil = async (input: any, language: string = 'en'): Promise<string> => {
  
  // CASE A: Sensor Data (Object)
  if (typeof input === 'object') {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Fake delay
    const N = input.N || 0;
    const P = input.P || 0;
    const K = input.K || 0;
    const moisture = input.moisture || 0;
    return `Based on readings (N:${N}, P:${P}, K:${K}), your soil nutrition is stable. Moisture is ${moisture}%. If N is low (<20), add Urea.`;
  }

  // CASE B: Image (String)
  if (typeof input === 'string') {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return "This looks like Loamy Soil, excellent for vegetables. Add organic compost to improve moisture retention.";
  }

  return "Unable to analyze input.";
};

// 3. BROWSER VOICE (Free & Unlimited)
export const speakText = (text: string) => {
  if (!window.speechSynthesis) {
    console.error('❌ Speech synthesis not supported');
    return;
  }
  
  console.log('🎤 Attempting to speak:', text.substring(0, 50) + '...');
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  
  // Ensure voices are loaded
  const loadVoicesAndSpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    console.log('🔊 Available voices count:', voices.length);
    
    // Detect text language for voice selection
    const isHindiText = /[\u0900-\u097F]/.test(text);
    const isPunjabiText = /[\u0A00-\u0A7F]/.test(text);
    const isTeluguText = /[\u0C00-\u0C7F]/.test(text);
    
    let selectedVoice = null;
    
    if (isHindiText) {
      // Try multiple Hindi voice patterns for better quality
      selectedVoice = voices.find(v => 
        v.lang.includes('hi-IN') && v.name.toLowerCase().includes('google')
      ) || voices.find(v => 
        v.lang.includes('hi-IN')
      ) || voices.find(v => 
        v.lang.includes('hi')
      );
      if (selectedVoice) console.log('🗣️ Using Hindi voice:', selectedVoice.name);
    } else if (isPunjabiText) {
      selectedVoice = voices.find(v => 
        v.lang.includes('pa-IN')
      ) || voices.find(v => 
        v.lang.includes('pa')
      );
      if (selectedVoice) console.log('🗣️ Using Punjabi voice:', selectedVoice.name);
    } else if (isTeluguText) {
      selectedVoice = voices.find(v => 
        v.lang.includes('te-IN')
      ) || voices.find(v => 
        v.lang.includes('te')
      );
      if (selectedVoice) console.log('🗣️ Using Telugu voice:', selectedVoice.name);
    }
    
    // Fallback to clear English voices
    const englishVoice = selectedVoice || voices.find(v => 
      v.lang.includes('en-US') && v.name.toLowerCase().includes('google')
    ) || voices.find(v => 
      v.lang.includes('en-US') || 
      v.lang.includes('en-GB')
    );
    
    const defaultVoice = englishVoice || voices[0];
    
    if (englishVoice && !selectedVoice) {
      utterance.voice = englishVoice;
      console.log('🗣️ Using English voice:', englishVoice.name);
    } else if (defaultVoice) {
      utterance.voice = defaultVoice;
      console.log('🗣️ Using default voice:', defaultVoice.name);
    } else {
      console.log('🗣️ Using system default voice');
      // List available voices for debugging
      console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`).slice(0, 15));
    }

    // Add event listeners for better debugging
    utterance.onstart = () => console.log('🎤 Speech started');
    utterance.onend = () => console.log('🎤 Speech ended');
    utterance.onerror = (event) => console.error('🎤 Speech error:', event.error);

    try {
      window.speechSynthesis.speak(utterance);
      console.log('🎤 Speech command sent successfully');
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  };

  // Voices might not be loaded yet, so wait for them
  if (window.speechSynthesis.getVoices().length === 0) {
    console.log('⏳ Waiting for voices to load...');
    window.speechSynthesis.onvoiceschanged = loadVoicesAndSpeak;
  } else {
    loadVoicesAndSpeak();
  }
};

// Helper function to test available voices
export const testVoices = () => {
  if (!window.speechSynthesis) {
    console.log('❌ Speech synthesis not supported');
    return;
  }
  
  const voices = window.speechSynthesis.getVoices();
  console.log('🎤 All available voices:');
  voices.forEach((voice, index) => {
    console.log(`${index + 1}. ${voice.name} (${voice.lang}) - Local: ${voice.localService}`);
  });
  
  // Test specific language voices
  const hindiVoices = voices.filter(v => 
    v.lang.includes('hi-IN') || 
    v.lang.includes('hi')
  );
  console.log('🇮🇳 Hindi voices found:', hindiVoices.length);
  hindiVoices.forEach((voice, index) => {
    console.log(`H${index + 1}. ${voice.name} (${voice.lang}) - Google: ${voice.name.toLowerCase().includes('google')}`);
  });
  
  const punjabiVoices = voices.filter(v => 
    v.lang.includes('pa-IN') || 
    v.lang.includes('pa')
  );
  console.log('🇮🇳 Punjabi voices found:', punjabiVoices.length);
  punjabiVoices.forEach((voice, index) => {
    console.log(`P${index + 1}. ${voice.name} (${voice.lang})`);
  });
  
  const teluguVoices = voices.filter(v => 
    v.lang.includes('te-IN') || 
    v.lang.includes('te')
  );
  console.log('🇮🇳 Telugu voices found:', teluguVoices.length);
  teluguVoices.forEach((voice, index) => {
    console.log(`T${index + 1}. ${voice.name} (${voice.lang})`);
  });
  
  const englishVoices = voices.filter(v => 
    v.lang.includes('en-US') || 
    v.lang.includes('en-GB')
  );
  console.log('🇺🇸 English voices found:', englishVoices.length);
  englishVoices.forEach((voice, index) => {
    console.log(`E${index + 1}. ${voice.name} (${voice.lang}) - Google: ${voice.name.toLowerCase().includes('google')}`);
  });
};

// Initialize voices on module load
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
}

// 4. MOCK TRANSLATION
export const translateJSON = async (data: any, targetLang: string): Promise<any> => {
  return data;
};