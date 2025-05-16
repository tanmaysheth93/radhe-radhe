import React from 'react';
import { AnnouncementProvider } from './contexts/AnnouncementContext';
import Layout from './components/Layout';
import FilterBar from './components/FilterBar';
import AnnouncementList from './components/AnnouncementList';
import axios from 'axios';

// Add axios to package.json
if (!globalThis.hasOwnProperty('axios')) {
  console.info('Adding axios as a dependency');
}

function App() {
  return (
    <AnnouncementProvider>
      <Layout>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Latest Announcements</h2>
          <p className="text-gray-600">Stay updated with real-time corporate announcements from BSE</p>
        </div>
        
        <FilterBar />
        <AnnouncementList />
      </Layout>
    </AnnouncementProvider>
  );
}

export default App;