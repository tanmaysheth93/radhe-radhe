import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Announcement, AnnouncementFilter } from '../types';
import { fetchLatestAnnouncements } from '../services/api';
import { processAnnouncement } from '../services/aiService';

interface AnnouncementContextType {
  announcements: Announcement[];
  loading: boolean;
  error: string | null;
  refreshAnnouncements: () => Promise<void>;
  processUnprocessedAnnouncements: () => Promise<void>;
  filteredAnnouncements: Announcement[];
  filter: AnnouncementFilter;
  setFilter: (filter: AnnouncementFilter) => void;
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

// Constants for circuit breaker
const MAX_CONSECUTIVE_FAILURES = 3;
const CIRCUIT_BREAKER_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'cachedAnnouncements';
const CACHE_TIMESTAMP_KEY = 'cachedAnnouncementsTimestamp';

export const AnnouncementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AnnouncementFilter>({ searchTerm: '' });
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [circuitBreakerTimer, setCircuitBreakerTimer] = useState<number | null>(null);
  const [lastSuccessfulFetch, setLastSuccessfulFetch] = useState<Date | null>(null);

  // Load cached announcements on mount
  useEffect(() => {
    const loadCachedData = () => {
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      
      if (cachedData && cachedTimestamp) {
        try {
          const parsed = JSON.parse(cachedData);
          setAnnouncements(parsed);
          setLastSuccessfulFetch(new Date(cachedTimestamp));
          setLoading(false);
          return true;
        } catch (err) {
          console.error('Error loading cached announcements:', err);
        }
      }
      return false;
    };

    loadCachedData();
  }, []);

  // Fetch announcements on initial load and set up polling
  useEffect(() => {
    refreshAnnouncements();
    
    // Set up polling for new announcements every minute if circuit breaker is not active
    const intervalId = setInterval(() => {
      if (!circuitBreakerTimer) {
        refreshAnnouncements();
      }
    }, 60000);
    
    return () => clearInterval(intervalId);
  }, [circuitBreakerTimer]);

  // Process any unprocessed announcements
  useEffect(() => {
    if (announcements.length > 0) {
      processUnprocessedAnnouncements();
    }
  }, [announcements]);

  // Check online status before making requests
  const isOnline = (): boolean => {
    return navigator.onLine;
  };

  // Cache announcements to localStorage with timestamp
  const cacheAnnouncements = (data: Announcement[]): void => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().toISOString());
    } catch (err) {
      console.error('Error caching announcements:', err);
    }
  };

  // Reset circuit breaker
  const resetCircuitBreaker = (): void => {
    setConsecutiveFailures(0);
    setCircuitBreakerTimer(null);
  };

  // Activate circuit breaker
  const activateCircuitBreaker = (): void => {
    setCircuitBreakerTimer(Date.now() + CIRCUIT_BREAKER_TIMEOUT);
    setTimeout(() => {
      resetCircuitBreaker();
    }, CIRCUIT_BREAKER_TIMEOUT);
  };

  // Format error message for users with cached data info
  const formatErrorMessage = (baseError: string): string => {
    const hasCachedData = announcements.length > 0;
    const lastUpdateInfo = lastSuccessfulFetch 
      ? `Last successful update: ${lastSuccessfulFetch.toLocaleTimeString()}`
      : 'No successful updates yet';

    let message = '';

    // Check for specific error types and provide targeted messages
    if (baseError.includes('No internet connection detected')) {
      message = 'Unable to connect to the internet. Please check your network connection and ensure you are online.';
    } else if (baseError.includes('Unable to reach BSE website')) {
      message = 'The BSE website is currently inaccessible. This could be due to maintenance or technical issues on their end.';
    } else if (baseError.includes('Network error')) {
      message = 'A network error occurred while trying to fetch announcements. This might be due to:';
      message += '\n• Unstable internet connection';
      message += '\n• Firewall or security software blocking the connection';
      message += '\n• VPN issues if you\'re using one';
    } else {
      message = baseError;
    }

    message += '\n\n';

    if (hasCachedData) {
      message += `Currently showing cached announcements from ${lastUpdateInfo}. `;
      message += 'These announcements may not include the latest updates.';
    } else {
      message += 'No cached announcements are available. Please resolve the connection issues to view announcements.';
    }

    message += '\n\nTroubleshooting steps:';
    message += '\n1. Check your internet connection';
    message += '\n2. Try disabling any VPN or proxy services';
    message += '\n3. Verify if you can access the BSE website directly at https://www.bseindia.com';
    message += '\n4. If the problem persists, wait a few minutes and try again';
    message += '\n5. If none of the above work, the BSE service might be temporarily unavailable';

    return message;
  };

  // Refresh announcements with better error handling
  const refreshAnnouncements = async (): Promise<void> => {
    // Check if circuit breaker is active
    if (circuitBreakerTimer && Date.now() < circuitBreakerTimer) {
      const remainingTime = Math.ceil((circuitBreakerTimer - Date.now()) / 1000 / 60);
      setError(formatErrorMessage(`Too many failed attempts. Please try again in ${remainingTime} minutes.`));
      return;
    }

    // Check online status
    if (!isOnline()) {
      setError(formatErrorMessage('No internet connection detected. Please check your internet connection.'));
      return;
    }

    try {
      setLoading(true);
      const data = await fetchLatestAnnouncements();
      
      if (data.length === 0) {
        throw new Error('No announcements received from the API');
      }
      
      setAnnouncements(data);
      cacheAnnouncements(data);
      setConsecutiveFailures(0);
      setLastSuccessfulFetch(new Date());
      setError(null);
    } catch (err) {
      setConsecutiveFailures(prev => prev + 1);
      
      if (consecutiveFailures + 1 >= MAX_CONSECUTIVE_FAILURES) {
        activateCircuitBreaker();
      }

      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(formatErrorMessage(errorMessage));
      console.error('Error in refreshAnnouncements:', err);
    } finally {
      setLoading(false);
    }
  };

  // Process unprocessed announcements
  const processUnprocessedAnnouncements = async (): Promise<void> => {
    const unprocessed = announcements.filter(a => !a.isProcessed);
    
    if (unprocessed.length === 0) return;
    
    try {
      const processedAnnouncements = await Promise.all(
        unprocessed.map(async (announcement) => {
          try {
            return await processAnnouncement(announcement);
          } catch (err) {
            console.error(`Error processing announcement ${announcement.id}:`, err);
            return announcement;
          }
        })
      );
      
      setAnnouncements(prevAnnouncements => 
        prevAnnouncements.map(announcement => {
          const processed = processedAnnouncements.find(a => a.id === announcement.id);
          return processed || announcement;
        })
      );
    } catch (err) {
      console.error('Error processing announcements:', err);
    }
  };

  // Filter announcements based on current filter
  const filteredAnnouncements = announcements.filter(announcement => {
    // Search term filter (checks company name, subject, and announcement type)
    if (filter.searchTerm && !announcement.companyName.toLowerCase().includes(filter.searchTerm.toLowerCase()) &&
        !announcement.subject.toLowerCase().includes(filter.searchTerm.toLowerCase()) &&
        !announcement.announcementType.toLowerCase().includes(filter.searchTerm.toLowerCase())) {
      return false;
    }
    
    // Company name filter
    if (filter.companyName && announcement.companyName !== filter.companyName) {
      return false;
    }
    
    // Announcement type filter
    if (filter.announcementType && announcement.announcementType !== filter.announcementType) {
      return false;
    }
    
    // Date range filter
    if (filter.fromDate && new Date(announcement.submissionDate) < new Date(filter.fromDate)) {
      return false;
    }
    
    if (filter.toDate && new Date(announcement.submissionDate) > new Date(filter.toDate)) {
      return false;
    }
    
    return true;
  });

  return (
    <AnnouncementContext.Provider value={{
      announcements,
      loading,
      error,
      refreshAnnouncements,
      processUnprocessedAnnouncements,
      filteredAnnouncements,
      filter,
      setFilter
    }}>
      {children}
    </AnnouncementContext.Provider>
  );
};

export const useAnnouncements = (): AnnouncementContextType => {
  const context = useContext(AnnouncementContext);
  if (context === undefined) {
    throw new Error('useAnnouncements must be used within an AnnouncementProvider');
  }
  return context;
};