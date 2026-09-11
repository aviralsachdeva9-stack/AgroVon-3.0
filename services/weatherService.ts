// services/weatherService.ts
// Auto-detects user location via GPS → fetches real weather from OpenWeatherMap.
// Falls back to city-name lookup if location is denied.
// API key read from VITE_OPENWEATHER_API_KEY (never hardcoded).

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY as string | undefined;
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// Default fallback coordinates: New Delhi
const DEFAULT_LAT = 28.6139;
const DEFAULT_LON = 77.2090;
const DEFAULT_CITY = "New Delhi";

// ─── Language → OWM lang code ─────────────────────────────────────────────────
const OWM_LANG: Record<string, string> = {
  en: "en",
  hi: "hi",   // Hindi — returns descriptions like "हल्की बारिश"
  pa: "en",   // OWM has no Punjabi — English fallback
  pb: "en",
  te: "te",   // Telugu
};

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface WeatherData {
  temp:        number;
  condition:   string;
  humidity:    number;
  windSpeed:   number;
  pressure:    number;
  feelsLike:   number;
  description: string;
  icon:        string;
  location:    string;
  lat?:        number;
  lon?:        number;
}

export interface ForecastDay {
  date:        Date;
  temp:        number;
  condition:   string;
  icon:        string;
  description: string;
  humidity:    number;
  windSpeed:   number;
}

// ─── Get user GPS coordinates ─────────────────────────────────────────────────
/**
 * Resolves with {lat, lon} from browser GPS.
 * Rejects (→ caller falls back to city/default) if denied or unavailable.
 */
const getUserCoords = (): Promise<{ lat: number; lon: number }> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 8000, maximumAge: 5 * 60 * 1000 } // 5-min cache
    );
  });

// ─── Parse raw OWM /weather response ─────────────────────────────────────────
const parseWeather = (data: any): WeatherData => ({
  temp:        Math.round(data.main.temp),
  condition:   data.weather[0].main,
  humidity:    data.main.humidity,
  windSpeed:   data.wind.speed,
  pressure:    data.main.pressure,
  feelsLike:   Math.round(data.main.feels_like),
  description: data.weather[0].description,
  icon:        data.weather[0].icon,
  location:    data.name,
  lat:         data.coord?.lat,
  lon:         data.coord?.lon,
});

// ─── fetchWeather ─────────────────────────────────────────────────────────────
/**
 * Fetches current weather.
 *
 * Priority:
 *   1. GPS coordinates (auto-detected from browser)
 *   2. `cityOrProfile` string if provided (user's saved profile state/district)
 *   3. New Delhi as hard default
 *
 * @param cityOrProfile  Fallback city/district name (e.g. "Lucknow" or "Uttar Pradesh").
 *                       Ignored when GPS succeeds.
 * @param language       App language code for localized descriptions.
 */
export const fetchWeather = async (
  cityOrProfile: string = DEFAULT_CITY,
  language: string = "en"
): Promise<WeatherData | null> => {
  if (!API_KEY) {
    console.warn("⛅ VITE_OPENWEATHER_API_KEY not set — cannot fetch weather.");
    return null;
  }

  const lang = OWM_LANG[language] || "en";

  try {
    // ── Step 1: Try GPS ────────────────────────────────────────────────────
    let lat: number;
    let lon: number;

    try {
      const coords = await getUserCoords();
      lat = coords.lat;
      lon = coords.lon;
      console.log(`📍 GPS location acquired: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    } catch (geoErr) {
      // ── Step 2: GPS denied/failed → use city name ──────────────────────
      console.warn(`📍 Geolocation denied/unavailable — using fallback: "${cityOrProfile}"`);
      const cityRes = await fetch(
        `${BASE_URL}/weather?q=${encodeURIComponent(cityOrProfile)}&units=metric&lang=${lang}&appid=${API_KEY}`
      );
      if (!cityRes.ok) throw new Error(`OWM city lookup failed: ${cityRes.status}`);
      const cityData = await cityRes.json();
      const result = parseWeather(cityData);
      console.log(`✅ Weather loaded (city fallback): ${result.location}`);
      return result;
    }

    // ── Step 3: Fetch by coords ────────────────────────────────────────────
    const res = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&lang=${lang}&appid=${API_KEY}`
    );
    if (!res.ok) throw new Error(`OWM coords fetch failed: ${res.status}`);
    const data = await res.json();
    const result = parseWeather(data);
    console.log(`✅ Weather loaded (GPS): ${result.location} — ${result.temp}°C, ${result.description}`);
    return result;

  } catch (err) {
    // ── Step 4: Everything failed → New Delhi default ─────────────────────
    console.warn("⛅ Weather fetch failed, trying New Delhi default:", err);
    try {
      const defRes = await fetch(
        `${BASE_URL}/weather?lat=${DEFAULT_LAT}&lon=${DEFAULT_LON}&units=metric&lang=${lang}&appid=${API_KEY}`
      );
      if (!defRes.ok) throw new Error(`OWM default failed: ${defRes.status}`);
      return parseWeather(await defRes.json());
    } catch {
      console.error("⛅ All weather fetch attempts failed.");
      return null;
    }
  }
};

// ─── fetchForecast ────────────────────────────────────────────────────────────
/**
 * Fetches 5-day / 3-hour forecast, filtered to one reading per day (~noon).
 * Same GPS-first → city → default priority as fetchWeather.
 *
 * @param cityOrProfile  Fallback city name.
 * @param language       App language for localized descriptions.
 * @param lat            Optional: pre-fetched GPS lat (avoids duplicate GPS call).
 * @param lon            Optional: pre-fetched GPS lon.
 */
export const fetchForecast = async (
  cityOrProfile: string = DEFAULT_CITY,
  language: string = "en",
  lat?: number,
  lon?: number
): Promise<ForecastDay[]> => {
  if (!API_KEY) {
    console.warn("⛅ VITE_OPENWEATHER_API_KEY not set — returning mock forecast.");
    return getMockForecast();
  }

  const lang = OWM_LANG[language] || "en";

  try {
    let forecastUrl: string;

    if (lat !== undefined && lon !== undefined) {
      // Use pre-fetched coords (HomeView passes them from fetchWeather result)
      forecastUrl = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&lang=${lang}&appid=${API_KEY}`;
    } else {
      // Try GPS
      try {
        const coords = await getUserCoords();
        forecastUrl = `${BASE_URL}/forecast?lat=${coords.lat}&lon=${coords.lon}&units=metric&lang=${lang}&appid=${API_KEY}`;
      } catch {
        // GPS failed → city fallback
        forecastUrl = `${BASE_URL}/forecast?q=${encodeURIComponent(cityOrProfile)}&units=metric&lang=${lang}&appid=${API_KEY}`;
      }
    }

    const res = await fetch(forecastUrl);
    if (!res.ok) {
      console.warn(`⛅ Forecast API ${res.status} — using mock`);
      return getMockForecast();
    }

    const data = await res.json();

    // Robust daily extraction: exactly one reading per unique day
    const uniqueDays = new Map<string, any>();
    for (const reading of data.list) {
      const dateString = reading.dt_txt.split(' ')[0]; // e.g., "2026-09-10"
      
      if (!uniqueDays.has(dateString)) {
        uniqueDays.set(dateString, reading); // Take first available
      } else if (reading.dt_txt.includes("12:00:00")) {
        uniqueDays.set(dateString, reading); // Prefer noon reading if found
      }
    }

    const rows = Array.from(uniqueDays.values());

    return rows.slice(0, 5).map((day: any) => ({
      date:        new Date(day.dt * 1000),
      temp:        Math.round(day.main.temp),
      condition:   day.weather[0].main,
      icon:        day.weather[0].icon,
      description: day.weather[0].description,
      humidity:    day.main.humidity,
      windSpeed:   day.wind.speed,
    }));

  } catch (err) {
    console.error("⛅ Forecast fetch failed:", err);
    return getMockForecast();
  }
};

// ─── Mock fallback ────────────────────────────────────────────────────────────
const getMockForecast = (): ForecastDay[] => {
  const today = new Date();
  const conditions = ["Clear", "Clouds", "Rain", "Clear", "Clouds"];
  const icons      = ["01d",  "03d",    "10d",  "01d",  "04d"];
  return conditions.map((cond, i) => ({
    date:        new Date(today.getTime() + i * 86400000),
    temp:        Math.floor(Math.random() * 8) + 22,
    condition:   cond,
    icon:        icons[i],
    description: "Weather data unavailable",
    humidity:    Math.floor(Math.random() * 30) + 50,
    windSpeed:   Math.floor(Math.random() * 8) + 2,
  }));
};

// ─── Icon mapper (OWM code → Lucide icon name) ────────────────────────────────
export const getWeatherIcon = (iconCode: string, condition: string): string => {
  const map: Record<string, string> = {
    "01d": "Sun",       "01n": "Moon",
    "02d": "Cloud",     "02n": "Cloud",
    "03d": "Cloud",     "03n": "Cloud",
    "04d": "Cloud",     "04n": "Cloud",
    "09d": "CloudRain", "09n": "CloudRain",
    "10d": "CloudRain", "10n": "CloudRain",
    "11d": "CloudRain", "11n": "CloudRain",
    "13d": "Cloud",     "13n": "Cloud",
    "50d": "Wind",      "50n": "Wind",
  };
  return map[iconCode] ?? (condition === "Clear" ? "Sun" : condition === "Rain" ? "CloudRain" : "Cloud");
};