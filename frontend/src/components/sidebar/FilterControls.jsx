import React from 'react';

const FilterControls = ({ filters, onFilterChange, onUpdate }) => {
  return (
    <div className="bg-gray-50 p-4 rounded-t-lg">
      <h3 className="text-lg font-medium mb-3">Filter Data</h3>
      
      <div className="mb-3">
        <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">Region:</label>
        <select 
          id="region" 
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          value={filters.region}
          onChange={(e) => onFilterChange({ region: e.target.value })}
        >
          <option value="Nagpur">Nagpur</option>
          <option value="Mumbai">Mumbai</option>
          <option value="Delhi">Delhi</option>
        </select>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date:</label>
          <input 
            type="date" 
            id="startDate"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={filters.startDate}
            onChange={(e) => onFilterChange({ startDate: e.target.value })}
          />
        </div>
        
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date:</label>
          <input 
            type="date" 
            id="endDate"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={filters.endDate}
            onChange={(e) => onFilterChange({ endDate: e.target.value })}
          />
        </div>
      </div>
      
      <button 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow transition duration-200"
        onClick={onUpdate}
      >
        Update
      </button>
    </div>
  );
};

export default FilterControls;
