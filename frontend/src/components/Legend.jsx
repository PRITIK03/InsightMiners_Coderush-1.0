import React from 'react';

const Legend = () => {
  return (
    <div className="absolute bottom-5 right-5 bg-white p-4 rounded-lg shadow-lg z-[1000] border border-gray-200">
      <h3 className="font-bold text-sm mb-3 text-gray-700">Pollution Risk Zones</h3>
      
      <div className="space-y-3">
        <div className="flex items-center">
          <div className="flex items-center justify-center mr-3">
            <span className="inline-block w-5 h-5 rounded-full bg-red-500 opacity-70"></span>
            <span className="inline-block w-10 h-0.5 bg-gradient-to-r from-red-500 to-transparent"></span>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-800">High Risk</span>
            <p className="text-xs text-gray-500">Immediate action required</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="flex items-center justify-center mr-3">
            <span className="inline-block w-5 h-5 rounded-full bg-yellow-500 opacity-70"></span>
            <span className="inline-block w-10 h-0.5 bg-gradient-to-r from-yellow-500 to-transparent"></span>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-800">Medium Risk</span>
            <p className="text-xs text-gray-500">Monitor & plan interventions</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="flex items-center justify-center mr-3">
            <span className="inline-block w-5 h-5 rounded-full bg-green-600 opacity-70"></span>
            <span className="inline-block w-10 h-0.5 bg-gradient-to-r from-green-600 to-transparent"></span>
          </div>
          <div>
            <span className="text-xs font-semibold text-gray-800">Low Risk</span>
            <p className="text-xs text-gray-500">Continue preventive measures</p>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-green-500 via-yellow-500 to-red-500 rounded-full"></div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Low Pollution</span>
            <span>High Pollution</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Legend;
