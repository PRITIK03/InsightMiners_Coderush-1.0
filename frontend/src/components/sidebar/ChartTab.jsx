import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns'; // Import date adapter for Chart.js

const ChartTab = ({ pollutionData }) => {
  const no2ChartRef = useRef(null);
  const pm25ChartRef = useRef(null);
  const riskChartRef = useRef(null);
  
  const no2ChartInstance = useRef(null);
  const pm25ChartInstance = useRef(null);
  const riskChartInstance = useRef(null);
  
  useEffect(() => {
    if (pollutionData && pollutionData.pollutionLevels) {
      // Parse dates and convert to Date objects for better time scale handling
      const dates = pollutionData.pollutionLevels.map(d => new Date(d.date));
      const no2Values = pollutionData.pollutionLevels.map(d => d.no2_level);
      const pm25Values = pollutionData.pollutionLevels.map(d => d.pm25_level);
      
      // Detect time range to set appropriate time unit
      const timeRange = determineTimeRange(dates);
      
      // Count risk zones by level
      const riskCounts = {high: 0, medium: 0, low: 0, unknown: 0};
      pollutionData.riskZones.forEach(zone => {
        riskCounts[zone.risk_level]++;
      });
      
      // NO2 Chart
      if (no2ChartInstance.current) {
        no2ChartInstance.current.destroy();
      }
      
      no2ChartInstance.current = new Chart(no2ChartRef.current, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [{
            label: 'NO2 (µg/m³)',
            data: no2Values,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
            fill: false
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: false
            },
            tooltip: {
              callbacks: {
                title: function(tooltipItems) {
                  const date = new Date(tooltipItems[0].parsed.x);
                  return formatDateByRange(date, timeRange);
                }
              }
            }
          },
          scales: {
            x: {
              type: 'time',
              time: {
                unit: timeRange.unit,
                displayFormats: {
                  day: 'MMM d',
                  week: 'MMM d',
                  month: 'MMM yyyy',
                  quarter: 'MMM yyyy',
                  year: 'yyyy'
                },
                tooltipFormat: 'PP' // Localized date format
              },
              title: {
                display: true,
                text: 'Date'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'NO2 Concentration (µg/m³)'
              }
            }
          }
        }
      });
      
      // PM2.5 Chart
      if (pm25ChartInstance.current) {
        pm25ChartInstance.current.destroy();
      }
      
      pm25ChartInstance.current = new Chart(pm25ChartRef.current, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [{
            label: 'PM2.5 (µg/m³)',
            data: pm25Values,
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1,
            fill: false
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: false
            },
            tooltip: {
              callbacks: {
                title: function(tooltipItems) {
                  const date = new Date(tooltipItems[0].parsed.x);
                  return formatDateByRange(date, timeRange);
                }
              }
            }
          },
          scales: {
            x: {
              type: 'time',
              time: {
                unit: timeRange.unit,
                displayFormats: {
                  day: 'MMM d',
                  week: 'MMM d',
                  month: 'MMM yyyy',
                  quarter: 'MMM yyyy',
                  year: 'yyyy'
                },
                tooltipFormat: 'PP'
              },
              title: {
                display: true,
                text: 'Date'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'PM2.5 Concentration (µg/m³)'
              }
            }
          }
        }
      });
      
      // Risk Distribution Chart
      if (riskChartInstance.current) {
        riskChartInstance.current.destroy();
      }
      
      riskChartInstance.current = new Chart(riskChartRef.current, {
        type: 'pie',
        data: {
          labels: ['High Risk', 'Medium Risk', 'Low Risk'],
          datasets: [{
            data: [riskCounts.high, riskCounts.medium, riskCounts.low],
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom',
            }
          }
        }
      });
    }
    
    return () => {
      if (no2ChartInstance.current) {
        no2ChartInstance.current.destroy();
      }
      if (pm25ChartInstance.current) {
        pm25ChartInstance.current.destroy();
      }
      if (riskChartInstance.current) {
        riskChartInstance.current.destroy();
      }
    };
  }, [pollutionData]);
  
  // Helper function to determine appropriate time unit based on date range
  const determineTimeRange = (dates) => {
    if (!dates || dates.length < 2) return { unit: 'day', format: 'MMM d' };
    
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 14) {
      return { unit: 'day', format: 'MMM d' };
    } else if (daysDiff <= 60) {
      return { unit: 'week', format: 'MMM d' };
    } else if (daysDiff <= 365) {
      return { unit: 'month', format: 'MMM yyyy' };
    } else {
      return { unit: 'quarter', format: 'QQQ yyyy' };
    }
  };
  
  // Format date based on time range
  const formatDateByRange = (date, timeRange) => {
    const options = { 
      day: { year: 'numeric', month: 'short', day: 'numeric' },
      week: { year: 'numeric', month: 'short', day: 'numeric' },
      month: { year: 'numeric', month: 'short' },
      quarter: { year: 'numeric', month: 'short' },
      year: { year: 'numeric' }
    };
    
    return date.toLocaleDateString(undefined, options[timeRange.unit]);
  };
  
  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">NO2 Levels Over Time</h3>
          <div className="text-xs bg-gray-100 px-2 py-1 rounded">
            {pollutionData?.pollutionLevels?.length || 0} data points
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200 h-60">
          <canvas ref={no2ChartRef}></canvas>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">PM2.5 Levels Over Time</h3>
          <div className="text-xs bg-gray-100 px-2 py-1 rounded">
            {pollutionData?.pollutionLevels?.length || 0} data points
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-gray-200 h-60">
          <canvas ref={pm25ChartRef}></canvas>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Risk Zone Distribution</h3>
        <div className="bg-white p-3 rounded-lg border border-gray-200 h-60">
          <canvas ref={riskChartRef}></canvas>
        </div>
      </div>
    </div>
  );
};

export default ChartTab;
