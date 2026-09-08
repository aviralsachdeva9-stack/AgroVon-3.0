// src/services/soilAnalysisService.ts

import { askAgriBot } from './grokService';
import { translateDataStructure } from './translationService';

export interface SoilData {
  N: number;
  P: number;
  K: number;
  moisture: number;
  temp: number;
  pH?: number;
  organicMatter?: number;
}

export interface SoilAnalysis {
  overallHealth: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  fertilizerRecommendations: {
    nitrogen: string;
    phosphorus: string;
    potassium: string;
    organic: string[];
  };
  irrigationAdvice: string;
  cropSuggestions: string[];
  warnings: string[];
  nextSteps: string[];
}

export const analyzeSoilData = async (soilData: SoilData, userProfile?: any, targetLanguage: string = 'en'): Promise<SoilAnalysis> => {
  const prompt = `
As an expert agricultural scientist, analyze this soil data and provide detailed farming recommendations:

SOIL DATA:
- Nitrogen (N): ${soilData.N} kg/ha
- Phosphorus (P): ${soilData.P} kg/ha  
- Potassium (K): ${soilData.K} kg/ha
- Moisture: ${soilData.moisture}%
- Temperature: ${soilData.temp}°C
${soilData.pH ? `- pH: ${soilData.pH}` : ''}
${soilData.organicMatter ? `- Organic Matter: ${soilData.organicMatter}%` : ''}

FARMER PROFILE:
${userProfile ? `
- Location: ${userProfile.district}, ${userProfile.state}
- Main Crop: ${userProfile.mainCrop}
- Farm Size: ${userProfile.farmSize}
` : 'General farm analysis'}

Please provide a comprehensive analysis in this JSON format:
{
  "overallHealth": "Excellent|Good|Fair|Poor",
  "recommendations": {
    "immediate": ["3 urgent actions needed this week"],
    "shortTerm": ["3 actions for next 2-4 weeks"],
    "longTerm": ["3 seasonal/long-term improvements"]
  },
  "fertilizerRecommendations": {
    "nitrogen": "specific nitrogen advice",
    "phosphorus": "specific phosphorus advice", 
    "potassium": "specific potassium advice",
    "organic": ["2-3 organic suggestions"]
  },
  "irrigationAdvice": "detailed irrigation recommendation",
  "cropSuggestions": ["3-4 suitable crops"],
  "warnings": ["2-3 potential issues to watch"],
  "nextSteps": ["3-4 actionable next steps"]
}

Consider Indian farming conditions, current season, and provide practical, actionable advice. Focus on sustainable and organic methods where possible.
`;

  try {
    const response = await askAgriBot(prompt, undefined, targetLanguage);
    
    // Try to parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      
      // Translate the analysis if target language is not English
      if (targetLanguage && targetLanguage !== 'en') {
        const translatedAnalysis = await translateDataStructure(analysis, targetLanguage);
        return translatedAnalysis;
      }
      
      return analysis;
    }
    
    // Fallback if JSON parsing fails
    const fallbackAnalysis = getFallbackAnalysis(soilData);
    if (targetLanguage && targetLanguage !== 'en') {
      return await translateDataStructure(fallbackAnalysis, targetLanguage);
    }
    return fallbackAnalysis;
  } catch (error) {
    console.error('Soil analysis error:', error);
    const fallbackAnalysis = getFallbackAnalysis(soilData);
    if (targetLanguage && targetLanguage !== 'en') {
      return await translateDataStructure(fallbackAnalysis, targetLanguage);
    }
    return fallbackAnalysis;
  }
};

const getFallbackAnalysis = (soilData: SoilData): SoilAnalysis => {
  const { N, P, K, moisture, temp } = soilData;
  
  // Simple logic for fallback analysis
  let overallHealth: SoilAnalysis['overallHealth'] = 'Fair';
  
  if (N > 40 && P > 25 && K > 150 && moisture > 20) {
    overallHealth = 'Good';
  } else if (N < 20 || P < 15 || K < 100 || moisture < 15) {
    overallHealth = 'Poor';
  } else if (N > 50 && P > 35 && K > 180 && moisture > 25) {
    overallHealth = 'Excellent';
  }

  return {
    overallHealth,
    recommendations: {
      immediate: [
        N < 30 ? 'Apply nitrogen-rich fertilizer immediately' : 'Monitor nitrogen levels',
        moisture < 20 ? 'Increase irrigation frequency' : 'Maintain current irrigation',
        P < 20 ? 'Add phosphorus supplement this week' : 'Phosphorus levels adequate'
      ],
      shortTerm: [
        'Test soil pH within 2 weeks',
        'Plan crop rotation for next season',
        'Consider organic compost application'
      ],
      longTerm: [
        'Implement drip irrigation system',
        'Develop long-term soil health plan',
        'Consider cover cropping strategies'
      ]
    },
    fertilizerRecommendations: {
      nitrogen: N < 30 ? 'Apply 50-60 kg/ha urea or equivalent' : 'Maintain current nitrogen levels',
      phosphorus: P < 25 ? 'Apply 40-50 kg/ha DAP or SSP' : 'Phosphorus levels are adequate',
      potassium: K < 150 ? 'Apply 30-40 kg/ha MOP' : 'Potassium levels are good',
      organic: [
        'Apply 5-10 tonnes/ha well-decomposed farmyard manure',
        'Consider green manure crops like dhaincha or sunhemp',
        'Use vermicompost for better nutrient availability'
      ]
    },
    irrigationAdvice: moisture < 20 
      ? 'Increase irrigation to 2-3 times per week. Consider drip irrigation for water efficiency.'
      : 'Current irrigation is adequate. Monitor soil moisture regularly.',
    cropSuggestions: [
      N > 40 ? 'Rice, wheat, or maize (high nitrogen demand crops)' : 'Legumes or pulses (nitrogen-fixing)',
      moisture > 25 ? 'Sugarcane, rice, or other water-intensive crops' : 'Millets, sorghum, or drought-resistant crops',
      'Consider mixed cropping for better soil health'
    ],
    warnings: [
      N > 60 ? 'Excessive nitrogen may cause lodging and environmental pollution' : 'Monitor for nutrient deficiencies',
      moisture > 35 ? 'Risk of waterlogging and root diseases' : 'Watch for drought stress'
    ],
    nextSteps: [
      'Conduct comprehensive soil testing',
      'Create seasonal farming calendar',
      'Consult local agricultural officer',
      'Implement integrated nutrient management'
    ]
  };
};

export const getSoilHealthColor = (health: SoilAnalysis['overallHealth']) => {
  switch (health) {
    case 'Excellent': return 'text-green-600 bg-green-50 border-green-200';
    case 'Good': return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'Fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'Poor': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const getSoilHealthIcon = (health: SoilAnalysis['overallHealth']) => {
  switch (health) {
    case 'Excellent': return '🌟';
    case 'Good': return '✅';
    case 'Fair': return '⚠️';
    case 'Poor': return '❌';
    default: return '📊';
  }
};
