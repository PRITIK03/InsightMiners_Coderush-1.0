import { useState, useEffect } from 'react';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { fetchPollutionData, fetchRegionBoundary } from './services/apiService';
import './App.css';

function App() {
  const [pollutionData, setPollutionData] = useState(null);
  const [regionBoundary, setRegionBoundary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    region: 'Nagpur',
    startDate: '2023-01-01',
    endDate: '2023-12-31'
  });
  const [activeTab, setActiveTab] = useState('charts');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchPollutionData(
        filters.region,
        filters.startDate,
        filters.endDate
      );
      setPollutionData(data);
      
      const boundary = await fetchRegionBoundary(filters.region);
      setRegionBoundary(boundary);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters({...filters, ...newFilters});
  };

  const handleUpdate = () => {
    loadData();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="flex flex-col md:flex-row">
        <div className="w-full md:w-2/3 h-[70vh] md:h-screen">
          <MapView 
            pollutionData={pollutionData} 
            regionBoundary={regionBoundary} 
            loading={loading}
          />
        </div>
        
        <div className="w-full md:w-1/3 p-4 overflow-y-auto">
          <Sidebar 
            pollutionData={pollutionData}
            filters={filters}
            onFilterChange={handleFilterChange}
            onUpdate={handleUpdate}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
