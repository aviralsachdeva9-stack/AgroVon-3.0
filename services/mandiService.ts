// services/mandiService.ts
// Fetches real Mandi prices from api.data.gov.in (OGD platform).
// Auto-detects user location via GPS → Nominatim reverse geocode → state/district.
// NO mock/dummy data. If API fails → returns empty array with a clear error reason.

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const GOVT_API_KEY   = import.meta.env.VITE_GOVT_API_KEY as string | undefined;
const OGD_RESOURCE   = "9ef84268-d588-465a-a308-a864a43d0070";
const OGD_BASE       = `https://api.data.gov.in/resource/${OGD_RESOURCE}`;
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/reverse";

// ─── TYPES ───────────────────────────────────────────────────────────────────
export interface MandiRecord {
  id:           string;
  state:        string;
  district:     string;
  market:       string;
  commodity:    string;
  variety:      string;
  min_price:    number;
  max_price:    number;
  modal_price:  number;
  arrival_date: string;
}

export interface MandiResult {
  records:            MandiRecord[];
  state:              string;
  district:           string;
  isFallback:         boolean;   // true = district empty; state+crop data shown
  isFallbackAllCrops: boolean;   // true = state+crop also empty; all-crop state data shown
  error?:             string;    // set only on auth/network failure
}

// ─── COMMODITY ALIAS MAP ──────────────────────────────────────────────────────
// OGD stores crops with variant names like "Wheat(Lokwan)", "Rice(Paddy)(Dhan)".
// We try the canonical name first, then these aliases if 0 records are returned.
const COMMODITY_ALIASES: Record<string, string[]> = {
  Wheat:    ["Wheat(Lokwan)", "Wheat(Dara)", "Wheat(Durum)(Dara)", "Wheat Samba"],
  Rice:     ["Rice(Paddy)(Dhan)", "Rice", "Paddy", "Paddy(Basmati)", "Paddy(Common)"],
  Potato:   ["Potato", "Potato(Desi)"],
  Tomato:   ["Tomato", "Tomato(Desi)", "Tomato(Hybrid)"],
  Onion:    ["Onion", "Onion (Bulb)", "Onion Green"],
  Mustard:  ["Mustard", "Rapeseed (Canola)", "Mustard Seeds(Black)", "Mustard Oil"],
  Cotton:   ["Cotton", "Cotton(Ginned)", "Cotton Seed", "Cotton-Seed"],
  Maize:    ["Maize", "Maize (Yellow)"],
  Soyabean: ["Soyabean", "Soyabean (Yellow)"],
  Sugarcane:["Sugarcane"],
  Bajra:    ["Bajra(Pearl Millet/Cumbu)", "Bajra"],
  Jowar:    ["Jowar(Sorghum)", "Jowar"],
  Gram:     ["Gram", "Bengal Gram(Gram)(Whole)", "Desi Chana"],
  Arhar:    ["Arhar (Tur/Red Gram)(Whole)", "Arhar Dal(Tur Dal)"],
};

/** Returns all alias names to try for a given commodity display name. */
const getCommodityVariants = (commodity: string): string[] => {
  const aliases = COMMODITY_ALIASES[commodity] ?? [];
  // Deduplicate: canonical name + aliases, canonical first
  const all = [commodity, ...aliases];
  return [...new Set(all)];
};

// ─── GEOLOCATION ─────────────────────────────────────────────────────────────
/** Resolves GPS coords. Rejects if denied / unavailable. */
const getCoords = (): Promise<{ lat: number; lon: number }> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("Geolocation not supported")); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (e) => reject(e),
      { timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  });

// ─── NOMINATIM REVERSE GEOCODE ───────────────────────────────────────────────
interface GeoLocation { state: string; district: string; }

/**
 * Uses OpenStreetMap Nominatim to convert GPS coords to state + district.
 * Nominatim is free, no API key needed. User-agent required by their ToS.
 */
const reverseGeocode = async (lat: number, lon: number): Promise<GeoLocation> => {
  const url = `${NOMINATIM_BASE}?lat=${lat}&lon=${lon}&format=json&zoom=10&addressdetails=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "AgroVon-AgriApp/1.0 (agriculture app)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = await res.json();
  const addr = data.address || {};

  // Nominatim returns different keys depending on admin level — try all variants
  const district =
    addr.state_district ||
    addr.county         ||
    addr.city_district  ||
    addr.district       ||
    addr.city           ||
    addr.town           ||
    addr.village        || "";

  const state = addr.state || "";

  if (!state || !district) throw new Error("Nominatim returned incomplete address");

  console.log(`📍 Reverse geocode: ${district}, ${state}`);
  return { state, district };
};

// ─── OGD API CALL ─────────────────────────────────────────────────────────────
/**
 * Calls api.data.gov.in with correct `api-key` param (NOT Authorization header).
 * Returns raw records array or throws.
 */
const callOGD = async (
  state: string,
  district: string,
  commodity: string
): Promise<MandiRecord[]> => {
  if (!GOVT_API_KEY) throw new Error("VITE_GOVT_API_KEY not set in .env.local");

  let url =
    `${OGD_BASE}` +
    `?api-key=${GOVT_API_KEY}` +
    `&format=json` +
    `&limit=50` +
    `&filters[state]=${encodeURIComponent(state)}` +
    `&filters[district]=${encodeURIComponent(district)}`;

  // Try commodity variants (OGD uses names like "Wheat(Lokwan)" not "Wheat")
  const variants = getCommodityVariants(commodity);
  const commodityParam = variants.length > 0 ? variants[0] : commodity;

  if (commodityParam && commodityParam.trim()) {
    url += `&filters[commodity]=${encodeURIComponent(commodityParam)}`;
  }

  console.log(`🌐 OGD Mandi fetch → ${district}, ${state}, crop: ${commodity || "all"}`);

  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });

  if (res.status === 401 || res.status === 403) {
    throw new Error(`API key rejected (${res.status}) — verify VITE_GOVT_API_KEY in .env.local`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OGD ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();

  if (!data.records || data.records.length === 0) {
    throw new Error(`No Mandi records found for ${district}, ${state}`);
  }

  console.log(`✅ OGD returned ${data.records.length} records for ${district}, ${state}`);

  return parseRecords(data.records, state, district, commodity, "ogd");
};

// ─── SHARED RECORD PARSER ─────────────────────────────────────────────────────
const parseRecords = (
  raw: any[],
  state: string,
  district: string,
  commodity: string,
  prefix: string
): MandiRecord[] =>
  raw.map((rec, i) => ({
    id:           `${prefix}-${i}`,
    state:        rec.state        || state,
    district:     rec.district     || district,
    market:       rec.market       || rec.apmc   || "Unknown Market",
    commodity:    rec.commodity    || commodity,
    variety:      rec.variety      || "—",
    min_price:    parseFloat(rec.min_price)   || 0,
    max_price:    parseFloat(rec.max_price)   || 0,
    modal_price:  parseFloat(rec.modal_price) || 0,
    arrival_date: rec.arrival_date || "",
  }));

// ─── LEVEL 2: STATE + COMMODITY FALLBACK ─────────────────────────────────────
/**
 * Removes district filter, keeps commodity. Tries each commodity alias in order.
 * Sorted by arrival_date DESC, returns top 5.
 */
const callOGDStateLevel = async (
  state: string,
  commodity: string
): Promise<MandiRecord[]> => {
  if (!GOVT_API_KEY) throw new Error("VITE_GOVT_API_KEY not set in .env.local");

  const variants = getCommodityVariants(commodity);
  let lastError = "";

  for (const variant of variants) {
    try {
      const url =
        `${OGD_BASE}` +
        `?api-key=${GOVT_API_KEY}` +
        `&format=json&limit=20` +
        `&filters[state]=${encodeURIComponent(state)}` +
        `&filters[commodity]=${encodeURIComponent(variant)}`;

      console.log(`🔄 L2 fallback → ${state} / ${variant}`);
      const res = await fetch(url, { signal: AbortSignal.timeout(12000) });

      if (res.status === 401 || res.status === 403) throw new Error(`API key rejected (${res.status})`);
      if (!res.ok) throw new Error(`OGD ${res.status}`);

      const data = await res.json();
      if (!data.records?.length) { lastError = `0 records for ${variant}`; continue; }

      const parsed = parseRecords(data.records, state, "", variant, "ogd-l2");
      parsed.sort((a, b) => new Date(b.arrival_date).getTime() - new Date(a.arrival_date).getTime());
      console.log(`✅ L2 hit on variant "${variant}" → ${parsed.length} records`);
      return parsed.slice(0, 5);
    } catch (e: any) {
      if (e?.message?.includes("API key rejected")) throw e; // don't retry on auth fail
      lastError = e?.message ?? "fetch error";
    }
  }

  throw new Error(`L2 exhausted all variants for "${commodity}" in ${state}: ${lastError}`);
};

// ─── LEVEL 3: STATE + ALL CROPS FALLBACK ─────────────────────────────────────
/**
 * Last resort: no commodity filter at all — shows whatever is available in the
 * state today. Results sorted newest-first, capped at 5.
 */
const callOGDStateLevelAllCrops = async (state: string): Promise<MandiRecord[]> => {
  if (!GOVT_API_KEY) throw new Error("VITE_GOVT_API_KEY not set in .env.local");

  const url =
    `${OGD_BASE}` +
    `?api-key=${GOVT_API_KEY}` +
    `&format=json&limit=20` +
    `&filters[state]=${encodeURIComponent(state)}`;

  console.log(`🔄 L3 fallback (all crops) → ${state}`);
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });

  if (res.status === 401 || res.status === 403) throw new Error(`API key rejected (${res.status})`);
  if (!res.ok) throw new Error(`OGD L3 ${res.status}`);

  const data = await res.json();
  if (!data.records?.length) throw new Error(`No records at all for ${state}`);

  const parsed = parseRecords(data.records, state, "", "", "ogd-l3");
  parsed.sort((a, b) => new Date(b.arrival_date).getTime() - new Date(a.arrival_date).getTime());
  console.log(`✅ L3 hit → ${parsed.length} records (mixed crops)`);
  return parsed.slice(0, 5);
};

// ─── SHARED 3-LEVEL CASCADE ───────────────────────────────────────────────────
/**
 * L1 → exact district + commodity (with alias variants)
 * L2 → state + commodity (alias variants, no district)
 * L3 → state + no crop filter (whatever's in today's data)
 * Auth/network errors short-circuit immediately.
 */
const cascadeFetch = async (
  state: string,
  district: string,
  commodity: string
): Promise<MandiResult> => {
  const isAuthErr = (msg: string) =>
    msg.includes("API key rejected") || msg.includes("VITE_GOVT_API_KEY");

  // ── L1: district + commodity ────────────────────────────────────────────────
  try {
    // Try each commodity variant for district-level
    const variants = getCommodityVariants(commodity);
    let l1Records: MandiRecord[] | null = null;
    for (const v of variants) {
      try {
        const recs = await callOGD(state, district, v);
        if (recs.length) { l1Records = recs; break; }
      } catch (e: any) {
        if (isAuthErr(e?.message ?? "")) throw e;
      }
    }
    if (l1Records?.length)
      return { records: l1Records, state, district, isFallback: false, isFallbackAllCrops: false };
  } catch (e: any) {
    if (isAuthErr(e?.message ?? ""))
      return { records: [], state, district, isFallback: false, isFallbackAllCrops: false, error: e.message };
  }

  console.warn(`⚠️ L1 empty for "${district}" — trying L2 (state+crop)`);

  // ── L2: state + commodity (aliases) ─────────────────────────────────────────
  try {
    const l2 = await callOGDStateLevel(state, commodity);
    if (l2.length)
      return { records: l2, state, district, isFallback: true, isFallbackAllCrops: false };
  } catch (e: any) {
    if (isAuthErr(e?.message ?? ""))
      return { records: [], state, district, isFallback: false, isFallbackAllCrops: false, error: e.message };
    console.warn(`⚠️ L2 empty — trying L3 (state, all crops)`);
  }

  // ── L3: state + no crop filter ───────────────────────────────────────────────
  try {
    const l3 = await callOGDStateLevelAllCrops(state);
    if (l3.length)
      return { records: l3, state, district, isFallback: true, isFallbackAllCrops: true };
  } catch (e: any) {
    const msg = e?.message ?? "All fallback levels exhausted";
    console.error(`❌ L3 also failed: ${msg}`);
    return { records: [], state, district, isFallback: false, isFallbackAllCrops: false, error: msg };
  }

  return {
    records: [], state, district, isFallback: false, isFallbackAllCrops: false,
    error: `No Mandi data available for ${state} today. Try again later.`,
  };
};

// ─── AUTO-DETECT LOCATION & FETCH ─────────────────────────────────────────────
export const fetchMandiByGPS = async (commodity: string = ""): Promise<MandiResult> => {
  const coords = await getCoords();                                // throws if GPS denied
  const { state, district } = await reverseGeocode(coords.lat, coords.lon);
  return cascadeFetch(state, district, commodity);
};

// ─── MANUAL / PROFILE-BASED FETCH ────────────────────────────────────────────
/**
 * Fetches Mandi prices for a manually entered or profile-based state+district.
 * Uses the same 3-level cascade as GPS fetch.
 */
export const fetchLiveMandiPrices = async (
  state: string,
  district: string,
  commodity: string = ""
): Promise<MandiResult> => cascadeFetch(state, district, commodity);

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
export interface BestMandi {
  bestMandiName: string;
  bestPrice:     number;
  percentHigher: string;
}

/** Returns the best mandi (highest modal price) and how much % above average it is. */
export const findBestMandi = (records: MandiRecord[]): BestMandi | null => {
  if (!records || records.length === 0) return null;

  const sorted  = [...records].sort((a, b) => b.modal_price - a.modal_price);
  const best    = sorted[0];
  const average = sorted.reduce((s, r) => s + r.modal_price, 0) / sorted.length;
  const percent = (((best.modal_price - average) / average) * 100).toFixed(1);

  return {
    bestMandiName: best.market,
    bestPrice:     best.modal_price,
    percentHigher: percent,
  };
};

// ─── STATE VALIDATION MAP (used by MarketView search dropdown) ────────────────
export const SUPPORTED_STATES: string[] = [
  "Andhra Pradesh", "Bihar", "Chhattisgarh", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu",
  "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];