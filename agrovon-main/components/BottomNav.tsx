import React from 'react';
import { Home, ClipboardList, Bot, ShoppingBag, User } from 'lucide-react';
import { ViewState } from '../types';
import { TRANSLATIONS } from '../utils/translations';

interface BottomNavProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  language: string;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView, language }) => {
  const getIconColor = (view: ViewState) => currentView === view ? 'text-custom-primary' : 'text-custom-subtext';
  const t = TRANSLATIONS[language]?.nav || TRANSLATIONS['en'].nav;

  const navItems = [
    { view: ViewState.HOME, label: t.home, Icon: Home },
    { view: ViewState.CROP_MANAGER, label: t.planner, Icon: ClipboardList },
    { view: ViewState.AI_CHAT, label: t.chat, Icon: Bot, isFloating: true },
    { view: ViewState.MARKET, label: t.market, Icon: ShoppingBag },
    { view: ViewState.PROFILE, label: t.profile, Icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-custom-card border-t border-custom-border py-2 px-2 flex justify-between items-end rounded-t-3xl shadow-[0_-5px_20px_var(--shadow-color)] z-40 transition-colors duration-300 h-20 max-w-md mx-auto">
      
      {navItems.map((item) => {
        const isActive = currentView === item.view;
        
        if (item.isFloating) {
             return (
                 <div key={item.label} className="relative -top-8 flex flex-col items-center justify-center flex-1">
                    <button 
                        onClick={() => setView(item.view)}
                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-custom-bg transition-transform active:scale-95 ${isActive ? 'bg-custom-primary text-custom-bg' : 'bg-custom-primary text-custom-bg'}`}
                    >
                        <item.Icon className="w-7 h-7" />
                    </button>
                    <span className={`text-[10px] font-medium mt-1 ${isActive ? 'text-custom-primary' : 'text-custom-subtext'}`}>
                        {item.label}
                    </span>
                 </div>
             )
        }

        return (
            <button 
                key={item.label}
                onClick={() => setView(item.view)} 
                className={`flex flex-col items-center justify-center gap-1 pb-3 rounded-2xl transition-all duration-300 flex-1`}
            >
                <item.Icon className={`w-6 h-6 ${getIconColor(item.view)} transition-colors`} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-custom-primary' : 'text-custom-subtext'} transition-colors`}>
                    {item.label}
                </span>
            </button>
        );
      })}

    </div>
  );
};

export default BottomNav;