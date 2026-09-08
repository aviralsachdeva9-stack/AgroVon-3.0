import { GoogleGenerativeAI } from "@google/generative-ai";

// Get API Key from Vite environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY || API_KEY.includes('undefined') || API_KEY === '') {
  console.error('⚠️ Gemini API Key not configured for translation service.');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Language mapping for Gemini
const languageMap = {
  'en': 'English',
  'hi': 'Hindi',
  'pa': 'Punjabi (Gurmukhi script)',
  'te': 'Telugu'
};

// Translation service using Gemini
export const translateWithGemini = async (text: string, targetLanguage: string): Promise<string> => {
  try {
    if (!API_KEY) {
      console.warn('Translation API key not available, returning original text');
      return text;
    }

    if (targetLanguage === 'en' || !text || text.trim() === '') {
      return text;
    }

    const targetLangName = languageMap[targetLanguage as keyof typeof languageMap];
    if (!targetLangName) {
      console.warn('Unsupported target language:', targetLanguage);
      return text;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const translationPrompt = `Translate the following text to ${targetLangName}. Keep the meaning exactly the same. Use natural, everyday language that farmers would understand. Do not add any explanations or notes, just return the translated text:

Text to translate: "${text}"

Only return the translated text, nothing else.`;

    const result = await model.generateContent(translationPrompt);
    const translatedText = result.response.text().trim();
    
    return translatedText || text;

  } catch (error: any) {
    console.error('Translation error:', error);
    
    // Fallback to original text on error
    if (error.message?.includes('429') || error.message?.includes('quota')) {
      console.warn('Translation API rate limit reached, using original text');
    }
    
    return text;
  }
};

// Translate entire objects/arrays recursively
export const translateDataStructure = async (data: any, targetLanguage: string): Promise<any> => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    const translatedArray = await Promise.all(
      data.map(item => translateDataStructure(item, targetLanguage))
    );
    return translatedArray;
  }

  // Handle objects
  const translatedObject: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Only translate user-facing strings, not technical keys or codes
      if (shouldTranslateString(key, value)) {
        translatedObject[key] = await translateWithGemini(value, targetLanguage);
      } else {
        translatedObject[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      translatedObject[key] = await translateDataStructure(value, targetLanguage);
    } else {
      translatedObject[key] = value;
    }
  }

  return translatedObject;
};

// Determine if a string should be translated
const shouldTranslateString = (key: string, value: string): boolean => {
  // Don't translate if it's likely technical data
  const technicalKeys = ['id', 'code', 'status', 'type', 'url', 'timestamp', 'date', 'price', 'amount', 'value'];
  const technicalPatterns = [/^\d+$/, /^https?:\/\//, /^\d{4}-\d{2}-\d{2}/, /₹\d+/, /\d+%$/];
  
  // Don't translate if key suggests technical data
  if (technicalKeys.includes(key.toLowerCase())) {
    return false;
  }
  
  // Don't translate if value matches technical patterns
  for (const pattern of technicalPatterns) {
    if (pattern.test(value)) {
      return false;
    }
  }
  
  // Don't translate very short strings (likely labels or codes)
  if (value.length < 3) {
    return false;
  }
  
  // Translate if it contains letters and is likely user-facing content
  return /[a-zA-Z]/.test(value);
};

// Translate Gemini AI responses specifically
export const translateGeminiResponse = async (response: string, targetLanguage: string): Promise<string> => {
  if (!response || targetLanguage === 'en') {
    return response;
  }

  try {
    const targetLangName = languageMap[targetLanguage as keyof typeof languageMap];
    if (!targetLangName) {
      return response;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const translationPrompt = `The following is an AI response about agriculture. Translate it to ${targetLangName} while maintaining:
1. The same tone and expertise level
2. All technical agricultural terms (keep them in English if no common translation exists)
3. The same structure and formatting
4. Any specific recommendations or advice

Original response: "${response}"

Translated response:`;

    const result = await model.generateContent(translationPrompt);
    const translatedResponse = result.response.text().trim();
    
    return translatedResponse || response;

  } catch (error) {
    console.error('Error translating Gemini response:', error);
    return response;
  }
};

// Batch translation for multiple strings
export const batchTranslate = async (texts: string[], targetLanguage: string): Promise<string[]> => {
  try {
    const targetLangName = languageMap[targetLanguage as keyof typeof languageMap];
    if (!targetLangName || targetLanguage === 'en') {
      return texts;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Create a batch translation prompt
    const textsList = texts.map((text, index) => `${index + 1}. "${text}"`).join('\n');
    
    const batchPrompt = `Translate the following numbered list of texts to ${targetLangName}. Maintain the same numbering and translate each text accurately. Keep the meaning exactly the same:

${textsList}

Return only the translated texts with the same numbering:`;

    const result = await model.generateContent(batchPrompt);
    const translatedBatch = result.response.text().trim();
    
    // Parse the translated batch back into an array
    const lines = translatedBatch.split('\n').filter(line => line.trim());
    const translatedTexts = lines.map(line => {
      const match = line.match(/^\d+\.\s*(.+)$/);
      return match ? match[1] : line;
    });
    
    // Ensure we return the same number of texts
    while (translatedTexts.length < texts.length) {
      translatedTexts.push(texts[translatedTexts.length]);
    }
    
    return translatedTexts.slice(0, texts.length);

  } catch (error) {
    console.error('Batch translation error:', error);
    return texts;
  }
};

// Get supported languages
export const getSupportedLanguages = () => {
  return Object.keys(languageMap);
};

// Check if translation is available for a language
export const isTranslationSupported = (language: string): boolean => {
  return language in languageMap;
};
