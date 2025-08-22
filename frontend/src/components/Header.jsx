import React from 'react';

const Header = () => {
  return (
    <header className="bg-gradient-to-r from-blue-800 to-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Pollution Detection System</h1>
          <p className="text-sm opacity-80">Satellite-based monitoring of air quality and pollution</p>
        </div>
        
        <div className="flex gap-2">
          <button className="bg-blue-700 hover:bg-blue-900 px-4 py-2 rounded text-sm">
            Export Report
          </button>
          <button className="bg-blue-700 hover:bg-blue-900 px-4 py-2 rounded text-sm">
            View Recommendations
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
