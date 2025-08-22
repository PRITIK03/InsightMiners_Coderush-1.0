import React from 'react';
import FilterControls from './FilterControls';
import ChartTab from './ChartTab';
import InsightsTab from './InsightsTab';
import ImpactTab from './ImpactTab';
import ForecastsTab from './ForecastsTab';
import WeatherTab from './WeatherTab';

const Sidebar = ({ 
  pollutionData, 
  filters, 
  onFilterChange, 
  onUpdate,
  activeTab,
  setActiveTab,
  loading 
}) => {
  const tabs = [
    { id: 'charts', label: 'Charts', icon: '📊' },
    { id: 'insights', label: 'Insights', icon: '💡' },
    { id: 'weather', label: 'Weather', icon: '🌤️' },
    { id: 'forecasts', label: 'Forecasts', icon: '🔮', badge: 'AI' },
    { id: 'impact', label: 'Impact', icon: '⚠️' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-2xl h-full border border-gray-100 overflow-hidden">
      {/* Filter Controls */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
        <FilterControls 
          filters={filters}
          onFilterChange={onFilterChange}
          onUpdate={onUpdate}
        />
      </div>
      
      {/* Enhanced Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto bg-white">
        {tabs.map((tab) => (
          <button 
            key={tab.id}
            className={`flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap transition-all duration-300 relative group
              ${activeTab === tab.id 
                ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-500' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="mr-2 text-base group-hover:scale-110 transition-transform duration-300">
              {tab.icon}
            </span>
            {tab.label}
            {tab.badge && (
              <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full animate-pulse">
                {tab.badge}
              </span>
            )}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 animate-slideIn"></div>
            )}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="p-6 h-full overflow-auto bg-gradient-to-b from-white to-gray-50">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent absolute top-0"></div>
              <div className="mt-4 text-center text-gray-600 font-medium animate-pulse">
                Loading insights...
              </div>
            </div>
          </div>
        ) : !pollutionData ? (
          <div className="text-center p-12 animate-fadeIn">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Data Available</h3>
            <p className="text-gray-600 mb-4">Please update your filters and try again to view pollution analytics.</p>
            <button 
              onClick={onUpdate}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
            >
              Refresh Data
            </button>
          </div>
        ) : (
          <div className="animate-fadeIn">
            {activeTab === 'charts' && <ChartTab pollutionData={pollutionData} />}
            {activeTab === 'insights' && <InsightsTab pollutionData={pollutionData} />}
            {activeTab === 'weather' && <WeatherTab pollutionData={pollutionData} />}
            {activeTab === 'forecasts' && <ForecastsTab pollutionData={pollutionData} />}
            {activeTab === 'impact' && <ImpactTab pollutionData={pollutionData} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
