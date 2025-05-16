import React from 'react';
import { BarChart3, RefreshCw, Bell } from 'lucide-react';
import { useAnnouncements } from '../contexts/AnnouncementContext';

const Header: React.FC = () => {
  const { refreshAnnouncements, loading } = useAnnouncements();
  
  return (
    <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-6 px-6 shadow-md">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <BarChart3 size={28} className="mr-3" />
            <h1 className="text-2xl font-bold">BSE Announcements</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              className="relative p-2 rounded-full hover:bg-blue-700 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-amber-500 ring-2 ring-blue-800"></span>
            </button>
            
            <button 
              onClick={() => refreshAnnouncements()}
              disabled={loading}
              className={`flex items-center px-3 py-1.5 rounded-md transition-colors ${
                loading 
                  ? 'bg-blue-700 cursor-not-allowed' 
                  : 'bg-blue-700 hover:bg-blue-600'
              }`}
              aria-label="Refresh announcements"
            >
              <RefreshCw size={16} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>
        
        <p className="mt-2 text-blue-200 text-sm max-w-3xl">
          Real-time corporate announcements from the Bombay Stock Exchange with AI-powered summaries
        </p>
      </div>
    </header>
  );
};

export default Header;