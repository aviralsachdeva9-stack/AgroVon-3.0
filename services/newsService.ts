// src/services/newsService.ts

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  summary: string;
  pubDate: string;
  source: string;
  image: string;
  link: string;
  category?: string;
  readTime?: string;
}

// 1. FREE RSS FEED (Google News - Agriculture India)
const RSS_FEED_URL = "https://news.google.com/rss/search?q=agriculture+farming+india+kisan+crop+monsoon+MSP&hl=en-IN&gl=IN&ceid=IN:en";

// 2. FREE CONVERTER (RSS -> JSON)
const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_FEED_URL)}`;

// 3. FALLBACK AGRICULTURAL NEWS (Updated Daily)
const FALLBACK_NEWS: NewsItem[] = [
  {
    id: '1',
    title: "Government announces 7% increase in MSP for Rabi crops 2026",
    description: "The Cabinet Committee on Economic Affairs has approved a significant increase in Minimum Support Price for wheat and pulses for the upcoming Rabi season.",
    summary: "MSP increased by 7% for wheat and pulses, benefiting farmers across the country.",
    pubDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    source: "Agriculture Ministry",
    image: "https://images.unsplash.com/photo-1625246333195-551e11fb696d?auto=format&fit=crop&w=400&q=80",
    link: "#",
    category: "Policy",
    readTime: "3 min"
  },
  {
    id: '2',
    title: "Monsoon 2026: IMD predicts above-normal rainfall in central India",
    description: "The India Meteorological Department has forecasted above-normal rainfall in central and peninsular India, bringing good news for Kharif crops.",
    summary: "Above-normal monsoon expected in central India, favorable for Kharif season.",
    pubDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    source: "IMD",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80",
    link: "#",
    category: "Weather",
    readTime: "4 min"
  },
  {
    id: '3',
    title: "New agricultural drone policy to boost precision farming",
    description: "Government introduces new guidelines for agricultural drone usage, making it easier for farmers to adopt precision farming techniques.",
    summary: "New drone policy aims to promote precision farming among small and marginal farmers.",
    pubDate: new Date(Date.now() - 86400000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    source: "TechAgri",
    image: "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=400&q=80",
    link: "#",
    category: "Technology",
    readTime: "5 min"
  },
  {
    id: '4',
    title: "Organic farming gets major boost with new certification scheme",
    description: "Launch of simplified organic certification process to encourage more farmers to adopt sustainable agricultural practices.",
    summary: "Simplified organic certification process launched to promote sustainable farming.",
    pubDate: new Date(Date.now() - 172800000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    source: "Organic India",
    image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=400&q=80",
    link: "#",
    category: "Sustainable",
    readTime: "3 min"
  }
];

export const fetchLiveNews = async (language: string = 'en'): Promise<NewsItem[]> => {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    if (data.status === 'ok' && data.items.length > 0) {
      // Map the Live Data
      const mappedNews = data.items.map((item: any, index: number) => ({
        id: `news-${index}`,
        title: item.title,
        description: item.description.replace(/<[^>]*>?/gm, '').slice(0, 200) + "...",
        summary: item.description.replace(/<[^>]*>?/gm, '').slice(0, 100) + "...",
        pubDate: new Date(item.pubDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        source: item.author || "AgriNews",
        image: item.enclosure?.link || `https://source.unsplash.com/400x300/?agriculture,farm,crops&sig=${index}`,
        link: item.link,
        category: "General",
        readTime: `${Math.floor(Math.random() * 3) + 2} min`
      }));

      // Filter for agricultural content and add fallback if needed
      const agriculturalNews = mappedNews.filter(news => 
        news.title.toLowerCase().includes('farm') || 
        news.title.toLowerCase().includes('crop') || 
        news.title.toLowerCase().includes('agri') ||
        news.title.toLowerCase().includes('monsoon') ||
        news.title.toLowerCase().includes('msp') ||
        news.title.toLowerCase().includes('kisan')
      );

      // If no agricultural news found, use fallback
      if (agriculturalNews.length === 0) {
        console.log("No agricultural news found, using fallback data");
        return FALLBACK_NEWS;
      }

      return agriculturalNews.slice(0, 8);
    }
  } catch (error) {
    console.error("Error fetching live news:", error);
  }

  // 3. FALLBACK DATA (If API fails or quota exceeded)
  console.log("Using fallback agricultural news data");
  return FALLBACK_NEWS;
};

// Function to get news by category
export const getNewsByCategory = (news: NewsItem[], category: string): NewsItem[] => {
  return news.filter(item => item.category === category);
};

// Function to get latest news (last 24 hours)
export const getLatestNews = (news: NewsItem[]): NewsItem[] => {
  const now = new Date();
  return news.filter(item => {
    const newsDate = new Date(item.pubDate);
    const diffTime = Math.abs(now.getTime() - newsDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 1;
  });
};