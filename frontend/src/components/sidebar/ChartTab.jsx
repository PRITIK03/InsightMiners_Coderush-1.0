import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

const ChartTab = ({ pollutionData }) => {
  const no2ChartRef = useRef(null);
  const pm25ChartRef = useRef(null);
  const riskChartRef = useRef(null);
  const sourceChartRef = useRef(null);
  const yearComparisonRef = useRef(null);
  const populationExposureRef = useRef(null);
  
  const no2ChartInstance = useRef(null);
  const pm25ChartInstance = useRef(null);
  const riskChartInstance = useRef(null);
  const sourceChartInstance = useRef(null);
  const yearComparisonInstance = useRef(null);
  const populationExposureInstance = useRef(null);
  
  useEffect(() => {
    if (pollutionData && pollutionData.pollutionLevels) {
      // Simulated data for new charts (replace with real data when available)
      const pollutionSources = {
        'Vehicle Emissions': 35,
        'Industrial': 25,
        'Construction': 15,
        'Residential': 15,
        'Agriculture': 10
      };

      const populationExposure = {
        labels: ['Safe Levels', 'Moderate', 'Unhealthy', 'Very Unhealthy', 'Hazardous'],
        data: [45, 25, 15, 10, 5]
      };

      const yearlyData = {
        '2023': { no2: 30, pm25: 20 },
        '2024': { no2: 28, pm25: 18 },
        '2025': { no2: 32, pm25: 22 }
      };
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
              'rgba(239, 68, 68, 0.7)',
              'rgba(245, 158, 11, 0.7)',
              'rgba(16, 185, 129, 0.7)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });

      // Pollution Sources Chart
      if (sourceChartInstance.current) {
        sourceChartInstance.current.destroy();
      }

      sourceChartInstance.current = new Chart(sourceChartRef.current, {
        type: 'doughnut',
        data: {
          labels: Object.keys(pollutionSources),
          datasets: [{
            data: Object.values(pollutionSources),
            backgroundColor: [
              'rgba(37, 99, 235, 0.7)',
              'rgba(5, 150, 105, 0.7)',
              'rgba(245, 158, 11, 0.7)',
              'rgba(139, 92, 246, 0.7)',
              'rgba(236, 72, 153, 0.7)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right'
            },
            title: {
              display: true,
              text: 'Major Sources of Pollution (%)'
            }
          }
        }
      });

      // Year-over-Year Comparison
      if (yearComparisonInstance.current) {
        yearComparisonInstance.current.destroy();
      }

      yearComparisonInstance.current = new Chart(yearComparisonRef.current, {
        type: 'bar',
        data: {
          labels: Object.keys(yearlyData),
          datasets: [
            {
              label: 'NO2 Levels',
              data: Object.values(yearlyData).map(d => d.no2),
              backgroundColor: 'rgba(37, 99, 235, 0.7)',
              borderColor: 'rgb(37, 99, 235)',
              borderWidth: 1
            },
            {
              label: 'PM2.5 Levels',
              data: Object.values(yearlyData).map(d => d.pm25),
              backgroundColor: 'rgba(5, 150, 105, 0.7)',
              borderColor: 'rgb(5, 150, 105)',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Concentration (µg/m³)'
              }
            }
          },
          plugins: {
            legend: {
              position: 'top'
            }
          }
        }
      });

      // Population Exposure Chart
      if (populationExposureInstance.current) {
        populationExposureInstance.current.destroy();
      }

      populationExposureInstance.current = new Chart(populationExposureRef.current, {
        type: 'bar',
        data: {
          labels: populationExposure.labels,
          datasets: [{
            label: 'Population Percentage',
            data: populationExposure.data,
            backgroundColor: [
              'rgba(16, 185, 129, 0.7)',
              'rgba(245, 158, 11, 0.7)',
              'rgba(239, 68, 68, 0.7)',
              'rgba(139, 92, 246, 0.7)',
              'rgba(236, 72, 153, 0.7)'
            ],
            borderColor: [
              'rgb(16, 185, 129)',
              'rgb(245, 158, 11)',
              'rgb(239, 68, 68)',
              'rgb(139, 92, 246)',
              'rgb(236, 72, 153)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Population (%)'
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Population Exposure to Different Air Quality Levels'
            }
          }
        }
      });
    }
    
    return () => {
      // Cleanup function to destroy all charts
      [
        no2ChartInstance,
        pm25ChartInstance,
        riskChartInstance,
        sourceChartInstance,
        yearComparisonInstance,
        populationExposureInstance
      ].forEach(chart => {
        if (chart.current) {
          chart.current.destroy();
        }
      });
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
    <div className="charts-grid">
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">NO2 Levels Over Time</h3>
          <div className="data-badge">
            {pollutionData?.pollutionLevels?.length || 0} data points
          </div>
        </div>
        <div className="chart-content">
          <canvas ref={no2ChartRef}></canvas>
        </div>
      </div>
      
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">PM2.5 Levels Over Time</h3>
          <div className="data-badge">
            {pollutionData?.pollutionLevels?.length || 0} data points
          </div>
        </div>
        <div className="chart-content">
          <canvas ref={pm25ChartRef}></canvas>
        </div>
      </div>
      
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Risk Zone Distribution</h3>
        </div>
        <div className="chart-content">
          <canvas ref={riskChartRef}></canvas>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Pollution Sources Distribution</h3>
        </div>
        <div className="chart-content">
          <canvas ref={sourceChartRef}></canvas>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Year-over-Year Comparison</h3>
        </div>
        <div className="chart-content">
          <canvas ref={yearComparisonRef}></canvas>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Population Exposure Analysis</h3>
        </div>
        <div className="chart-content">
          <canvas ref={populationExposureRef}></canvas>
        </div>
      </div>
    </div>
  );
};

export default ChartTab;
