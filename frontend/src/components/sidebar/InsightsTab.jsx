import React from 'react';

const InsightsTab = ({ pollutionData }) => {
  if (!pollutionData || !pollutionData.pollutionLevels || !pollutionData.pollutionLevels[0]) {
    return <div>No insight data available</div>;
  }
  
  const summary = pollutionData.pollutionLevels[0].summary || {};
  const avgNo2 = summary.avg_no2 || 0;
  const avgPm25 = summary.avg_pm25 || 0;
  const daysExceedingNo2 = summary.days_exceeding_who_no2 || 0;
  const daysExceedingPm25 = summary.days_exceeding_who_pm25 || 0;
  
  const highRiskCount = pollutionData.riskZones.filter(z => z.risk_level === 'high').length;
  
  // Calculate AQI (simplified version based on PM2.5)
  const calculateAQI = (pm25) => {
    if (pm25 <= 12) {
      return Math.round((50 - 0) / (12 - 0) * (pm25 - 0) + 0);
    } else if (pm25 <= 35.4) {
      return Math.round((100 - 51) / (35.4 - 12.1) * (pm25 - 12.1) + 51);
    } else if (pm25 <= 55.4) {
      return Math.round((150 - 101) / (55.4 - 35.5) * (pm25 - 35.5) + 101);
    } else {
      return Math.round((200 - 151) / (150.4 - 55.5) * (pm25 - 55.5) + 151);
    }
  };
  
  const aqi = calculateAQI(avgPm25);
  
  // Generate recommendations based on data
  const generateRecommendations = () => {
    const recommendations = [];
    
    if (avgPm25 > 55.4) { // Unhealthy level of PM2.5
      recommendations.push({
        severity: 'critical',
        text: 'Implement immediate vehicle restrictions in high-risk zones to reduce particulate matter.'
      });
    }
    
    if (avgNo2 > 40) { // Above WHO guideline for NO2
      recommendations.push({
        severity: 'warning',
        text: 'Strengthen industrial emission standards and increase monitoring of NOx-emitting facilities.'
      });
    }
    
    if (highRiskCount >= 3) {
      recommendations.push({
        severity: 'critical',
        text: 'Develop emergency response plan for multiple high-risk pollution zones, including public health alerts.'
      });
    }
    
    if (avgPm25 > 25) { // Above WHO guideline for PM2.5
      recommendations.push({
        severity: 'warning',
        text: 'Increase green barriers and urban forests to act as pollution sinks, especially around high-risk zones.'
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        severity: 'good',
        text: 'Current pollution levels are within acceptable limits. Continue monitoring and maintaining current policies.'
      });
    }
    
    return recommendations;
  };
  
  const recommendations = generateRecommendations();
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Key Insights</h3>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold">{avgNo2.toFixed(1)}</div>
          <div className="text-xs text-gray-500">
            Avg NO2 (μg/m³)
            <span className="inline-block ml-1 text-gray-400 cursor-help" title="WHO guideline: 40 μg/m³ (annual mean)">?</span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold">{avgPm25.toFixed(1)}</div>
          <div className="text-xs text-gray-500">
            Avg PM2.5 (μg/m³)
            <span className="inline-block ml-1 text-gray-400 cursor-help" title="WHO guideline: 25 μg/m³ (24-hour mean)">?</span>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold">{aqi}</div>
          <div className="text-xs text-gray-500">Air Quality Index</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold">{highRiskCount}</div>
          <div className="text-xs text-gray-500">High Risk Areas</div>
        </div>
      </div>
      
      {/* Trend Analysis */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Trend Analysis</h4>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          {summary.trend && summary.trend.no2_trend ? (
            <p>
              NO2 levels are {summary.trend.no2_trend.direction} 
              {summary.trend.no2_trend.is_significant ? ' significantly' : ''}.
              
              {summary.trend.pm25_trend && (
                <span> PM2.5 levels are {summary.trend.pm25_trend.direction}
                {summary.trend.pm25_trend.is_significant ? ' significantly' : ''}.
                </span>
              )}
              
              {daysExceedingNo2 > 0 && (
                <span> NO2 levels exceeded WHO guidelines on {daysExceedingNo2} days.</span>
              )}
              
              {daysExceedingPm25 > 0 && (
                <span> PM2.5 levels exceeded WHO guidelines on {daysExceedingPm25} days.</span>
              )}
            </p>
          ) : (
            <p>Analyzing pollution trends based on the available data...</p>
          )}
        </div>
      </div>
      
      {/* Policy Recommendations */}
      <div>
        <h4 className="font-medium mb-2">Policy Recommendations</h4>
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div 
              key={index} 
              className={`p-3 border-l-4 bg-white rounded shadow-sm
                ${rec.severity === 'critical' ? 'border-red-500' : 
                  rec.severity === 'warning' ? 'border-yellow-500' : 'border-green-500'}`}
            >
              {rec.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InsightsTab;
