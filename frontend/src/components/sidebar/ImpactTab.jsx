import React, { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';

const ImpactTab = ({ pollutionData }) => {
  const [impacts, setImpacts] = useState({
    health: [],
    economic: null,
    environmental: [],
    vulnerable: []
  });
  
  const healthChartRef = useRef(null);
  const healthChartInstance = useRef(null);

  useEffect(() => {
    if (pollutionData && pollutionData.pollutionLevels && pollutionData.pollutionLevels.length > 0) {
      // Extract key metrics for impact assessment
      const summary = pollutionData.pollutionLevels[0].summary || {};
      const avgNo2 = summary.avg_no2 || 0;
      const avgPm25 = summary.avg_pm25 || 0;
      const location = pollutionData.pollutionLevels[0].location;
      
      // Total affected population across all risk zones
      const totalAffectedPopulation = pollutionData.riskZones.reduce((total, zone) => 
        total + (zone.estimated_affected_population || 0), 0);
      
      // Count zones by risk level
      const riskCounts = {
        high: pollutionData.riskZones.filter(z => z.risk_level === 'high').length,
        medium: pollutionData.riskZones.filter(z => z.risk_level === 'medium').length,
        low: pollutionData.riskZones.filter(z => z.risk_level === 'low').length
      };
      
      // Calculate impacts based on actual pollution levels
      calculateImpacts(avgNo2, avgPm25, totalAffectedPopulation, riskCounts, location);
      
      // Create health impact chart
      createHealthImpactChart(avgNo2, avgPm25);
    }
    
    // Cleanup function to destroy chart when component unmounts
    return () => {
      if (healthChartInstance.current) {
        healthChartInstance.current.destroy();
      }
    };
  }, [pollutionData]);
  
  // Create health impact chart
  const createHealthImpactChart = (avgNo2, avgPm25) => {
    try {
      if (healthChartInstance.current) {
        healthChartInstance.current.destroy();
      }
      if (!healthChartRef.current) return;
      const ctx = healthChartRef.current.getContext('2d');
      // Ensure numeric values
      const aNo2 = Number(avgNo2) || 0;
      const aPm25 = Number(avgPm25) || 0;

      const respiratoryImpact = calculateHealthImpactPercentage(aPm25, 25, 0.5) + 
                               calculateHealthImpactPercentage(aNo2, 40, 0.3);
      const cardiovascularImpact = calculateHealthImpactPercentage(aPm25, 25, 0.4) + 
                                  calculateHealthImpactPercentage(aNo2, 40, 0.2);
      const asthmaImpact = calculateHealthImpactPercentage(aPm25, 25, 0.3) + 
                          calculateHealthImpactPercentage(aNo2, 40, 0.5);

      healthChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Respiratory', 'Cardiovascular', 'Asthma'],
          datasets: [{
            label: 'Estimated Increased Health Risk (%)',
            data: [
              Number.isFinite(respiratoryImpact) ? +respiratoryImpact.toFixed(1) : 0,
              Number.isFinite(cardiovascularImpact) ? +cardiovascularImpact.toFixed(1) : 0,
              Number.isFinite(asthmaImpact) ? +asthmaImpact.toFixed(1) : 0
            ],
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Increased Disease Risk from Pollution' },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const y = context.parsed.y || 0;
                  return `${y.toFixed(1)}% increased risk`;
                }
              }
            }
          },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Increased Risk (%)' } }
          }
        }
      });
    } catch (err) {
      console.error('Error creating health chart', err);
    }
  };
  
  // Helper function to calculate health impact percentage
  const calculateHealthImpactPercentage = (value, threshold, factor) => {
    if (value <= threshold) return 0;
    return ((value - threshold) / threshold) * 100 * factor;
  };
  
  // Calculate real impacts based on WHO guidelines and scientific research
  const calculateImpacts = (avgNo2, avgPm25, population, riskCounts, location) => {
    const healthImpacts = [];
    const environmentalImpacts = [];
    const vulnerableGroups = [];
    let economicImpact = null;
    
    // Health impacts based on PM2.5 levels - based on WHO research
    if (avgPm25 > 35) {
      healthImpacts.push({
        severity: 'high',
        impact: 'Significant increase in respiratory diseases, cardiovascular problems, and premature mortality',
        metric: `PM2.5: ${avgPm25.toFixed(1)} μg/m³ (${(avgPm25/25).toFixed(1)}x WHO guideline)`
      });
      
      // Calculate estimated mortality increase using WHO formula (simplified)
      const mortalityIncrease = ((avgPm25 - 10) * 0.6) / 100; // 0.6% increase per 1 μg/m³ above 10 μg/m³
      healthImpacts.push({
        severity: 'high',
        impact: `Estimated ${(mortalityIncrease * 100).toFixed(1)}% increase in mortality risk for exposed population`,
        metric: `Affecting ~${Math.round(population * mortalityIncrease).toLocaleString()} people`
      });
    } else if (avgPm25 > 25) {
      healthImpacts.push({
        severity: 'medium',
        impact: 'Increased risk of respiratory symptoms, aggravation of heart and lung diseases',
        metric: `PM2.5: ${avgPm25.toFixed(1)} μg/m³ (${(avgPm25/25).toFixed(1)}x WHO guideline)`
      });
    } else if (avgPm25 > 10) {
      healthImpacts.push({
        severity: 'low',
        impact: 'Mild respiratory effects in sensitive individuals',
        metric: `PM2.5: ${avgPm25.toFixed(1)} μg/m³ (within acceptable range)`
      });
    }
    
    // Health impacts based on NO2 levels
    if (avgNo2 > 60) {
      healthImpacts.push({
        severity: 'high',
        impact: 'Significant inflammation of airways, reduced lung function, higher asthma incidence',
        metric: `NO₂: ${avgNo2.toFixed(1)} μg/m³ (${(avgNo2/40).toFixed(1)}x WHO guideline)`
      });
    } else if (avgNo2 > 40) {
      healthImpacts.push({
        severity: 'medium',
        impact: 'Increased bronchial reactivity, inflammation of airways, decreased lung function',
        metric: `NO₂: ${avgNo2.toFixed(1)} μg/m³ (${(avgNo2/40).toFixed(1)}x WHO guideline)`
      });
    }
    
    // Vulnerable groups based on pollution levels
    if (avgPm25 > 25 || avgNo2 > 40) {
      vulnerableGroups.push({
        group: 'Children under 5',
        impact: 'Higher risk of developing asthma, reduced lung development',
        percentage: '8-10% of population'
      });
      vulnerableGroups.push({
        group: 'Elderly (65+)',
        impact: 'Increased risk of heart and lung diseases, exacerbation of chronic conditions',
        percentage: '7-9% of population'
      });
      vulnerableGroups.push({
        group: 'People with respiratory conditions',
        impact: 'Aggravation of existing conditions, increased medication needs, reduced quality of life',
        percentage: '5-7% of population'
      });
      vulnerableGroups.push({
        group: 'Outdoor workers',
        impact: 'Prolonged exposure during workday, increased respiratory symptoms',
        percentage: '10-15% of population'
      });
    }
    
    // Environmental impacts based on pollutant levels
    if (avgNo2 > 40) {
      const no2Pct = Math.max(0, ((avgNo2 / 40) - 1) * 100);
      environmentalImpacts.push({
        severity: avgNo2 > 60 ? 'high' : 'medium',
        impact: 'Acid rain formation affecting water bodies and vegetation',
        metric: `NO₂ levels ${no2Pct.toFixed(1)}% above safe threshold`
      });
    }
    
    if (avgPm25 > 25) {
      const pm25Pct = Math.max(0, ((avgPm25 / 25) - 1) * 100);
      environmentalImpacts.push({
        severity: avgPm25 > 35 ? 'high' : 'medium',
        impact: 'Reduced visibility, soil/water contamination, ecosystem damage',
        metric: `PM2.5 levels ${pm25Pct.toFixed(1)}% above safe threshold`
      });
    }
    
    // Economic impact calculation
    if (avgPm25 > 10 || avgNo2 > 20) {
      // Base calculation on WHO economic burden formula (simplified)
      let healthcareCost = 0;
      let productivityLoss = 0;
      try {
        healthcareCost = estimateHealthcareCosts(avgPm25, avgNo2, population);
      } catch (e) {
        healthcareCost = 0;
      }
      try {
        productivityLoss = estimateProductivityLoss(avgPm25, avgNo2, population, location);
      } catch (e) {
        productivityLoss = 0;
      }
      
      economicImpact = {
        healthcare: Number.isFinite(healthcareCost) ? Math.max(0, Math.round(healthcareCost)) : 0,
        productivity: Number.isFinite(productivityLoss) ? Math.max(0, Math.round(productivityLoss)) : 0,
        total: (Number.isFinite(healthcareCost) ? Math.round(healthcareCost) : 0) + (Number.isFinite(productivityLoss) ? Math.round(productivityLoss) : 0)
      };
    }
    
    setImpacts({
      health: healthImpacts,
      economic: economicImpact,
      environmental: environmentalImpacts,
      vulnerable: vulnerableGroups
    });
  };
  
  // Helper functions for economic calculations
  const estimateHealthcareCosts = (pm25, no2, population) => {
    // Simplified healthcare cost calculation based on WHO studies
    // Average annual cost per person increases by ~$15-25 per 10μg/m³ increase in PM2.5
    const pm25Excess = Math.max(0, pm25 - 10); // Excess beyond WHO guideline
    const no2Excess = Math.max(0, no2 - 20); // Excess beyond half WHO guideline
    
    // Convert to Indian Rupees (1 USD ≈ 75 INR)
    const conversionRate = 75;
    const baseCostPerPerson = 1200; // Base annual healthcare cost in INR
    
    const totalCost = population * (baseCostPerPerson + (pm25Excess * 18 + no2Excess * 12) * conversionRate / 10);
    return Math.round(totalCost);
  };
  
  const estimateProductivityLoss = (pm25, no2, population, location) => {
    // Simplified productivity loss calculation
    // Each 10μg/m³ increase in PM2.5 reduces productivity by ~0.5-1%
    const pm25Excess = Math.max(0, pm25 - 10);
    const no2Excess = Math.max(0, no2 - 20);
    
    // Per capita GDP in different regions (INR per year, approximate)
    const gdpPerCapita = {
      'Nagpur': 150000,
      'Mumbai': 300000,
      'Delhi': 250000,
      'London': 3000000,
      'Shanghai': 1000000,
      'New York': 4000000
    };
    
    // Default GDP per capita if location not found (INR)
    const averageGdp = gdpPerCapita[location] || 200000;
    
    // Calculate productivity loss
    const lossPercentage = (pm25Excess * 0.08 + no2Excess * 0.05) / 100;
    return Math.round(population * averageGdp * lossPercentage);
  };
  
  // Format large numbers for display
  const formatNumber = (value) => {
    if (!value && value !== 0) return 'N/A';
    
    if (value >= 10000000) {
      return (value / 10000000).toFixed(2) + ' Cr';
    } else if (value >= 100000) {
      return (value / 100000).toFixed(2) + ' Lakh';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    } else {
      return value.toString();
    }
  };
  
  if (!pollutionData || !pollutionData.pollutionLevels || pollutionData.pollutionLevels.length === 0) {
    return <div className="text-center py-8 text-gray-500">No data available for impact analysis</div>;
  }

  // Get current pollution levels and location data
  const summary = pollutionData.pollutionLevels[0].summary || {};
  const avgNo2 = summary.avg_no2 || 0;
  const avgPm25 = summary.avg_pm25 || 0;
  const location = pollutionData.pollutionLevels[0].location;
  
  // Get total affected population
  const exposedPopulation = pollutionData.riskZones.reduce((total, zone) => 
    total + (zone.estimated_affected_population || 0), 0);

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Health & Economic Impact</h3>
      
      {/* Health Impact Chart */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Estimated Health Risk</h4>
        <div className="bg-white p-3 rounded-lg border border-gray-200 h-60">
          <canvas ref={healthChartRef}></canvas>
        </div>
      </div>
      
      {/* Health Impact Details */}
      {impacts.health.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-2">Health Concerns</h4>
          <div className="space-y-2">
            {impacts.health.map((item, index) => (
              <div 
                key={index} 
                className={`p-3 border-l-4 bg-white rounded shadow-sm
                  ${item.severity === 'high' ? 'border-red-500' : 
                    item.severity === 'medium' ? 'border-yellow-500' : 'border-green-500'}`}
              >
                <p className="mb-1">{item.impact}</p>
                <p className="text-xs text-gray-500">{item.metric}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Vulnerable Demographics */}
      {impacts.vulnerable.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-2">Vulnerable Demographics</h4>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="mb-2 text-sm">
              In {location}, an estimated {formatNumber(exposedPopulation)} people are exposed to current pollution levels.
            </p>
            <div className="space-y-3 mt-3">
              {impacts.vulnerable.map((group, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <div>
                    <p className="text-sm font-medium">{group.group} <span className="font-normal text-gray-500 text-xs">({group.percentage})</span></p>
                    <p className="text-xs text-gray-600">{group.impact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Environmental Impact */}
      {impacts.environmental.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-2">Environmental Effects</h4>
          <div className="space-y-2">
            {impacts.environmental.map((item, index) => (
              <div 
                key={index} 
                className={`p-3 border-l-4 bg-white rounded shadow-sm
                  ${item.severity === 'high' ? 'border-red-500' : 'border-yellow-500'}`}
              >
                <p className="mb-1">{item.impact}</p>
                {item.metric && <p className="text-xs text-gray-500">{item.metric}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Economic Impact */}
      <div>
        <h4 className="font-medium mb-2">Economic Burden</h4>
        {impacts.economic ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center md:col-span-1">
              <div className="text-lg font-bold text-red-600">₹{formatNumber(impacts.economic.healthcare)}</div>
              <div className="text-xs text-gray-500">Healthcare Costs</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center md:col-span-1">
              <div className="text-lg font-bold text-orange-500">₹{formatNumber(impacts.economic.productivity)}</div>
              <div className="text-xs text-gray-500">Productivity Loss</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center md:col-span-1">
              <div className="text-lg font-bold text-purple-600">₹{formatNumber(impacts.economic.total)}</div>
              <div className="text-xs text-gray-500">Total Economic Impact</div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <p className="text-sm text-gray-500">No significant economic impact at current pollution levels.</p>
          </div>
        )}
        
        <div className="mt-3 text-xs text-gray-500">
          Economic estimates are based on WHO burden of disease models and adjusted for local contexts.
          These are approximate figures intended to indicate the scale of economic impact.
        </div>
      </div>
    </div>
  );
};

export default ImpactTab;
