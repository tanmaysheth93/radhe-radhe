import React, { useState } from 'react';
import { Announcement } from '../types';
import { downloadPdf } from '../services/api';
import { FileText, Download, Calendar, Building, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

interface AnnouncementCardProps {
  announcement: Announcement;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement }) => {
  const [expanded, setExpanded] = useState(false);
  
  const handleDownload = () => {
    const fileName = `${announcement.companyName.replace(/\s+/g, '_')}_${announcement.subject.substring(0, 30).replace(/\s+/g, '_')}.pdf`;
    downloadPdf(announcement.pdfUrl, fileName);
  };
  
  const handlePreview = () => {
    window.open(announcement.pdfUrl, '_blank');
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-100">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{announcement.subject}</h3>
            <div className="flex items-center mt-2 text-sm text-gray-600">
              <Building size={16} className="mr-1" />
              <span className="font-medium">{announcement.companyName}</span>
              <span className="mx-2 text-gray-400">•</span>
              <Tag size={16} className="mr-1" />
              <span>{announcement.announcementType}</span>
            </div>
            <div className="mt-2 text-sm text-gray-500 flex items-center">
              <Calendar size={16} className="mr-1" />
              <span>{formatDate(announcement.submissionDate)}</span>
            </div>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handlePreview}
              className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              aria-label="Preview PDF"
            >
              <FileText size={18} />
            </button>
            <button 
              onClick={handleDownload}
              className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              aria-label="Download PDF"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
        
        <div className="mt-3">
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            {expanded ? (
              <>
                <span>Show less</span>
                <ChevronUp size={16} className="ml-1" />
              </>
            ) : (
              <>
                <span>Show summary</span>
                <ChevronDown size={16} className="ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
          <div className="pt-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-1">AI Summary</h4>
            {announcement.isProcessed ? (
              <p className="text-sm text-gray-600">{announcement.summary}</p>
            ) : (
              <div className="flex items-center text-sm text-amber-600">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing PDF... This may take a moment.
              </div>
            )}
          </div>
          <div className="flex justify-end mt-3">
            <button 
              onClick={handlePreview}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              View Full Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementCard;