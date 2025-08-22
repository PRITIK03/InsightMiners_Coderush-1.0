import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

const ForecastsTab = ({ pollutionData }) => {
  const forecastChartRef = useRef(null);
  const forecastChartInstance = useRef(null);
  
  useEffect(() => {
    if (pollutionData && pollutionData.pollutionLevels && 
        pollutionData.pollutionLevels[0] && 
        pollutionData.pollutionLevels[0].forecasts) {
      
      const forecasts = pollutionData.pollutionLevels[0].forecasts;
      
      // Get historical data for context
      const historicalData = pollutionData.pollutionLevels.slice(0, 7);
      
      // Prepare data for chart - convert string dates to Date objects
      const histDates = historicalData.map(d => new Date(d.date));
      const forecastDates = forecasts.map(f => new Date(f.date));
      
      // Combine for chart labels
      const labels = [...histDates, ...forecastDates];
      
      const no2Data = [
        ...historicalData.map(d => d.no2_level),
        ...forecasts.map(f => f.no2_forecast)
      ];
      
      const pm25Data = [
        ...historicalData.map(d => d.pm25_level),
        ...forecasts.map(f => f.pm25_forecast)
      ];
      
      // Create a dividing point for historical vs forecast data
      const historyLength = historicalData.length;
      
      if (forecastChartInstance.current) {
        forecastChartInstance.current.destroy();
      }
      
      const ctx = forecastChartRef.current.getContext('2d');
      
      forecastChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'NO2 Historical',
              data: no2Data.slice(0, historyLength).map((value, index) => ({
                x: histDates[index],
                y: value
              })),
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.1,
              fill: false,
              pointStyle: 'circle',
              pointRadius: 4
            },
            {
              label: 'NO2 Forecast',
              data: forecastDates.map((date, index) => ({
                x: date,
                y: no2Data[historyLength + index]
              })),
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderDash: [5, 5],
              tension: 0.1,
              fill: false,
              pointStyle: 'triangle',
              pointRadius: 4
            },
            {
              label: 'PM2.5 Historical',
              data: pm25Data.slice(0, historyLength).map((value, index) => ({
                x: histDates[index],
                y: value
              })),
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              tension: 0.1,
              fill: false,
              pointStyle: 'circle',
              pointRadius: 4
            },
            {
              label: 'PM2.5 Forecast',
              data: forecastDates.map((date, index) => ({
                x: date,
                y: pm25Data[historyLength + index]
              })),
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderDash: [5, 5],
              tension: 0.1,
              fill: false,
              pointStyle: 'triangle',
              pointRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: {
              mode: 'index',
              intersect: false
            },
            legend: {
              position: 'bottom',
              labels: {
                usePointStyle: true,
                padding: 20
              }
            },
            title: {
              display: true,
              text: 'Pollution Forecast (7 days)'
            }
          },
          scales: {
            y: {
              title: {
                display: true,
                text: 'Concentration (µg/m³)'
              },
              beginAtZero: true
            },
            x: {
              type: 'time',
              time: {
                unit: 'day',
                tooltipFormat: 'PP',
                displayFormats: {
                  day: 'MMM d'
                }
              },
              title: {
                display: true,
                text: 'Date'
              }
            }
          }
        }
      });
      
      return () => {
        if (forecastChartInstance.current) {
          forecastChartInstance.current.destroy();
        }
      };
    }
  }, [pollutionData]);
  
  if (!pollutionData || !pollutionData.pollutionLevels || 
      !pollutionData.pollutionLevels[0] || 
      !pollutionData.pollutionLevels[0].forecasts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-500">No forecast data available</div>
          <div className="text-sm text-gray-400 mt-2">This feature requires sufficient historical data</div>
        </div>
      </div>
    );
  }
  
  const forecasts = pollutionData.pollutionLevels[0].forecasts;
  const forecastMethod = forecasts[0].method ? forecasts[0].method : 'advanced AI';
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-3 flex items-center">
        Pollution Forecasts
        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">AI</span>
      </h3>
      
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="h-64">
          <canvas ref={forecastChartRef}></canvas>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium mb-3">Forecast Details</h4>
        
        <div className="text-sm text-gray-600 mb-3">
          <p>Forecasting method: <span className="font-medium">{forecastMethod}</span></p>
          <p className="mt-1">Showing 7-day pollution prediction based on historical trends and patterns.</p>
        </div>
        
        <div className="mt-4 max-h-60 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NO2 (µg/m³)</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PM2.5 (µg/m³)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {forecasts.map((forecast, index) => (
                <tr key={index}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">{forecast.date}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">{forecast.no2_forecast.toFixed(1)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">{forecast.pm25_forecast.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ForecastsTab;
