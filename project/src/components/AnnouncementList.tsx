import React from 'react';
import { useAnnouncements } from '../contexts/AnnouncementContext';
import AnnouncementCard from './AnnouncementCard';
import { AlertCircle, FileText } from 'lucide-react';

const AnnouncementList: React.FC = () => {
  const { filteredAnnouncements, loading, error } = useAnnouncements();
  
  if (error) {
    return (
      <div className="py-8 px-4 bg-red-50 rounded-lg border border-red-100 flex items-start">
        <AlertCircle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" size={20} />
        <div>
          <h3 className="text-lg font-medium text-red-800">Error loading announcements</h3>
          <p className="mt-1 text-red-700">{error}</p>
          <p className="mt-2 text-sm text-red-600">Please try refreshing the page or try again later.</p>
        </div>
      </div>
    );
  }
  
  if (loading && filteredAnnouncements.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }
  
  if (filteredAnnouncements.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-center bg-white rounded-lg shadow-sm">
        <div className="bg-gray-100 p-3 rounded-full mb-3">
          <FileText className="text-gray-500" size={24} />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No announcements found</h3>
        <p className="text-gray-500 max-w-md">
          Try adjusting your search or filter criteria to find what you're looking for.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {filteredAnnouncements.map(announcement => (
        <AnnouncementCard key={announcement.id} announcement={announcement} />
      ))}
    </div>
  );
};

export default AnnouncementList;