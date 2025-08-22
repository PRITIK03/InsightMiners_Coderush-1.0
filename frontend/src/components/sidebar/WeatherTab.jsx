import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

const WeatherTab = ({ pollutionData }) => {
  const weatherChartRef = useRef(null);
  const correlationChartRef = useRef(null);
  const weatherChartInstance = useRef(null);
  const correlationChartInstance = useRef(null);
  
  useEffect(() => {
    if (pollutionData && 
        pollutionData.pollutionLevels && 
        pollutionData.pollutionLevels[0] && 
        pollutionData.pollutionLevels[0].weather_data) {
      
      const weatherData = pollutionData.pollutionLevels[0].weather_data;
      const correlations = pollutionData.pollutionLevels[0].weather_correlations?.correlations || {};
      
      // Create weather chart
      createWeatherChart(weatherData);
      
      // Create correlation chart if correlations exist
      if (Object.keys(correlations).length > 0) {
        createCorrelationChart(correlations);
      }
    }
    
    return () => {
      if (weatherChartInstance.current) {
        weatherChartInstance.current.destroy();
      }
      if (correlationChartInstance.current) {
        correlationChartInstance.current.destroy();
      }
    };
  }, [pollutionData]);
  
  const createWeatherChart = (weatherData) => {
    if (weatherChartInstance.current) {
      weatherChartInstance.current.destroy();
    }
    
    const ctx = weatherChartRef.current.getContext('2d');
    
    // Convert string dates to Date objects
    const dates = weatherData.map(d => new Date(d.date));
    const temperatures = weatherData.map(d => d.temperature);
    const humidity = weatherData.map(d => d.humidity);
    
    weatherChartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Temperature (°C)',
            data: temperatures,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            yAxisID: 'y',
            fill: true
          },
          {
            label: 'Humidity (%)',
            data: humidity,
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            yAxisID: 'y1',
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          title: {
            display: true,
            text: 'Temperature and Humidity'
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              tooltipFormat: 'PP'
            },
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Temperature (°C)'
            },
            position: 'left',
          },
          y1: {
            title: {
              display: true,
              text: 'Humidity (%)'
            },
            position: 'right',
            grid: {
              drawOnChartArea: false,
            },
          }
        }
      }
    });
  };
  
  const createCorrelationChart = (correlations) => {
    if (correlationChartInstance.current) {
      correlationChartInstance.current.destroy();
    }
    
    const ctx = correlationChartRef.current.getContext('2d');
    
    // Prepare correlation data
    const labels = [];
    const data = [];
    const backgroundColors = [];
    
    for (const [key, value] of Object.entries(correlations)) {
      const [weather, pollutant] = key.split('_');
      const formattedLabel = `${weather.charAt(0).toUpperCase() + weather.slice(1)} / ${pollutant === 'no2_level' ? 'NO₂' : 'PM2.5'}`;
      
      labels.push(formattedLabel);
      data.push(parseFloat(value).toFixed(2));
      
      // Color based on correlation strength and direction
      if (value > 0.6) {
        backgroundColors.push('rgba(255, 99, 132, 0.7)'); // Strong positive - red
      } else if (value > 0.3) {
        backgroundColors.push('rgba(255, 159, 64, 0.7)'); // Moderate positive - orange
      } else if (value > 0) {
        backgroundColors.push('rgba(255, 205, 86, 0.7)'); // Weak positive - yellow
      } else if (value > -0.3) {
        backgroundColors.push('rgba(75, 192, 192, 0.7)'); // Weak negative - teal
      } else if (value > -0.6) {
        backgroundColors.push('rgba(54, 162, 235, 0.7)'); // Moderate negative - blue
      } else {
        backgroundColors.push('rgba(153, 102, 255, 0.7)'); // Strong negative - purple
      }
    }
    
    correlationChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Correlation Coefficient',
            data: data,
            backgroundColor: backgroundColors
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Weather-Pollution Correlations'
          },
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                const value = parseFloat(context.parsed.y);
                let strength = 'No correlation';
                
                if (Math.abs(value) > 0.7) strength = 'Very strong';
                else if (Math.abs(value) > 0.5) strength = 'Strong';
                else if (Math.abs(value) > 0.3) strength = 'Moderate';
                else if (Math.abs(value) > 0.1) strength = 'Weak';
                
                return `${strength} ${value > 0 ? 'positive' : 'negative'} correlation`;
              }
            }
          }
        },
        scales: {
          y: {
            min: -1,
            max: 1,
            title: {
              display: true,
              text: 'Correlation Coefficient'
            }
          }
        }
      }
    });
  };
  
  // Display trend explanations if available
  const renderTrendExplanations = () => {
    const explanations = pollutionData?.pollutionLevels?.[0]?.trend_explanations;
    
    if (!explanations || explanations.length === 0) {
      return (
        <div className="text-gray-500 italic">
          No trend explanations available. Additional data may be needed.
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {explanations.map((explanation, index) => (
          <div key={index} className="text-sm p-2 bg-blue-50 rounded">
            {explanation}
          </div>
        ))}
      </div>
    );
  };
  
  if (!pollutionData || 
      !pollutionData.pollutionLevels || 
      !pollutionData.pollutionLevels[0] || 
      !pollutionData.pollutionLevels[0].weather_data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-500">No weather data available</div>
          <div className="text-sm text-gray-400 mt-2">Try updating with a different date range or location</div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-3 flex items-center">
        Weather Analysis
        <span className="ml-2 text-xs text-gray-500">(correlated with pollution)</span>
      </h3>
      
      <div className="mb-6">
        <div className="bg-white p-3 rounded-lg border border-gray-200 h-60">
          <canvas ref={weatherChartRef}></canvas>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="bg-white p-3 rounded-lg border border-gray-200 h-60">
          <canvas ref={correlationChartRef}></canvas>
        </div>
      </div>
      
      <div className="mb-6">
        <h4 className="font-medium mb-2">Trend Explanations</h4>
        <div className="bg-white p-3 rounded-lg border border-gray-200">
          {renderTrendExplanations()}
        </div>
      </div>
    </div>
  );
};

export default WeatherTab;
