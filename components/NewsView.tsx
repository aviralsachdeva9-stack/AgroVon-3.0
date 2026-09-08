import React, { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Calendar, Newspaper, RefreshCw, Clock, Tag } from 'lucide-react';
import { ViewState } from '../types';
import { fetchLiveNews, NewsItem, getNewsByCategory } from '../services/newsService';

interface NewsViewProps {
  setView: (view: ViewState) => void;
  isDarkMode?: boolean;
}

const NewsView: React.FC<NewsViewProps> = ({ setView, isDarkMode = true }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'Policy', 'Weather', 'Technology', 'Sustainable'];

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setLoading(true);
    const data = await fetchLiveNews();
    setNews(data);
    setLoading(false);
  };

  const filteredNews = selectedCategory === 'all' ? news : getNewsByCategory(news, selectedCategory);

  const themeClasses = {
    background: isDarkMode ? 'bg-[#0d1f18]' : 'bg-gray-50',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    headerBg: isDarkMode ? 'bg-[#1a2e28]' : 'bg-white',
    headerBorder: isDarkMode ? 'border-[#2d4a3e]' : 'border-gray-200',
    cardBg: isDarkMode ? 'bg-[#1a2e28]' : 'bg-white',
    cardBorder: isDarkMode ? 'border-[#2d4a3e]' : 'border-gray-200',
    subText: isDarkMode ? 'text-gray-400' : 'text-gray-600',
    buttonBg: isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200',
    categoryBg: isDarkMode ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-50 text-green-600 border-green-200'
  };

  return (
    <div className={`flex flex-col min-h-screen ${themeClasses.background} ${themeClasses.text} animate-fade-in pb-24`}>
      
      {/* HEADER */}
      <div className={`flex justify-between items-center p-6 ${themeClasses.headerBg} border-b ${themeClasses.headerBorder} shadow-lg sticky top-0 z-10`}>
        <button onClick={() => setView(ViewState.HOME)} className={`p-2 ${themeClasses.buttonBg} rounded-full`}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Agri News (Live)</h1>
        <button onClick={loadNews} className={`p-2 ${themeClasses.buttonBg} rounded-full ${loading ? 'animate-spin' : ''}`}>
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* CATEGORY FILTER */}
      <div className="px-4 py-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category 
                  ? themeClasses.categoryBg 
                  : themeClasses.buttonBg
              }`}
            >
              <Tag className="w-3 h-3 inline mr-1" />
              {category === 'all' ? 'All News' : category}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-4">
        {loading ? (
           <div className={`flex flex-col items-center justify-center py-20 ${themeClasses.subText}`}>
             <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mb-3"></div>
             <p>Fetching latest agricultural updates...</p>
           </div>
        ) : filteredNews.length === 0 ? (
           <div className={`text-center py-20 ${themeClasses.subText}`}>
             <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-50" />
             <p>No news available in {selectedCategory} category.</p>
           </div>
        ) : (
           filteredNews.map((item) => (
             <div 
               key={item.id} 
               onClick={() => window.open(item.link, '_blank')}
               className={`${themeClasses.cardBg} rounded-2xl overflow-hidden ${themeClasses.cardBorder} border shadow-md active:scale-[0.98] transition-transform cursor-pointer hover:shadow-lg`}
             >
                {/* Image Section */}
                <div className="h-48 w-full overflow-hidden relative">
                   <img src={item.image} alt="News" className="w-full h-full object-cover" />
                   <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase backdrop-blur-md">
                      {item.source}
                   </div>
                   {item.category && (
                     <div className="absolute top-2 left-2 bg-green-600 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase backdrop-blur-md">
                        {item.category}
                     </div>
                   )}
                </div>
                
                {/* Content Section */}
                <div className="p-4">
                   <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
                        <Calendar className="w-3 h-3" /> {item.pubDate}
                     </div>
                     {item.readTime && (
                       <div className="flex items-center gap-1 text-gray-400 text-xs">
                         <Clock className="w-3 h-3" /> {item.readTime}
                       </div>
                     )}
                   </div>
                   <h3 className={`text-lg font-bold ${themeClasses.text} leading-tight mb-2 line-clamp-2`}>
                      {item.title}
                   </h3>
                   <p className={`text-sm ${themeClasses.subText} line-clamp-3 mb-4`}>
                      {item.description}
                   </p>
                   
                   <button className={`w-full py-2 rounded-xl ${isDarkMode ? 'bg-white/5 text-green-400 border-white/5 hover:bg-white/10' : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'} text-sm font-medium transition-colors flex items-center justify-center gap-2`}>
                      Read Full Story <ExternalLink className="w-3 h-3" />
                   </button>
                </div>
             </div>
           ))
        )}
      </div>
    </div>
  );
};

export default NewsView;