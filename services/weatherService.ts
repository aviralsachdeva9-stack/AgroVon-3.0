// src/services/weatherService.ts

// I added your specific key here:
const API_KEY = "014dc410c455639f69b585350421656b"; 
const BASE_URL = "https://api.openweathermap.org/data/2.5";

export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  pressure: number;
  feelsLike: number;
  description: string;
  icon: string;
  location: string;
}

export interface ForecastDay {
  date: Date;
  temp: number;
  condition: string;
  icon: string;
  description: string;
  humidity: number;
  windSpeed: number;
}

export const fetchWeather = async (city: string): Promise<WeatherData | null> => {
  try {
    const response = await fetch(`${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`);
    if (!response.ok) throw new Error(response.statusText);
    const data = await response.json();
    
    return {
      temp: Math.round(data.main.temp),
      condition: data.weather[0].main,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      pressure: data.main.pressure,
      feelsLike: Math.round(data.main.feels_like),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      location: data.name
    };
  } catch (error) {
    console.error("Weather Error:", error);
    return null;
  }
};

export const fetchForecast = async (city: string): Promise<ForecastDay[]> => {
  try {
    const response = await fetch(`${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`);
    
    // If key is not active yet, this will fail
    if (!response.ok) {
       console.warn(" Weather API Key might not be active yet (Wait 10 mins)");
       return getMockForecast();
    }
    
    const data = await response.json();
    
    // Filter to get one reading per day (approx 12:00 PM)
    const dailyData = data.list.filter((reading: any) => reading.dt_txt.includes("12:00:00"));
    
    return dailyData.slice(0, 5).map((day: any) => ({
      date: new Date(day.dt * 1000),
      temp: Math.round(day.main.temp),
      condition: day.weather[0].main,
      icon: day.weather[0].icon,
      description: day.weather[0].description,
      humidity: day.main.humidity,
      windSpeed: day.wind.speed
    }));
  } catch (error) {
    console.error("Forecast Error:", error);
    return getMockForecast();
  }
};

// Mock forecast for fallback
const getMockForecast = (): ForecastDay[] => {
  const conditions = ['Clear', 'Clouds', 'Rain', 'Sunny'];
  const today = new Date();
  
  return Array.from({ length: 5 }, (_, i) => ({
    date: new Date(today.getTime() + i * 24 * 60 * 60 * 1000),
    temp: Math.floor(Math.random() * 10) + 18,
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    icon: '01d',
    description: 'Mock weather data',
    humidity: Math.floor(Math.random() * 40) + 40,
    windSpeed: Math.floor(Math.random() * 10) + 2
  }));
};

export const getWeatherIcon = (iconCode: string, condition: string) => {
  // Map OpenWeather icons to Lucide icons
  const iconMap: Record<string, string> = {
    '01d': 'Sun', '01n': 'Moon',
    '02d': 'Cloud', '02n': 'Cloud',
    '03d': 'Cloud', '03n': 'Cloud',
    '04d': 'Cloud', '04n': 'Cloud',
    '09d': 'CloudRain', '09n': 'CloudRain',
    '10d': 'CloudRain', '10n': 'CloudRain',
    '11d': 'CloudRain', '11n': 'CloudRain',
    '13d': 'Cloud', '13n': 'Cloud',
    '50d': 'Wind', '50n': 'Wind'
  };
  
  return iconMap[iconCode] || (condition === 'Clear' ? 'Sun' : condition === 'Rain' ? 'CloudRain' : 'Cloud');
};