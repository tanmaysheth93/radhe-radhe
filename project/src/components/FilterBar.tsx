import React, { useState } from 'react';
import { AnnouncementFilter } from '../types';
import { useAnnouncements } from '../contexts/AnnouncementContext';
import { Search, Filter, X } from 'lucide-react';

const FilterBar: React.FC = () => {
  const { filter, setFilter, announcements } = useAnnouncements();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Get unique company names and announcement types for filters
  const companyNames = [...new Set(announcements.map(a => a.companyName))];
  const announcementTypes = [...new Set(announcements.map(a => a.announcementType))];
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({ ...filter, searchTerm: e.target.value });
  };
  
  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter({ ...filter, companyName: e.target.value || undefined });
  };
  
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter({ ...filter, announcementType: e.target.value || undefined });
  };
  
  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({ ...filter, fromDate: e.target.value || undefined });
  };
  
  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({ ...filter, toDate: e.target.value || undefined });
  };
  
  const resetFilters = () => {
    setFilter({ searchTerm: '' });
    setShowAdvancedFilters(false);
  };
  
  const hasActiveFilters = 
    filter.companyName || 
    filter.announcementType || 
    filter.fromDate || 
    filter.toDate || 
    filter.searchTerm;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Search announcements, companies, or keywords..."
            value={filter.searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className={`ml-2 px-4 py-2 border rounded-md flex items-center transition-colors ${
            showAdvancedFilters 
              ? 'bg-blue-50 text-blue-600 border-blue-200' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Filter size={16} className="mr-1" />
          <span>Filters</span>
        </button>
        
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="ml-2 px-3 py-2 text-red-600 hover:text-red-800 transition-colors flex items-center"
          >
            <X size={16} className="mr-1" />
            <span>Clear</span>
          </button>
        )}
      </div>
      
      {showAdvancedFilters && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <select
              id="company"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={filter.companyName || ''}
              onChange={handleCompanyChange}
            >
              <option value="">All Companies</option>
              {companyNames.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Announcement Type
            </label>
            <select
              id="type"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={filter.announcementType || ''}
              onChange={handleTypeChange}
            >
              <option value="">All Types</option>
              {announcementTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              id="fromDate"
              className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={filter.fromDate || ''}
              onChange={handleFromDateChange}
            />
          </div>
          
          <div>
            <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              id="toDate"
              className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={filter.toDate || ''}
              onChange={handleToDateChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;