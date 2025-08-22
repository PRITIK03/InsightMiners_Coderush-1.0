import React from 'react';

const FilterControls = ({ filters, onFilterChange, onUpdate }) => {
  const regions = [
    { value: 'Nagpur', label: 'Nagpur, Maharashtra', flag: '🇮🇳' },
    { value: 'Mumbai', label: 'Mumbai, Maharashtra', flag: '🇮🇳' },
    { value: 'Delhi', label: 'Delhi NCR', flag: '🇮🇳' },
    { value: 'London', label: 'London, UK', flag: '🇬🇧' },
    { value: 'Shanghai', label: 'Shanghai, China', flag: '🇨🇳' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Analysis Filters</h2>
      </div>
      
      {/* Region Selection */}
      <div className="space-y-3">
        <label className="flex items-center text-sm font-semibold text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Select Region
        </label>
        <div className="relative">
          <select
            className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white text-gray-800 font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 appearance-none cursor-pointer hover:border-gray-300"
            value={filters.region}
            onChange={(e) => onFilterChange('region', e.target.value)}
          >
            {regions.map((region) => (
              <option key={region.value} value={region.value}>
                {region.flag} {region.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="flex items-center text-sm font-semibold text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Start Date
          </label>
          <input
            type="date"
            className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white text-gray-800 font-medium focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-300"
            value={filters.startDate}
            onChange={(e) => onFilterChange('startDate', e.target.value)}
          />
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center text-sm font-semibold text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            End Date
          </label>
          <input
            type="date"
            className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white text-gray-800 font-medium focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all duration-300"
            value={filters.endDate}
            onChange={(e) => onFilterChange('endDate', e.target.value)}
          />
        </div>
      </div>

      {/* Update Button */}
      <button
        onClick={onUpdate}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl active:scale-95 flex items-center justify-center space-x-2 group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Update Analysis</span>
      </button>
      
      <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
        Last updated: {new Date().toLocaleString('en-IN')}
      </div>
    </div>
  );
};

export default FilterControls;
