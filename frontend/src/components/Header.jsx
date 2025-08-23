import React, { useState } from 'react';
import ReportGenerator from '../utils/ReportGenerator';
import PolicyRecommendationsModal from './PolicyRecommendationsModal';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const handleExportReport = () => {
    // Try multiple sources to get the most complete data
    try {
      let data = window.currentPollutionData;
      
      // Store selected region for later use
      if (data && data.pollutionLevels && data.pollutionLevels.length > 0) {
        const region = data.pollutionLevels[0].location;
        window.selectedRegion = region;
        localStorage.setItem('selectedRegion', region);
      }
      
      // Combine with any region info from localStorage
      if (data && !data.region) {
        data.region = localStorage.getItem('selectedRegion') || 'Nagpur';
      }
      
      console.log("Exporting report with data:", data);
      ReportGenerator.exportPDF(data);
    } catch (error) {
      console.error("Error accessing pollution data:", error);
      // Use saved data or default values
      ReportGenerator.exportPDF();
    }
  };

  const handlePolicyRecommendations = () => {
    setShowPolicyModal(true);
  };

  return (
    <header className="bg-gradient-to-r from-indigo-900 via-blue-800 to-purple-900 text-white shadow-2xl relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-green-500/10"></div>
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-400/20 rounded-full animate-pulse"></div>
      {/* Fixed positioning to keep the ball visible during bounce animation */}
      <div className="absolute bottom-4 left-4 w-16 h-16 bg-green-400/10 rounded-full animate-pulse"></div>
      
      <div className="container mx-auto px-6 py-6 relative z-10">
        <div className="flex justify-between items-center">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-green-500 rounded-lg flex items-center justify-center transform hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="animate-fadeIn">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-300 to-green-300 bg-clip-text text-transparent">
                AirWatch India
              </h1>
              <p className="text-sm text-blue-200 font-medium">
                Advanced Satellite-based Air Quality Monitoring System
              </p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="hidden lg:flex items-center space-x-3">
            <button 
              onClick={handleExportReport}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Report
            </button>
            <button 
              onClick={handlePolicyRecommendations}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Policy Recommendations
            </button>
          </div>
          
          {/* Mobile menu button */}
          <button 
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors duration-300"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-6 pb-4 border-t border-white/20 pt-4 animate-slideDown">
            <div className="flex flex-col space-y-2">
              <button 
                onClick={handleExportReport}
                className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Export Report
              </button>
              <button 
                onClick={handlePolicyRecommendations}
                className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Policy Recommendations
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Policy Recommendations Modal */}
      {showPolicyModal && (
        <PolicyRecommendationsModal onClose={() => setShowPolicyModal(false)} />
      )}
    </header>
  );
};

export default Header;