import axios, { AxiosError } from 'axios';
import { Announcement } from '../types';
import { format } from 'date-fns';

// Updated CORS proxies with more reliable services
const CORS_PROXIES = [
  {
    url: 'https://api.allorigins.win/raw?url=',
    healthCheck: 'https://api.allorigins.win/raw?url=https://example.com'
  },
  {
    url: 'https://api.codetabs.com/v1/proxy?quest=',
    healthCheck: 'https://api.codetabs.com/v1/proxy?quest=https://example.com'
  },
  {
    url: 'https://corsproxy.io/?',
    healthCheck: 'https://corsproxy.io/?https://example.com'
  }
];

// Updated BSE API endpoints
const BSE_API_URL = 'https://www.bseindia.com/corporates/annListings_New.aspx';
const BSE_PDF_BASE_URL = 'https://www.bseindia.com/xml-data/corpfiling/AttachLive/';
const BSE_STATUS_CHECK_URL = 'https://www.bseindia.com/';

// Modern browser User-Agent
const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Create axios instance with required headers
const bseApi = axios.create({
  headers: {
    'User-Agent': BROWSER_USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Dest': 'document',
    'Upgrade-Insecure-Requests': '1',
    'Origin': 'https://www.bseindia.com',
    'Referer': 'https://www.bseindia.com/corporates/ann.html',
  },
  timeout: 60000,
  withCredentials: true
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
    const response = await fetch(BSE_STATUS_CHECK_URL, {
      mode: 'no-cors',
      cache: 'no-store',
    });
    return response.type === 'opaque' || response.ok;
  } catch {
    return false;
  }
};

// Enhanced proxy health check with response validation
async function isProxyHealthy(proxy: typeof CORS_PROXIES[0]): Promise<boolean> {
  try {
    console.log(`Checking health of proxy: ${proxy.url}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await axios.get(proxy.healthCheck, {
      signal: controller.signal,
      validateStatus: (status) => status < 500,
      timeout: 10000
    });

    clearTimeout(timeoutId);
    
    const isValidResponse = response.data && 
      typeof response.data === 'string' && 
      response.data.includes('<!doctype html>');

    if (!isValidResponse) {
      console.warn(`Proxy ${proxy.url} returned invalid response:`, response.data);
      return false;
    }

    if (response.status === 403 || response.status === 429) {
      console.warn(`Proxy ${proxy.url} returned status ${response.status}`);
      return false;
    }

    console.log(`Proxy ${proxy.url} is healthy`);
    return true;
  } catch (error) {
    console.warn(`Proxy ${proxy.url} health check failed:`, error);
    return false;
  }
}

// Get a list of healthy proxies
async function getHealthyProxies(): Promise<typeof CORS_PROXIES> {
  console.log('Getting list of healthy proxies...');
  const healthyProxies = [];
  
  for (const proxy of CORS_PROXIES) {
    if (await isProxyHealthy(proxy)) {
      healthyProxies.push(proxy);
    }
  }

  console.log(`Found ${healthyProxies.length} healthy proxies`);
  return healthyProxies;
}

// Parse HTML response to extract announcements
function parseAnnouncementsFromHtml(html: string): Announcement[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const rows = doc.querySelectorAll('#tdData tr');
  
  return Array.from(rows).map((row, index) => {
    const cells = row.querySelectorAll('td');
    const pdfLink = cells[1]?.querySelector('a')?.getAttribute('href') || '';
    const pdfId = pdfLink.split('/').pop() || '';
    
    return {
      id: `ann_${index}_${Date.now()}`,
      companyName: cells[0]?.textContent?.trim() || '',
      companyCode: cells[2]?.textContent?.trim() || '',
      announcementType: cells[3]?.textContent?.trim() || '',
      subject: cells[1]?.textContent?.trim() || '',
      submissionDate: cells[4]?.textContent?.trim() || new Date().toISOString(),
      pdfUrl: pdfLink,
      isProcessed: false
    };
  }).filter(ann => ann.companyName && ann.subject);
}

// Enhanced error detection and handling with connectivity checks
async function tryWithDifferentProxies(apiCall: (proxyUrl: string) => Promise<any>): Promise<any> {
  // First check internet connectivity
  const isOnline = await checkInternetConnection();
  if (!isOnline) {
    throw new Error(
      'No internet connection detected. Please check your network connection and try again.'
    );
  }

  // Then check BSE website accessibility
  const isBseAccessible = await checkBseStatus();
  if (!isBseAccessible) {
    throw new Error(
      'Unable to reach BSE website. The BSE service might be experiencing technical difficulties. ' +
      'Please try again later or check BSE website status at https://www.bseindia.com'
    );
  }

  const healthyProxies = await getHealthyProxies();
  let lastError;
  let proxyErrors = [];

  // Try with proxies first
  for (const proxy of healthyProxies) {
    try {
      console.log(`Attempting request with proxy: ${proxy.url}`);
      return await apiCall(proxy.url);
    } catch (error) {
      const isCorsError = error instanceof Error && 
        (error.message.includes('CORS') || error.message.includes('cross-origin'));
      
      const errorMessage = axios.isAxiosError(error)
        ? `Status: ${error.response?.status}, Message: ${error.message}`
        : error instanceof Error
          ? error.message
          : 'Unknown error';
      
      console.warn(`Failed with proxy ${proxy.url}:`, errorMessage);
      proxyErrors.push(`${proxy.url}: ${errorMessage}`);
      
      if (isCorsError) {
        console.log('CORS error detected, trying next proxy...');
        continue;
      }
      
      lastError = error;
      await sleep(1000);
    }
  }

  // If all proxies fail, try direct request
  try {
    console.log('Attempting direct request without proxy');
    return await apiCall('');
  } catch (error) {
    console.error('Direct request failed:', error);
    
    let errorMessage = 'Unable to fetch data from BSE API. ';
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        errorMessage += `BSE API returned an error (${axiosError.response.status}). `;
      } else if (axiosError.code === 'ECONNABORTED') {
        errorMessage += 'The request timed out. ';
      } else if (axiosError.code === 'ERR_NETWORK') {
        errorMessage += 'A network error occurred. ';
      }
    }
    
    errorMessage += 'Please try the following:\n' +
      '1. Check your internet connection\n' +
      '2. Verify if you can access the BSE website directly at https://www.bseindia.com\n' +
      '3. If the problem persists, the BSE API might be temporarily unavailable - please try again later';
    
    throw new Error(errorMessage);
  }
}

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

export const fetchLatestAnnouncements = async (): Promise<Announcement[]> => {
  return retryWithExponentialBackoff(async () => {
    const today = new Date();
    const params = new URLSearchParams({
      dt: format(today, 'dd/MM/yyyy'),
      PageSize: '50',
      PageNo: '1',
      hdnDate: format(today, 'dd/MM/yyyy'),
      scrip: '',
      anntype: '',
      annflag: '1',
      exchdiv: 'All'
    });

    return tryWithDifferentProxies(async (proxyUrl) => {
      try {
        const url = proxyUrl 
          ? `${proxyUrl}${encodeURIComponent(BSE_API_URL)}${encodeURIComponent('?' + params.toString())}`
          : `${BSE_API_URL}?${params.toString()}`;

        console.log('Fetching announcements from:', url);
        
        const response = await bseApi.get(url);
        console.log('Response received:', response.status);
        
        if (typeof response.data !== 'string') {
          throw new Error('Invalid response format from BSE website');
        }
        
        const announcements = parseAnnouncementsFromHtml(response.data);
        console.log(`Found ${announcements.length} announcements`);
        
        if (announcements.length === 0) {
          throw new Error('No announcements found in the response');
        }
        
        return announcements;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          if (axiosError.response) {
            console.error('API Error Response:', {
              status: axiosError.response.status,
              data: axiosError.response.data,
              headers: axiosError.response.headers,
            });
            throw new Error(`BSE website error: ${axiosError.response.status} - ${axiosError.response.statusText}. Please try again later.`);
          } else if (axiosError.request) {
            console.error('Network Error Details:', {
              config: axiosError.config,
              code: axiosError.code,
              message: axiosError.message
            });
            throw new Error(`Network error: Unable to reach BSE website. Please check your internet connection and try again.`);
          }
        }
        throw error;
      }
    });
  });
};

export const downloadPdf = async (pdfUrl: string, fileName: string): Promise<void> => {
  return retryWithExponentialBackoff(async () => {
    try {
      console.log('Downloading PDF from:', pdfUrl);
      const response = await axios.get(pdfUrl, {
        responseType: 'blob',
        headers: {
          'User-Agent': BROWSER_USER_AGENT,
          'Accept': 'application/pdf',
          'Referer': 'https://www.bseindia.com/',
        },
        timeout: 30000
      });
      console.log('PDF downloaded successfully');

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
        const axiosError = error as AxiosError;
        console.error('Error downloading PDF:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          headers: axiosError.response?.headers,
        });
        throw new Error(`Failed to download PDF: The file may be temporarily unavailable. Please try again later.`);
      }
      console.error('Error downloading PDF:', error);
      throw error;
    }
  });
};