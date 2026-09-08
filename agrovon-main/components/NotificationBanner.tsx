import React, { useEffect } from 'react';
import { X, AlertTriangle, Info } from 'lucide-react';

interface NotificationBannerProps {
  title: string;
  message: string;
  type: 'alert' | 'info';
  onClose: () => void;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({ title, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 8000); // Auto dismiss after 8s
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 left-4 right-4 z-50 rounded-2xl p-4 shadow-lg flex gap-3 animate-slide-down ${
      type === 'alert' ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-blue-50 border border-blue-200 text-blue-800'
    }`}>
      <div className={`p-2 rounded-full shrink-0 ${type === 'alert' ? 'bg-red-100' : 'bg-blue-100'}`}>
        {type === 'alert' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-sm">{title}</h3>
        <p className="text-xs mt-1 opacity-90">{message}</p>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full h-fit">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
export default NotificationBanner;
