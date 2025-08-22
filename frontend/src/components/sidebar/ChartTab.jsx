import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const ChartTab = ({ pollutionData }) => {
  const no2ChartRef = useRef(null);
  const pm25ChartRef = useRef(null);
  const riskChartRef = useRef(null);
  
  const no2ChartInstance = useRef(null);
  const pm25ChartInstance = useRef(null);
  const riskChartInstance = useRef(null);
  
  useEffect(() => {
    if (pollutionData && pollutionData.pollutionLevels) {
      const dates = pollutionData.pollutionLevels.map(d => d.date);
      const no2Values = pollutionData.pollutionLevels.map(d => d.no2_level);
      const pm25Values = pollutionData.pollutionLevels.map(d => d.pm25_level);
      
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
  
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">NO2 Levels Over Time</h3>
        <div className="bg-white p-3 rounded-lg border border-gray-200 h-60">
          <canvas ref={no2ChartRef}></canvas>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">PM2.5 Levels Over Time</h3>
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
