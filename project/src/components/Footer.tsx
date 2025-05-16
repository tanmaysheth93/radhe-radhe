import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-12">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-gray-600">
              &copy; {currentYear} BSE Announcements Viewer. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Data provided by Bombay Stock Exchange (BSE).
            </p>
          </div>
          
          <div className="flex space-x-6">
            <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">Terms of Service</a>
            <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
          </div>
        </div>
        
        <div className="mt-6 text-xs text-gray-500 text-center md:text-left">
          <p>Disclaimer: This application is for informational purposes only. The information is provided by BSE and while we endeavor to keep the information up to date and correct, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability or availability with respect to the website or the information.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;