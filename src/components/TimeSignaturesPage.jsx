import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaClock } from 'react-icons/fa';
import { AVAILABLE_TIME_SIGNATURES } from '../utils/musicGenerator';

const TimeSignaturesPage = ({ settings, onSettingsChange }) => {
  const navigate = useNavigate();

  // All available time signatures
  const timeSignatures = AVAILABLE_TIME_SIGNATURES;

  const handleBackClick = () => {
    navigate(-1); // Go back to previous page in history
  };

  const handleTimeSignatureClick = (timeSignature) => {
    // Update the time signature setting in the shared settings
    onSettingsChange({
      ...settings,
      timeSignature: timeSignature
    });
    
    // Automatically navigate back to the previous page
    navigate(-1);
  };

  const renderTimeSignatureButton = (timeSignature) => {
    const isSelected = settings.timeSignature === timeSignature;

    return (
      <button
        key={timeSignature}
        className={`btn btn-lg h-24 py-6 px-4 transition-all duration-300 transform hover:scale-105 ${
          isSelected 
            ? 'btn-primary shadow-lg' 
            : 'btn-outline btn-primary hover:btn-primary'
        }`}
        onClick={() => handleTimeSignatureClick(timeSignature)}
      >
        <span className="text-lg font-semibold">{timeSignature}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Back Button */}
            <button 
              className="btn btn-ghost btn-sm"
              onClick={handleBackClick}
              aria-label="Back to Previous Page"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </button>
            
            {/* Title */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <FaClock className="text-white text-lg" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Select Time Signature
              </h1>
            </div>
            
            {/* Spacer for centering */}
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="card bg-white shadow-lg mb-8 animate-fade-in">
          
          {/* Welcome Section */}
          <div className="card-body p-8 text-center animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Choose a Time Signature
            </h2>
            <p className="text-gray-600">
              Select the time signature for your practice session
            </p>
          </div>
        
          {/* Time Signatures Grid */}
          <div className="card-body p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {timeSignatures.map(renderTimeSignatureButton)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TimeSignaturesPage;