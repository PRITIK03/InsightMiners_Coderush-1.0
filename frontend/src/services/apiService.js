const API_BASE_URL = 'http://localhost:5000/api';

export const fetchPollutionData = async (region, startDate, endDate) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/pollution-data?region=${region}&start_date=${startDate}&end_date=${endDate}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching pollution data:', error);
    throw error;
  }
};

export const fetchRegionBoundary = async (region) => {
  try {
    const response = await fetch(`${API_BASE_URL}/region-boundary?region=${region}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching region boundary:', error);
    throw error;
  }
};
