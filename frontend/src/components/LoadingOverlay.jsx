import React from 'react';

const LoadingOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-2xl flex flex-col items-center">
        <div className="spinner-india w-12 h-12 mb-4"></div>
        <div className="text-gray-800 font-semibold">Loading Data...</div>
        <div className="text-gray-500 text-sm mt-1">Please wait while we fetch the latest information</div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
