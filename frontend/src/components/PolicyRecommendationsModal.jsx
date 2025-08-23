import React, { useEffect, useState } from 'react';

const PolicyRecommendationsModal = ({ onClose }) => {
  const [currentTab, setCurrentTab] = useState('immediate');
  const [recommendations, setRecommendations] = useState({
    immediate: [],
    midTerm: [],
    longTerm: []
  });
  
  useEffect(() => {
    // In a real application, this would fetch from an API based on pollution data
    // For now, we'll use static recommendations
    setRecommendations({
      immediate: [
        {
          title: 'Public Health Advisories',
          description: 'Issue alerts advising vulnerable populations (elderly, children, those with respiratory conditions) to limit outdoor activities.',
          implementation: 'Launch SMS alerts, mobile app notifications, and media broadcasts.'
        },
        {
          title: 'Odd-Even Vehicle Scheme',
          description: 'Implement temporary traffic restrictions allowing vehicles with odd/even number plates on alternating days.',
          implementation: 'Coordinate with traffic police and public transportation to increase service frequency.'
        },
        {
          title: 'Industrial Emissions Reduction',
          description: 'Mandate temporary reduction in production capacity for high-polluting industries.',
          implementation: 'Enforce 30-40% reduction in industrial activity for 72 hours in affected areas.'
        }
      ],
      midTerm: [
        {
          title: 'Enhanced Public Transport',
          description: 'Expand bus and metro services with electric vehicles to reduce private transport dependence.',
          implementation: '6-month timeline to increase service by 25% with electric buses on major routes.'
        },
        {
          title: 'Green Corridor Development',
          description: 'Establish urban forests and green corridors to absorb pollutants and improve air circulation.',
          implementation: 'Identify 10-15 locations for intensive plantation with native species resistant to pollution.'
        },
        {
          title: 'Industrial Emissions Standards',
          description: 'Implement stricter emissions standards for industrial units with incentives for clean technology adoption.',
          implementation: 'Revise permitted emissions levels by 20% with tax benefits for early adopters.'
        }
      ],
      longTerm: [
        {
          title: 'Clean Energy Transition',
          description: 'Develop comprehensive plan to shift power generation to renewable sources.',
          implementation: '5-year plan to achieve 50% renewable energy in the grid, with solar rooftops on government buildings.'
        },
        {
          title: 'City-Wide Air Quality Network',
          description: 'Deploy advanced air quality monitoring network with predictive analytics for early interventions.',
          implementation: 'Install 50+ monitoring stations integrated with weather data for accurate forecasting.'
        },
        {
          title: 'Urban Planning Reform',
          description: 'Revise zoning laws to separate industrial and residential areas with green buffer zones.',
          implementation: 'Create new master plan incorporating air quality as a primary design criterion.'
        },
        {
          title: 'Electric Vehicle Infrastructure',
          description: 'Develop comprehensive charging infrastructure and phase out fossil fuel vehicles.',
          implementation: 'Install 500+ charging stations and offer subsidies for EV adoption.'
        }
      ]
    });
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-purple-700 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Policy Recommendations</h2>
            <p className="text-blue-100 text-sm">Evidence-based interventions to improve air quality</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            className={`px-4 py-3 text-sm font-medium ${
              currentTab === 'immediate' 
                ? 'text-blue-600 border-b-2 border-blue-500' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
            onClick={() => setCurrentTab('immediate')}
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Immediate Action
            </span>
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              currentTab === 'midTerm' 
                ? 'text-blue-600 border-b-2 border-blue-500' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
            onClick={() => setCurrentTab('midTerm')}
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Mid-Term Strategy
            </span>
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              currentTab === 'longTerm' 
                ? 'text-blue-600 border-b-2 border-blue-500' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
            onClick={() => setCurrentTab('longTerm')}
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Long-Term Plan
            </span>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          <div className="space-y-6">
            {recommendations[currentTab].map((recommendation, index) => (
              <div 
                key={index}
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-800">{recommendation.title}</h3>
                </div>
                <div className="p-4">
                  <p className="mb-3 text-gray-700">{recommendation.description}</p>
                  <div className="mt-3">
                    <div className="text-sm font-medium text-gray-900">Implementation:</div>
                    <p className="text-sm text-gray-600">{recommendation.implementation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Recommendations based on WHO guidelines and local environmental conditions.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyRecommendationsModal;
