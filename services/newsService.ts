// services/newsService.ts
// GNews /search endpoint — strict agriculture keywords + locality filtering
// Cache: 30-min (memory + localStorage) to protect 100 req/day free plan

export interface NewsItem {
  id:          string;
  title:       string;
  description: string;
  summary:     string;
  pubDate:     string;   // formatted display date
  pubDateRaw:  string;   // ISO — used for time-ago
  source:      string;
  image:       string;
  link:        string;
  category?:   string;
  readTime?:   string;
}

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const GNEWS_KEY  = import.meta.env.VITE_GNEWS_API_KEY as string | undefined;
const GNEWS_BASE = "https://gnews.io/api/v4/search";   // ← /search, NOT /top-headlines

const hasGNews =
  !!GNEWS_KEY &&
  GNEWS_KEY.trim().length > 10 &&
  GNEWS_KEY !== "paste_gnews_key_here";

console.log(
  "📰 GNews Key:",
  hasGNews ? `✅ Loaded (${GNEWS_KEY!.slice(0, 8)}...)` : "❌ NOT LOADED — set VITE_GNEWS_API_KEY in .env.local"
);

// ─── STRICT AGRICULTURE KEYWORDS (per language) ───────────────────────────────
// IMPORTANT: These are agri-only phrases — GNews will NOT return politics/crime
// because all keywords are farming-specific.
const AGRI_KEYWORDS: Record<string, string> = {
  en: "(agriculture OR farming OR farmers OR crop OR kisan OR harvest OR irrigation OR mandi OR MSP OR fertilizer)",
  hi: "(कृषि OR खेती OR किसान OR फसल OR सिंचाई OR MSP OR उर्वरक OR मंडी OR कटाई)",
  pa: "(agriculture OR farming OR kisan OR crop OR Punjab OR Haryana OR wheat OR paddy)",   // GNews has no Punjabi
  pb: "(agriculture OR farming OR kisan OR crop OR Punjab OR Haryana OR wheat OR paddy)",
  te: "(వ్యవసాయం OR రైతు OR పంట OR సాగు OR ఆంధ్రప్రదేశ్ OR తెలంగాణ OR irrigation)",
};

// GNews language codes (Punjabi → en fallback)
const LANG_CODE: Record<string, string> = {
  en: "en",
  hi: "hi",
  pa: "en",
  pb: "en",
  te: "te",
};

// ─── FALLBACK IMAGES (used when GNews returns null image) ────────────────────
const AGRI_IMAGES = [
  "https://images.unsplash.com/photo-1625246333195-551e11fb696d?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1477511801984-4ad318ed9846?auto=format&fit=crop&w=400&q=80",
];

/** Returns a valid agri image — GNews null/empty images get replaced */
const safeImage = (raw: string | null | undefined, index: number): string => {
  if (!raw || raw.trim() === "" || raw === "null") {
    return AGRI_IMAGES[index % AGRI_IMAGES.length];
  }
  // Some GNews images are generic placeholder domains — replace those too
  const genericHosts = ["logo.clearbit.com", "placeholder", "via.placeholder"];
  if (genericHosts.some((h) => raw.includes(h))) {
    return AGRI_IMAGES[index % AGRI_IMAGES.length];
  }
  return raw;
};

// ─── AUTO-CATEGORIZE (keyword match in title + desc) ─────────────────────────
const CATEGORY_RE: [string, RegExp][] = [
  ["Weather",     /monsoon|rain|rainfall|imd|weather|flood|drought|cyclone|बारिश|मानसून|వాతావరణం/i],
  ["Policy",      /msp|subsidy|government|ministry|scheme|policy|budget|loan|सरकार|नीति|योजना/i],
  ["Technology",  /agritech|drone|precision|ai|startup|technology|app|sensor|iot|तकनीक|ड्रोन/i],
  ["Sustainable", /organic|sustainable|paramparagat|जैविक|bio|natural|ecology|green farming/i],
];

const categorize = (title: string, desc: string): string => {
  const text = `${title} ${desc}`;
  for (const [cat, re] of CATEGORY_RE) {
    if (re.test(text)) return cat;
  }
  return "General";
};

// ─── 30-MIN CACHE (memory + localStorage) ────────────────────────────────────
// This saves ~29 requests per 30 min — critical for the 100 req/day free limit.
// CACHE_VERSION: bump this if you want to force-clear all cached data.
const CACHE_VERSION = "v3";
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MEM: Map<string, { data: NewsItem[]; ts: number }> = new Map();

// Clear any old-version cache entries on load
try {
  Object.keys(localStorage)
    .filter((k) => k.startsWith("agrovon_news_") && !k.includes(CACHE_VERSION))
    .forEach((k) => localStorage.removeItem(k));
} catch { /* ignore */ }

const getCache = (key: string): NewsItem[] | null => {
  const m = MEM.get(key);
  if (m && Date.now() - m.ts < CACHE_TTL) { console.log(`📦 Cache HIT (memory) [${key}]`); return m.data; }
  try {
    const raw = localStorage.getItem(`agrovon_news_${CACHE_VERSION}_${key}`);
    if (raw) {
      const p: { data: NewsItem[]; ts: number } = JSON.parse(raw);
      if (Date.now() - p.ts < CACHE_TTL) { console.log(`📦 Cache HIT (localStorage) [${key}]`); MEM.set(key, p); return p.data; }
    }
  } catch { /* ignore */ }
  return null;
};

const setCache = (key: string, data: NewsItem[]) => {
  const e = { data, ts: Date.now() };
  MEM.set(key, e);
  try { localStorage.setItem(`agrovon_news_${CACHE_VERSION}_${key}`, JSON.stringify(e)); } catch { /* ignore */ }
};

// ─── CORE FETCH ───────────────────────────────────────────────────────────────
const doFetch = async (
  language: string,
  locality: string | null
): Promise<NewsItem[]> => {
  const lang     = LANG_CODE[language] || "en";
  const keywords = AGRI_KEYWORDS[language] || AGRI_KEYWORDS["en"];

  // Append locality (state/district) to query for local news
  // e.g.: "(agriculture OR farming) AND "Uttar Pradesh""
  const localityClause = locality && locality.trim().length > 2
    ? ` AND "${locality.trim()}"`
    : "";

  const q = `${keywords}${localityClause}`;

  // URL: /search endpoint, country=in, max=10, sortby=publishedAt
  const url =
    `${GNEWS_BASE}` +
    `?q=${encodeURIComponent(q)}` +
    `&lang=${lang}` +
    `&country=in` +
    `&max=10` +
    `&sortby=publishedAt` +
    `&apikey=${GNEWS_KEY}`;

  console.log(`🌾 GNews fetch → lang=${lang}, locality="${locality || 'none'}"`);

  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });

  if (res.status === 429) throw new Error("RATE_LIMIT");
  if (res.status === 403) throw new Error("FORBIDDEN");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`GNews ${res.status}: ${JSON.stringify(body)}`);
  }

  const data = await res.json();
  const articles: any[] = data.articles ?? [];

  if (articles.length === 0) {
    console.warn(`⚠️ GNews returned 0 articles (lang=${lang}, q="${q}"). Check query/rate-limit.`);
  }

  return articles.map((a, i) => {
    const title = (a.title       || "").trim();
    const desc  = (a.description || a.content?.slice(0, 220) || "").trim();
    return {
      id:          `gnews-${lang}-${i}-${Date.now()}`,
      title,
      description: desc,
      summary:     desc.slice(0, 100),
      pubDate:     a.publishedAt  || new Date().toISOString(),
      pubDateRaw:  a.publishedAt  || new Date().toISOString(),
      source:      a.source?.name || "AgriNews",
      image:       safeImage(a.image, i),   // ← null-safe image replacement
      link:        a.url          || "#",
      category:    categorize(title, desc),
      readTime:    `${Math.floor(Math.random() * 3) + 2} min`,
    };
  });
};

// ─── STATIC FALLBACK ─────────────────────────────────────────────────────────
const FALLBACK_NEWS: NewsItem[] = [
  {
    id: "f1",
    title: "⚠️ Live news unavailable — Add VITE_GNEWS_API_KEY to .env.local for real news",
    description: "Restart the dev server after adding the key. Get a free key at gnews.io.",
    summary:    "Add GNews API key and restart dev server.",
    pubDate:    new Date().toISOString(),
    pubDateRaw: new Date().toISOString(),
    source:     "AgroVon System",
    image:      AGRI_IMAGES[0],
    link:       "https://gnews.io",
    category:   "General",
    readTime:   "1 min",
  },
  {
    id: "f2",
    title: "Government announces MSP increase for Rabi crops",
    description: "The CCEA approved an increase in Minimum Support Price for wheat and pulses for the upcoming Rabi season.",
    summary:    "MSP hike approved for Rabi crops.",
    pubDate:    new Date(Date.now() - 2 * 3600000).toISOString(),
    pubDateRaw: new Date(Date.now() - 2 * 3600000).toISOString(),
    source:     "Agriculture Ministry",
    image:      AGRI_IMAGES[1],
    link:       "https://agricoop.gov.in",
    category:   "Policy",
    readTime:   "3 min",
  },
  {
    id: "f3",
    title: "IMD issues heavy rainfall warning for Punjab, Haryana",
    description: "India Meteorological Department has issued a heavy rainfall warning, advising farmers to protect standing crops.",
    summary:    "IMD heavy rain warning for farmers.",
    pubDate:    new Date(Date.now() - 5 * 3600000).toISOString(),
    pubDateRaw: new Date(Date.now() - 5 * 3600000).toISOString(),
    source:     "IMD India",
    image:      AGRI_IMAGES[2],
    link:       "https://mausam.imd.gov.in",
    category:   "Weather",
    readTime:   "2 min",
  },
  {
    id: "f4",
    title: "Agritech startups raise ₹500 crore for precision farming solutions",
    description: "Indian agritech companies raised significant funding to expand drone-based and AI-driven precision farming across rural India.",
    summary:    "Indian agritech raises big funding.",
    pubDate:    new Date(Date.now() - 12 * 3600000).toISOString(),
    pubDateRaw: new Date(Date.now() - 12 * 3600000).toISOString(),
    source:     "Economic Times",
    image:      AGRI_IMAGES[3],
    link:       "https://economictimes.indiatimes.com",
    category:   "Technology",
    readTime:   "4 min",
  },
  {
    id: "f5",
    title: "Organic farming area in India crosses 5 million hectares",
    description: "India's organic farming area has expanded under the Paramparagat Krishi Vikas Yojana, with Sikkim as a fully organic state.",
    summary:    "India organic farming area expands.",
    pubDate:    new Date(Date.now() - 24 * 3600000).toISOString(),
    pubDateRaw: new Date(Date.now() - 24 * 3600000).toISOString(),
    source:     "Hindu Business Line",
    image:      AGRI_IMAGES[4],
    link:       "https://thehindubusinessline.com",
    category:   "Sustainable",
    readTime:   "3 min",
  },
];

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
/**
 * Fetch live Indian agriculture news.
 * @param language  App language code: 'en' | 'hi' | 'pa' | 'pb' | 'te'
 * @param locality  User's state or district (e.g. "Uttar Pradesh") for local news.
 *                  Pass null/undefined to skip locality filtering.
 */
export const fetchLiveNews = async (
  language: string = "en",
  locality?: string | null
): Promise<NewsItem[]> => {
  if (!hasGNews) {
    console.warn("⚠️ VITE_GNEWS_API_KEY not set — showing fallback news. Get free key at gnews.io");
    return FALLBACK_NEWS;
  }

  // Cache key includes locality so state-specific results are cached separately
  const cacheKey = `news_${language}_${locality || "all"}`;
  const cached   = getCache(cacheKey);
  if (cached) return cached;

  try {
    const articles = await doFetch(language, locality ?? null);

    // Deduplicate by title prefix
    const seen   = new Set<string>();
    const unique = articles.filter((item) => {
      const k = item.title.slice(0, 60).toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    // Sort newest first
    unique.sort((a, b) => new Date(b.pubDateRaw).getTime() - new Date(a.pubDateRaw).getTime());

    if (unique.length > 0) {
      console.log(`✅ ${unique.length} live agri articles loaded [locality: ${locality || "none"}]`);
      setCache(cacheKey, unique);
      return unique.slice(0, 30);
    }

    console.warn("⚠️ 0 articles after dedup — falling back to static articles");
    return FALLBACK_NEWS;

  } catch (err: any) {
    if (err?.message === "RATE_LIMIT") {
      console.error("⛔ GNews 429 — rate limit hit. Check Network tab. Showing fallback.");
    } else if (err?.message === "FORBIDDEN") {
      console.error("⛔ GNews 403 — invalid API key? Showing fallback.");
    } else {
      console.warn("⚠️ GNews fetch failed:", err?.message ?? err);
    }
    return FALLBACK_NEWS;
  }
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Filter news list by category string */
export const getNewsByCategory = (news: NewsItem[], category: string): NewsItem[] =>
  news.filter((item) => item.category === category);

/** Return only articles published in the last 24 hours */
export const getLatestNews = (news: NewsItem[]): NewsItem[] => {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return news.filter((item) => new Date(item.pubDateRaw).getTime() > cutoff);
};

// ─── RELATIVE TIME ────────────────────────────────────────────────────────────
export const timeAgo = (isoDate: string, language: string = "en"): string => {
  try {
    const d = Date.now() - new Date(isoDate).getTime();
    if (isNaN(d)) return isoDate;
    const m = Math.floor(d / 60000);
    const h = Math.floor(d / 3600000);
    const dy = Math.floor(d / 86400000);

    if (language === "hi") {
      if (m < 2)  return "अभी";
      if (m < 60) return `${m} मिनट पहले`;
      if (h < 24) return `${h} घंटे पहले`;
      return `${dy} दिन पहले`;
    }
    if (language === "pa" || language === "pb") {
      if (m < 2)  return "ਹੁਣੇ";
      if (m < 60) return `${m} ਮਿੰਟ ਪਹਿਲਾਂ`;
      if (h < 24) return `${h} ਘੰਟੇ ਪਹਿਲਾਂ`;
      return `${dy} ਦਿਨ ਪਹਿਲਾਂ`;
    }
    if (language === "te") {
      if (m < 2)  return "ఇప్పుడే";
      if (m < 60) return `${m} నిమిషాల క్రితం`;
      if (h < 24) return `${h} గంటల క్రితం`;
      return `${dy} రోజుల క్రితం`;
    }
    if (m < 2)   return "Just now";
    if (m < 60)  return `${m} min ago`;
    if (h < 24)  return `${h}h ago`;
    if (dy === 1) return "Yesterday";
    return `${dy} days ago`;
  } catch { return isoDate; }
};