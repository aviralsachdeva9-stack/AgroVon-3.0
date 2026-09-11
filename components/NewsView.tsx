import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ExternalLink, Calendar, Newspaper, RefreshCw, Clock, Tag, Globe } from 'lucide-react';
import { ViewState, UserProfile } from '../types';
import { fetchLiveNews, NewsItem, getNewsByCategory } from '../services/newsService';

interface NewsViewProps {
  setView: (view: ViewState) => void;
  isDarkMode?: boolean;
  language?: string;
  userProfile?: UserProfile;
}

// ─── Inline time-ago (no import issues) ───────────────────────────────────────
const timeAgo = (iso: string | undefined, lang: string = 'en'): string => {
  if (!iso) return '';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (isNaN(diff) || diff < 0) return '';
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);

    if (lang === 'hi') {
      if (m < 1)   return 'अभी';
      if (m < 60)  return `${m} मिनट पहले`;
      if (h < 24)  return `${h} घंटे पहले`;
      if (d < 30)  return `${d} दिन पहले`;
      return new Date(iso).toLocaleDateString('hi-IN');
    }
    if (lang === 'pa') {
      if (m < 1)   return 'ਹੁਣੇ';
      if (m < 60)  return `${m} ਮਿੰਟ ਪਹਿਲਾਂ`;
      if (h < 24)  return `${h} ਘੰਟੇ ਪਹਿਲਾਂ`;
      return `${d} ਦਿਨ ਪਹਿਲਾਂ`;
    }
    if (lang === 'te') {
      if (m < 1)   return 'ఇప్పుడే';
      if (m < 60)  return `${m} నిమిషాల క్రితం`;
      if (h < 24)  return `${h} గంటల క్రితం`;
      return `${d} రోజుల క్రితం`;
    }
    // English default
    if (m < 1)   return 'Just now';
    if (m < 60)  return `${m}m ago`;
    if (h < 24)  return `${h}h ago`;
    if (d === 1) return 'Yesterday';
    return `${d} days ago`;
  } catch {
    return '';
  }
};

// Category labels per language
const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  en: { all: 'All News', General: 'General', Policy: 'Policy', Weather: 'Weather', Technology: 'Technology', Sustainable: 'Sustainable' },
  hi: { all: 'सभी समाचार', General: 'सामान्य', Policy: 'नीति', Weather: 'मौसम', Technology: 'तकनीक', Sustainable: 'जैविक' },
  pa: { all: 'ਸਾਰੀਆਂ ਖ਼ਬਰਾਂ', General: 'ਆਮ', Policy: 'ਨੀਤੀ', Weather: 'ਮੌਸਮ', Technology: 'ਤਕਨਾਲੋਜੀ', Sustainable: 'ਜੈਵਿਕ' },
  te: { all: 'అన్ని వార్తలు', General: 'సాధారణ', Policy: 'విధానం', Weather: 'వాతావరణం', Technology: 'సాంకేతికత', Sustainable: 'సేంద్రీయ' },
};

const UI_LABELS: Record<string, Record<string, string>> = {
  en: { title: 'Agri News (Live)', loading: 'Fetching latest news...', noNews: 'No news in this category.', readMore: 'Read Full Story' },
  hi: { title: 'कृषि समाचार (लाइव)', loading: 'समाचार प्राप्त हो रहे हैं...', noNews: 'इस श्रेणी में कोई समाचार नहीं।', readMore: 'पूरी खबर पढ़ें' },
  pa: { title: 'ਖੇਤੀ ਖ਼ਬਰਾਂ (ਲਾਈਵ)', loading: 'ਖ਼ਬਰਾਂ ਲੱਭ ਰਹੀਆਂ ਹਨ...', noNews: 'ਕੋਈ ਖ਼ਬਰ ਨਹੀਂ।', readMore: 'ਪੂਰੀ ਖ਼ਬਰ ਪੜ੍ਹੋ' },
  te: { title: 'వ్యవసాయ వార్తలు (లైవ్)', loading: 'వార్తలు తెస్తున్నాం...', noNews: 'వార్తలు లేవు.', readMore: 'పూర్తి వార్త చదవండి' },
};

const CATEGORIES = ['all', 'General', 'Policy', 'Weather', 'Technology', 'Sustainable'];

const NewsView: React.FC<NewsViewProps> = ({ setView, isDarkMode = true, language = 'en', userProfile }) => {
  const [news, setNews]                 = useState<NewsItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const labels = CATEGORY_LABELS[language] ?? CATEGORY_LABELS['en'];
  const ui     = UI_LABELS[language] ?? UI_LABELS['en'];

  // Extract locality: prefer state, fallback to district
  const locality = userProfile?.state || userProfile?.district || null;

  const loadNews = useCallback(async () => {
    setLoading(true);
    const data = await fetchLiveNews(language, locality);
    setNews(data);
    setLoading(false);
  }, [language, locality]);

  useEffect(() => { loadNews(); }, [loadNews]);

  const filteredNews = selectedCategory === 'all'
    ? news
    : getNewsByCategory(news, selectedCategory);

  const handleNewsClick = (item: NewsItem) => {
    if (item.link && item.link !== '#') {
      window.open(item.link, '_blank', 'noopener,noreferrer');
    }
  };

  const tc = {
    bg:          isDarkMode ? 'bg-[#0d1f18]'             : 'bg-gray-50',
    text:        isDarkMode ? 'text-white'                : 'text-gray-900',
    headerBg:    isDarkMode ? 'bg-[#1a2e28]'             : 'bg-white',
    headerBorder:isDarkMode ? 'border-[#2d4a3e]'         : 'border-gray-200',
    cardBg:      isDarkMode ? 'bg-[#1a2e28]'             : 'bg-white',
    cardBorder:  isDarkMode ? 'border-[#2d4a3e]'         : 'border-gray-200',
    subText:     isDarkMode ? 'text-gray-400'            : 'text-gray-600',
    btn:         isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200',
    activeCat:   isDarkMode ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-green-100 text-green-700 border border-green-300',
    inactiveCat: isDarkMode ? 'bg-white/8 text-gray-400 border border-transparent'       : 'bg-gray-100 text-gray-600 border border-transparent',
  };

  return (
    <div className={`flex flex-col min-h-screen ${tc.bg} ${tc.text} pb-24`}>

      {/* HEADER */}
      <div className={`flex justify-between items-center px-4 py-4 ${tc.headerBg} border-b ${tc.headerBorder} shadow-lg sticky top-0 z-10`}>
        <button onClick={() => setView(ViewState.HOME)} className={`p-2 ${tc.btn} rounded-full transition-colors`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-base font-bold">{ui.title}</h1>
          <div className="flex items-center gap-1 mt-0.5">
            <Globe className="w-3 h-3 text-green-400" />
            <span className="text-[10px] text-green-400 font-medium uppercase tracking-wide">India • Live</span>
          </div>
        </div>
        <button
          onClick={loadNews}
          className={`p-2 ${tc.btn} rounded-full transition-colors ${loading ? 'animate-spin pointer-events-none' : ''}`}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* CATEGORY FILTER */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                selectedCategory === cat ? tc.activeCat : tc.inactiveCat
              }`}
            >
              <Tag className="w-2.5 h-2.5" />
              {labels[cat] ?? cat}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-4">
        {loading ? (
          <div className={`flex flex-col items-center justify-center py-24 gap-4 ${tc.subText}`}>
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-2 border-green-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-sm text-center">{ui.loading}</p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className={`text-center py-24 ${tc.subText}`}>
            <Newspaper className="w-14 h-14 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{ui.noNews}</p>
          </div>
        ) : (
          filteredNews.map((item) => {
            const ago = timeAgo(item.pubDateRaw, language);
            const hasLink = !!item.link && item.link !== '#';
            return (
              <div
                key={item.id}
                onClick={() => handleNewsClick(item)}
                className={`${tc.cardBg} rounded-2xl overflow-hidden ${tc.cardBorder} border shadow-md transition-all duration-200 ${
                  hasLink ? 'cursor-pointer hover:shadow-xl hover:border-green-500/40 active:scale-[0.98]' : 'cursor-default'
                }`}
              >
                {/* Image */}
                <div className="h-44 w-full overflow-hidden relative bg-gray-800">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1625246333195-551e11fb696d?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase backdrop-blur-sm max-w-[130px] truncate">
                    {item.source}
                  </div>
                  {item.category && (
                    <div className="absolute top-2 left-2 bg-green-600/90 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase backdrop-blur-sm">
                      {labels[item.category] ?? item.category}
                    </div>
                  )}
                  {hasLink && (
                    <div className="absolute bottom-2 right-2 bg-black/50 rounded-full p-1.5 backdrop-blur-sm">
                      <ExternalLink className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    {/* TIME AGO */}
                    <div className="flex items-center gap-1.5 text-green-400 text-xs font-semibold">
                      <Calendar className="w-3 h-3" />
                      <span>{ago || new Date(item.pubDateRaw ?? '').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    {item.readTime && (
                      <div className={`flex items-center gap-1 ${tc.subText} text-xs`}>
                        <Clock className="w-3 h-3" />
                        {item.readTime}
                      </div>
                    )}
                  </div>

                  <h3 className={`text-base font-bold ${tc.text} leading-snug mb-2 line-clamp-2`}>
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className={`text-sm ${tc.subText} line-clamp-2 mb-3 leading-relaxed`}>
                      {item.description}
                    </p>
                  )}

                  {hasLink ? (
                    <div className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 ${
                      isDarkMode
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20'
                        : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                    }`}>
                      {ui.readMore} <ExternalLink className="w-3 h-3" />
                    </div>
                  ) : (
                    <div className={`w-full py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-2 ${
                      isDarkMode ? 'bg-white/5 text-gray-500' : 'bg-gray-50 text-gray-400'
                    }`}>
                      <Newspaper className="w-3 h-3" /> Preview Only
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NewsView;