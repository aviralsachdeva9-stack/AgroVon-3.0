// services/grokService.ts — Groq API (llama-3.3-70b) for chatbot + voice

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Models CONFIRMED available for this Groq account (verified via /v1/models)
const GROQ_MODELS = [
  "openai/gpt-oss-120b",   // ✅ TESTED — 120B model, best quality
  "qwen/qwen3.8-27b",      // ✅ Good multilingual (Hindi/Punjabi/Telugu)
  "groq/compound",         // ✅ Groq native model
  "openai/gpt-oss-20b",    // ✅ Smaller, fast fallback
  "groq/compound-mini",    // ✅ Lightest fallback
];

// Fallback to Gemini key if Groq key is missing
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const hasGroq   = !!GROQ_API_KEY && GROQ_API_KEY.length > 10;
const hasGemini = !!GEMINI_API_KEY && GEMINI_API_KEY.startsWith("AIza");

console.log("🔑 Groq API Key:", hasGroq   ? `✅ Present (${GROQ_API_KEY?.slice(0,12)}...)` : "❌ Missing");
console.log("🔑 Gemini Key  :", hasGemini ? "✅ Present" : "❌ Missing/Invalid format");

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are AgriSmart, an expert Indian agriculture assistant built into the AgroVon app.
Rules:
- Answer ONLY about agriculture, farming, crops, soil, weather, pests, fertilizers, schemes, MSP, markets, or related topics.
- If the user speaks Hindi, answer in Hindi (Devanagari). If Punjabi, answer in Gurmukhi. If Telugu, answer in Telugu script. Otherwise, use English.
- Keep answers concise, practical, and easy for Indian farmers to understand.
- Mention specific Indian crop varieties, seasons (Kharif/Rabi), and government schemes where relevant.
- Do NOT answer unrelated questions. Politely redirect to farming topics.`;

// ─── GROQ CHAT (Primary) — tries model fallback chain ─────────────────────────
const askGroq = async (
  prompt: string,
  imageBase64?: string,
  language: string = "en"
): Promise<string> => {
  if (!hasGroq) throw new Error("No Groq API key");

  const langHint =
    language === "hi" ? "Respond in Hindi (Devanagari script)." :
    language === "pa" ? "Respond in Punjabi (Gurmukhi script)." :
    language === "te" ? "Respond in Telugu script." : "";

  const userContent = imageBase64
    ? `Analyze this crop/soil image and provide agricultural advice. ${langHint}`
    : `${prompt}${langHint ? "\n\n[" + langHint + "]" : ""}`;

  let lastError = "";

  // Try each model in order until one succeeds
  for (const model of GROQ_MODELS) {
    try {
      console.log(`🤖 Trying Groq model: ${model}`);
      const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user",   content: userContent },
          ],
          max_tokens: 800,
          temperature: 0.6,
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          console.log(`✅ Groq success with model: ${model}`);
          return text;
        }
      } else {
        const err = await res.json().catch(() => ({}));
        lastError = `${res.status}: ${err?.error?.message || res.statusText}`;
        console.warn(`⚠️ Model ${model} failed: ${lastError}`);
      }
    } catch (e: any) {
      lastError = e.message;
      console.warn(`⚠️ Model ${model} threw: ${e.message}`);
    }
  }

  throw new Error(`All Groq models failed. Last error: ${lastError}`);
};

// ─── GEMINI CHAT (Fallback) ───────────────────────────────────────────────────
const askGemini = async (
  prompt: string,
  imageBase64?: string,
  language: string = "en"
): Promise<string> => {
  if (!hasGemini) throw new Error("No valid Gemini API key");

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const langPrefix =
    language === "hi" ? "हिंदी में जवाब दें। " :
    language === "pa" ? "ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ। " :
    language === "te" ? "తెలుగులో సమాధానం ఇవ్వండి। " : "";

  if (imageBase64) {
    const result = await model.generateContent([
      `${SYSTEM_PROMPT}\n\n${langPrefix}Analyze this crop/soil image.`,
      { inlineData: { data: imageBase64.split(",")[1], mimeType: "image/jpeg" } },
    ]);
    return result.response.text();
  }

  const result = await model.generateContent(
    `${SYSTEM_PROMPT}\n\n${langPrefix}User: ${prompt}`
  );
  return result.response.text();
};

// ─── MAIN EXPORT: askAgriBot ──────────────────────────────────────────────────
export const askAgriBot = async (
  prompt: string,
  image?: string,
  language: string = "en"
): Promise<string> => {
  // Offline check
  if (!navigator.onLine) {
    const msgs: Record<string, string> = {
      en: "⚠️ You are offline. Please connect to the Internet to use AgriSmart.",
      hi: "⚠️ आप ऑफलाइन हैं। AgriSmart का उपयोग करने के लिए इंटरनेट से जुड़ें।",
      pa: "⚠️ ਤੁਸੀਂ ਔਫਲਾਈਨ ਹੋ। AgriSmart ਵਰਤਣ ਲਈ ਇੰਟਰਨੈੱਟ ਨਾਲ ਜੁੜੋ।",
      te: "⚠️ మీరు ఆఫ్‌లైన్‌లో ఉన్నారు. AgriSmartని ఉపయోగించడానికి ఇంటర్నెట్‌కి కనెక్ట్ అవ్వండి.",
    };
    return msgs[language] || msgs["en"];
  }

  // Try Groq first (with model fallback chain)
  if (hasGroq) {
    try {
      const response = await askGroq(prompt, image, language);
      console.log("✅ Response from Groq");
      return response;
    } catch (e: any) {
      console.warn("⚠️ All Groq models failed:", e.message);
      // Show actual Groq error to user (not a fake "no key" message)
      if (!hasGemini) {
        const groqErrMsgs: Record<string, string> = {
          en: `⚠️ AgriSmart AI is temporarily unavailable. (${e.message?.slice(0, 80)}). Please try again in a moment.`,
          hi: `⚠️ AgriSmart AI अभी उपलब्ध नहीं है। कृपया कुछ देर बाद पुनः प्रयास करें।`,
          pa: `⚠️ AgriSmart AI ਹੁਣ ਉਪਲਬਧ ਨਹੀਂ। ਕਿਰਪਾ ਕਰਕੇ ਕੁਝ ਦੇਰ ਬਾਅਦ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।`,
          te: `⚠️ AgriSmart AI ప్రస్తుతం అందుబాటులో లేదు. దయచేసి కొంత సేపు తర్వాత మళ్ళీ ప్రయత్నించండి.`,
        };
        return groqErrMsgs[language] || groqErrMsgs["en"];
      }
    }
  }

  if (hasGemini) {
    try {
      const response = await askGemini(prompt, image, language);
      console.log("✅ Response from Gemini");
      return response;
    } catch (e: any) {
      console.warn("⚠️ Gemini failed:", e.message);
      return `⚠️ AI temporarily unavailable. Error: ${e.message?.slice(0, 60)}. Please try again.`;
    }
  }

  // No keys configured at all
  const noKeyMsgs: Record<string, string> = {
    en: "❌ No AI API key configured. Please add VITE_GROQ_API_KEY to your .env file.\nGet a free key at: https://console.groq.com",
    hi: "❌ AI API Key कॉन्फ़िगर नहीं है। .env फ़ाइल में VITE_GROQ_API_KEY जोड़ें।",
    pa: "❌ AI API Key ਸੈੱਟ ਨਹੀਂ ਕੀਤੀ। .env ਫਾਈਲ ਵਿੱਚ VITE_GROQ_API_KEY ਜੋੜੋ।",
    te: "❌ AI API Key సెట్ చేయబడలేదు. .env ఫైల్‌లో VITE_GROQ_API_KEY జోడించండి.",
  };
  return noKeyMsgs[language] || noKeyMsgs["en"];
};

// ─── MOCK SOIL ANALYSIS ──────────────────────────────────────────────────────
export const analyzeSoil = async (input: any, language: string = "en"): Promise<string> => {
  await new Promise((r) => setTimeout(r, 1200));

  if (typeof input === "object") {
    const { N = 0, P = 0, K = 0, moisture = 0 } = input;
    return `Soil NPK: N=${N}, P=${P}, K=${K}. Moisture: ${moisture}%. ${
      N < 20 ? "⚠️ Low Nitrogen — add Urea." :
      P < 15 ? "⚠️ Low Phosphorus — add DAP." :
      "✅ Soil nutrition is stable."
    }`;
  }

  return "This appears to be loamy soil, excellent for vegetables. Add organic compost to improve moisture retention.";
};

// ─── BROWSER TTS ─────────────────────────────────────────────────────────────
export const speakText = (text: string): void => {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.92;
  utterance.pitch = 1.0;

  const speak = () => {
    const voices = window.speechSynthesis.getVoices();

    const isHindi   = /[\u0900-\u097F]/.test(text);
    const isPunjabi = /[\u0A00-\u0A7F]/.test(text);
    const isTelugu  = /[\u0C00-\u0C7F]/.test(text);

    let voice: SpeechSynthesisVoice | undefined;

    if (isHindi) {
      utterance.lang = "hi-IN";
      voice = voices.find(v => v.lang.startsWith("hi") && v.name.toLowerCase().includes("google"))
           || voices.find(v => v.lang.startsWith("hi"))
           || voices.find(v => v.lang.startsWith("en-IN"));
    } else if (isPunjabi) {
      utterance.lang = "pa-IN";
      voice = voices.find(v => v.lang.startsWith("pa"))
           || voices.find(v => v.lang.startsWith("hi"));
    } else if (isTelugu) {
      utterance.lang = "te-IN";
      voice = voices.find(v => v.lang.startsWith("te"));
    } else {
      utterance.lang = "en-IN";
      voice = voices.find(v => v.lang.includes("en-IN"))
           || voices.find(v => v.lang.includes("en-US") && v.name.toLowerCase().includes("google"))
           || voices.find(v => v.lang.startsWith("en"));
    }

    if (voice) utterance.voice = voice;
    utterance.onerror = (e) => console.warn("TTS error:", e.error);

    window.speechSynthesis.speak(utterance);
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = speak;
  } else {
    speak();
  }
};

// ─── MOCK TRANSLATION ─────────────────────────────────────────────────────────
export const translateJSON = async (data: any, _targetLang: string): Promise<any> => data;

// ─── VOICE DIAGNOSTICS ───────────────────────────────────────────────────────
export const testVoices = () => {
  const voices = window.speechSynthesis?.getVoices() || [];
  console.table(voices.map(v => ({ name: v.name, lang: v.lang, local: v.localService })));
};

// Preload voices
if (typeof window !== "undefined" && window.speechSynthesis) {
  window.speechSynthesis.getVoices();
}