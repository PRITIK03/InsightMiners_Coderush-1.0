import React from 'react';
import FilterControls from './sidebar/FilterControls';
import ChartTab from './sidebar/ChartTab';
import InsightsTab from './sidebar/InsightsTab';
import ImpactTab from './sidebar/ImpactTab';

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
      <div className="flex border-b">
        <button 
          className={`px-4 py-2 text-sm ${activeTab === 'charts' 
            ? 'border-b-2 border-blue-500 font-medium text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('charts')}
        >
          Charts
        </button>
        
        <button 
          className={`px-4 py-2 text-sm ${activeTab === 'insights' 
            ? 'border-b-2 border-blue-500 font-medium text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('insights')}
        >
          Insights
        </button>
        
        <button 
          className={`px-4 py-2 text-sm ${activeTab === 'impact' 
            ? 'border-b-2 border-blue-500 font-medium text-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('impact')}
        >
          Impact Analysis
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
            {activeTab === 'impact' && <ImpactTab pollutionData={pollutionData} />}
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
