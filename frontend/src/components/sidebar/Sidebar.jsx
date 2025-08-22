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
  return (
    <div className="bg-white rounded-lg shadow-md h-full">
      {/* Filter Controls */}
      <FilterControls 
        filters={filters}
        onFilterChange={onFilterChange}
        onUpdate={onUpdate}
      />
      
      {/* Tabs */}
      <div className="flex border-b overflow-x-auto">
        <button 
          className={`px-4 py-2 text-sm whitespace-nowrap ${activeTab === 'charts' 
            ? 'border-b-2 border-blue-500 font-medium text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('charts')}
        >
          Charts
        </button>
        
        <button 
          className={`px-4 py-2 text-sm whitespace-nowrap ${activeTab === 'insights' 
            ? 'border-b-2 border-blue-500 font-medium text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('insights')}
        >
          Insights
        </button>
        
        <button 
          className={`px-4 py-2 text-sm whitespace-nowrap ${activeTab === 'weather' 
            ? 'border-b-2 border-blue-500 font-medium text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('weather')}
        >
          Weather
        </button>
        
        <button 
          className={`px-4 py-2 text-sm whitespace-nowrap ${activeTab === 'forecasts' 
            ? 'border-b-2 border-blue-500 font-medium text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('forecasts')}
        >
          Forecasts
          <span className="ml-1 px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">AI</span>
        </button>
        
        <button 
          className={`px-4 py-2 text-sm whitespace-nowrap ${activeTab === 'impact' 
            ? 'border-b-2 border-blue-500 font-medium text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('impact')}
        >
          Impact
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : !pollutionData ? (
          <div className="text-center text-gray-500 p-8">
            No data available. Please update filters and try again.
          </div>
        ) : (
          <>
            {activeTab === 'charts' && <ChartTab pollutionData={pollutionData} />}
            {activeTab === 'insights' && <InsightsTab pollutionData={pollutionData} />}
            {activeTab === 'weather' && <WeatherTab pollutionData={pollutionData} />}
            {activeTab === 'forecasts' && <ForecastsTab pollutionData={pollutionData} />}
            {activeTab === 'impact' && <ImpactTab pollutionData={pollutionData} />}
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
