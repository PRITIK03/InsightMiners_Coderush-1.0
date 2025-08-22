import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const ImpactTab = ({ pollutionData }) => {
  const healthChartRef = useRef(null);
  const healthChartInstance = useRef(null);
  
  useEffect(() => {
    if (pollutionData && pollutionData.pollutionLevels && pollutionData.pollutionLevels.length > 0) {
      const avgPm25 = pollutionData.pollutionLevels[0].summary?.avg_pm25 || 0;
      
      // Estimate exposed population
      const location = pollutionData.pollutionLevels[0].location;
      const exposedPopulation = estimateExposedPopulation(location);
      
      // Estimate health impacts (simplified model)
      const respiratoryIssues = Math.round(exposedPopulation * avgPm25 * 0.0007);
      const cardiovascularIssues = Math.round(exposedPopulation * avgPm25 * 0.0005);
      const asthmaExacerbations = Math.round(exposedPopulation * avgPm25 * 0.0012);
      const workdaysMissed = Math.round(exposedPopulation * avgPm25 * 0.003);
      
      // Health Impact Chart
      if (healthChartInstance.current) {
        healthChartInstance.current.destroy();
      }
      
      healthChartInstance.current = new Chart(healthChartRef.current, {
        type: 'bar',
        data: {
          labels: ['Respiratory Issues', 'Cardiovascular Issues', 'Asthma Exacerbations', 'Work Days Missed'],
          datasets: [{
            label: 'Estimated Cases',
            data: [respiratoryIssues, cardiovascularIssues, asthmaExacerbations, workdaysMissed],
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }
    
    return () => {
      if (healthChartInstance.current) {
        healthChartInstance.current.destroy();
      }
    };
  }, [pollutionData]);
  
  // Helper function to estimate exposed population
  const estimateExposedPopulation = (location) => {
    const regionPopulations = {
      'Nagpur': 2400000,
      'Mumbai': 12400000,
      'Delhi': 19000000,
      'London': 8900000
    };
    
    const population = regionPopulations[location] || 1000000;
    
    // Estimate that about 30% of population is in high pollution areas
    return Math.round(population * 0.3);
  };
  
  // Helper functions to estimate economic impact
  const estimateHealthcareCosts = (avgPm25, exposedPopulation) => {
    // Very simplified model - in reality this would be much more complex
    const annualPerPersonCost = 1200; // Cost in INR per person per year per 10 μg/m³ of PM2.5
    return Math.round(exposedPopulation * annualPerPersonCost * (avgPm25 / 10));
  };
  
  const estimateProductivityLoss = (avgPm25, exposedPopulation) => {
    // Simplified model
    const dailyWage = 500; // Average daily wage in INR
    const workingPopulation = exposedPopulation * 0.65; // Assuming 65% are working age
    const daysLostPer100 = avgPm25 * 0.03; // Days lost per 100 people
    
    return Math.round(workingPopulation * daysLostPer100 * dailyWage / 100);
  };
  
  // Format large currency values
  const formatCurrency = (value) => {
    if (value >= 10000000) {
      return (value / 10000000).toFixed(2) + ' Cr';
    } else if (value >= 100000) {
      return (value / 100000).toFixed(2) + ' L';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'K';
    } else {
      return value.toString();
    }
  };
  
  // Format large numbers
  const formatNumber = (value) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(2) + ' million';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    } else {
      return value.toString();
    }
  };
  
  if (!pollutionData || !pollutionData.pollutionLevels || !pollutionData.pollutionLevels[0]) {
    return <div>No impact data available</div>;
  }
  
  const avgPm25 = pollutionData.pollutionLevels[0].summary?.avg_pm25 || 0;
  const location = pollutionData.pollutionLevels[0].location;
  const exposedPopulation = estimateExposedPopulation(location);
  const healthcareCosts = estimateHealthcareCosts(avgPm25, exposedPopulation);
  const productivityLoss = estimateProductivityLoss(avgPm25, exposedPopulation);
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Health & Economic Impact</h3>
      
      {/* Health Impact Chart */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Estimated Health Impact</h4>
        <div className="bg-white p-3 rounded-lg border border-gray-200 h-60">
          <canvas ref={healthChartRef}></canvas>
        </div>
      </div>
      
      {/* Demographic Analysis */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Demographic Exposure</h4>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p>
            In {location}, approximately {formatNumber(exposedPopulation)} people 
            are exposed to elevated pollution levels. This includes an estimated 
            {formatNumber(Math.round(exposedPopulation * 0.12))} vulnerable individuals 
            (elderly and children under 5).
          </p>
        </div>
      </div>
      
      {/* Economic Impact */}
      <div>
        <h4 className="font-medium mb-2">Economic Impact</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-xl font-bold text-red-600">₹{formatCurrency(healthcareCosts)}</div>
            <div className="text-xs text-gray-500">Est. Healthcare Costs</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <div className="text-xl font-bold text-red-600">₹{formatCurrency(productivityLoss)}</div>
            <div className="text-xs text-gray-500">Est. Productivity Loss</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactTab;
