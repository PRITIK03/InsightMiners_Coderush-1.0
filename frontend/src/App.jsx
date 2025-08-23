import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Map from './components/Map';
import Sidebar from './components/sidebar/Sidebar';
import LoadingOverlay from './components/LoadingOverlay';
import './App.css';

function App() {
  const [pollutionData, setPollutionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    region: 'Nagpur',
    startDate: '2023-01-01',
    endDate: '2023-12-31'
  });
  const [activeTab, setActiveTab] = useState('insights');
  const [layoutMode, setLayoutMode] = useState('split'); // 'split', 'mapFocus', 'dataFocus'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the correct API base URL based on environment
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:5000' 
        : '';
      
      const response = await fetch(
        `${baseUrl}/api/pollution-data?region=${filters.region}&start_date=${filters.startDate}&end_date=${filters.endDate}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      // Check if response is ok before parsing JSON
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}`);
      }
      
      const data = await response.json();
      setPollutionData(data);
      
      // Make data available globally for components that need it
      window.currentPollutionData = data;
      
      // Also store selected region for report generation
      if (data && data.pollutionLevels && data.pollutionLevels.length > 0) {
        window.selectedRegion = data.pollutionLevels[0].location || filters.region;
        localStorage.setItem('selectedRegion', window.selectedRegion);
      } else {
        window.selectedRegion = filters.region;
        localStorage.setItem('selectedRegion', filters.region);
      }
      
      // Store full data in localStorage for backup
      try {
        localStorage.setItem('currentPollutionData', JSON.stringify({
          ...data,
          region: filters.region // Make sure region is always available
        }));
      } catch (storageError) {
        console.warn('Failed to store data in localStorage:', storageError);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(`Failed to load data: ${error.message}`);
      
      // Load mock data in development
      
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleLayoutMode = (mode) => {
    setLayoutMode(mode);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      
      <div className="container mx-auto px-4 py-4 flex-1 flex flex-col">
        {/* Layout Toggle Controls */}
        <div className="flex justify-center mb-4 space-x-2">
          <button 
            onClick={() => toggleLayoutMode('split')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
              layoutMode === 'split' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            Split View
          </button>
          <button 
            onClick={() => toggleLayoutMode('mapFocus')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
              layoutMode === 'mapFocus' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Map Focus
          </button>
          <button 
            onClick={() => toggleLayoutMode('dataFocus')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
              layoutMode === 'dataFocus' 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Data Focus
          </button>
        </div>

        {/* Error message display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
                <p className="mt-2 text-xs text-red-600">
                  Make sure the Flask backend server is running on port 5000.
                </p>
                <button
                  onClick={fetchData}
                  className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        <main className={`flex flex-1 gap-6 ${
          layoutMode === 'split' ? 'flex-col' : 
          layoutMode === 'mapFocus' ? 'flex-col' : 
          'flex-col-reverse'
        }`}>
          {/* Map Section */}
          <div className={`
            bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transition-all duration-500 mx-auto w-full
            ${layoutMode === 'split' 
              ? 'max-w-4xl aspect-[16/9]' // 16:9 aspect ratio for split view
              : layoutMode === 'mapFocus' 
                ? 'max-w-5xl aspect-[16/9]' // 16:9 aspect ratio for map focus
                : 'max-w-4xl aspect-[16/9]' // 16:9 aspect ratio for data focus
            }
          `}>
            <div className="w-full h-full">
              <Map pollutionData={pollutionData} selectedRegion={filters.region} />
            </div>
          </div>
          
          {/* Sidebar Section */}
          <div className={`
            transition-all duration-500 mx-auto
            ${layoutMode === 'split' 
              ? 'w-full max-w-4xl h-auto' 
              : layoutMode === 'mapFocus' 
                ? 'w-full max-w-5xl h-auto mt-4' // Added max-width and reduced margin
                : 'w-full max-w-4xl h-auto mb-4'  // Added max-width and reduced margin
            }
          `}>
            <Sidebar
              pollutionData={pollutionData}
              filters={filters}
              onFilterChange={handleFilterChange}
              onUpdate={fetchData}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              loading={loading}
              error={error}
            />
          </div>
        </main>
      </div>
      
      {loading && <LoadingOverlay />}
      
      <footer className="bg-gray-800 text-gray-300 py-4 text-center text-sm">
        <div className="container mx-auto">
          <p>AirWatch India © {new Date().getFullYear()} | Advanced Air Quality Monitoring & Analysis System</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
