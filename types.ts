export interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  description: string;
  image: string;
  category: string;
}

export interface Activity {
  id: string;
  type: 'Water' | 'Fertilize' | 'Pesticide' | 'Prune' | 'Harvest' | 'Other';
  date: string;
  note: string;
}

export interface Crop {
  id: string;
  name: string;
  type: string;
  plantingDate: string;
  expectedHarvestDate: string;
  image: string;
  activities: Activity[];
}

export interface Note {
  id: string;
  date: string;
  time: string;
  title: string;
  content: string;
  image: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  timestamp: number;
}

export interface UserProfile {
  name: string;
  mobile: string;
  state: string;
  district: string;
  mainCrop: string;
  farmSize: string;
  location: string;
  crops: string[];
  language: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Scheme {
  id: string;
  name: string;
  eligibility: string;
  amount: string;
  status: 'APPLIED' | 'APPROVED' | 'REJECTED' | 'NEW';
}

export interface NewsItem {
  id: string;
  headline: string;
  thumbnail: string;
  category: 'Policy' | 'Weather' | 'Market' | 'Technology';
  time: string;
}

export interface MandiPrice {
  id: string;
  mandiName: string;
  location: string;
  state: string;
  crop: string;
  price: number;
  change: number;
  isHigh: boolean;
  arrival: string;
  yesterday: number;
  distance: number;
  bestDayPrediction: string;
  history: number[];
}

export enum ViewState {
  LOGIN = 'LOGIN',
  ONBOARDING = 'ONBOARDING',
  HOME = 'HOME',
  DETAILS = 'DETAILS',
  NOTES = 'NOTES',
  CROP_MANAGER = 'CROP_MANAGER',
  LIVE_CHAT = 'LIVE_CHAT',
  AI_CHAT = 'AI_CHAT',
  SUSTAINABILITY = 'SUSTAINABILITY',
  MARKET = 'MARKET',
  PROFILE = 'PROFILE',
  VOICE = 'VOICE',
  SCHEMES = 'SCHEMES',
  NEWS = 'NEWS',
  SOIL_ANALYSIS = 'SOIL_ANALYSIS',
  DEBUG = 'DEBUG'
}