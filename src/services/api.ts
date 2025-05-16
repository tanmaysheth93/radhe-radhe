import axios, { AxiosError } from 'axios';
import { Announcement } from '../types';
import { format } from 'date-fns';

const BSE_API_URL = 'https://api.bseindia.com/BseIndiaAPI/api/AnnGetData/w';
const BSE_PDF_BASE_URL = 'https://www.bseindia.com/xml-data/corpfiling/AttachLive/';

const bseApi = axios.create({
  headers: {
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Origin': 'https://www.bseindia.com',
    'Referer': 'https://www.bseindia.com/',
  },
  timeout: 60000
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;

// Check if internet connection is available
const checkInternetConnection = async (): Promise<boolean> => {
  try {
    await fetch('https://www.google.com/favicon.ico', {
      mode: 'no-cors',
      cache: 'no-store',
    });
    return true;
  } catch {
    return false;
  }
};

// Check if BSE website is accessible
const checkBseStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://www.bseindia.com', {
      mode: 'no-cors',
      cache: 'no-store',
    });
    return response.type === 'opaque' || response.ok;
  } catch {
    return false;
  }
};

const retryWithExponentialBackoff = async <T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = INITIAL_RETRY_DELAY
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`All retry attempts failed. ${errorMessage}`);
    }
    
    const nextDelay = Math.min(delay * 2, 30000);
    console.log(`Retrying after ${delay}ms. Attempts remaining: ${retries}`);
    await sleep(delay);
    return retryWithExponentialBackoff(fn, retries - 1, nextDelay);
  }
};

interface BSEAnnouncement {
  NEWSSUB: string;
  NEWSID: string;
  SCRIP_CD: number;
  NEWSDTTM: string;
  NEWS_DT: string;
  NEWS_TM: string;
  ATTACHMENTNAME: string;
  MORE: string;
  HEADLINE: string;
  CATEGORYNAME: string;
  OLD_ANNOUNCEMENT_TYPE: string;
  QUARTER_ID: number;
  CRITICALNEWS: boolean;
  SLNO: number;
  DissemDT: string;
  TotalPages: number;
  CATEGORYID: number;
  SCRIP_NAME: string;
  SCRIP_CODE: number;
  SYMBOL: string;
  URL_PATH: string;
}

export const fetchLatestAnnouncements = async (): Promise<Announcement[]> => {
  return retryWithExponentialBackoff(async () => {
    // Check connectivity
    const isOnline = await checkInternetConnection();
    if (!isOnline) {
      throw new Error('No internet connection detected. Please check your network connection.');
    }

    const isBseAccessible = await checkBseStatus();
    if (!isBseAccessible) {
      throw new Error('Unable to reach BSE website. The service might be experiencing technical difficulties.');
    }

    try {
      const today = new Date();
      const params = new URLSearchParams({
        strCat: '-1',
        strPrevDate: format(today, 'dd/MM/yyyy'),
        strScrip: '',
        strSearch: '1',
        strToDate: format(today, 'dd/MM/yyyy'),
        strType: 'C',
      });

      console.log('Fetching announcements from BSE API...');
      const response = await bseApi.get(`${BSE_API_URL}?${params.toString()}`);

      if (!response.data || !Array.isArray(response.data.Table)) {
        throw new Error('Invalid response format from BSE API');
      }

      const announcements: Announcement[] = response.data.Table.map((item: BSEAnnouncement) => ({
        id: item.NEWSID,
        companyName: item.SCRIP_NAME,
        companyCode: item.SCRIP_CODE.toString(),
        announcementType: item.CATEGORYNAME,
        subject: item.NEWSSUB,
        submissionDate: new Date(item.NEWSDTTM).toISOString(),
        pdfUrl: `${BSE_PDF_BASE_URL}${item.ATTACHMENTNAME}`,
        isProcessed: false
      }));

      console.log(`Successfully fetched ${announcements.length} announcements`);
      return announcements;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          throw new Error(`BSE API error: ${axiosError.response.status} - ${axiosError.response.statusText}`);
        } else if (axiosError.request) {
          throw new Error('Network error: Unable to reach BSE API');
        }
      }
      throw error;
    }
  });
};

export const downloadPdf = async (pdfUrl: string, fileName: string): Promise<void> => {
  return retryWithExponentialBackoff(async () => {
    try {
      console.log('Downloading PDF from:', pdfUrl);
      const response = await axios.get(pdfUrl, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf',
          'Referer': 'https://www.bseindia.com/',
        },
        timeout: 30000
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error('Failed to download PDF: The file may be temporarily unavailable');
      }
      throw error;
    }
  });
};