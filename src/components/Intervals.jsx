import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaMusic, FaPlay } from 'react-icons/fa';
import { useIntervals } from '../contexts/useIntervals';
import { AVAILABLE_INTERVALS } from '../utils/musicGenerator';
import Keys from './Keys';
import TimeSignatures from './TimeSignatures';

const Intervals = ({ settings, onSettingsChange }) => {
  const navigate = useNavigate();
  const { selectedIntervals, toggleInterval } = useIntervals();

  // Filter intervals to show only 2nd through 8th (excluding Unison)
  const displayIntervals = AVAILABLE_INTERVALS.filter(interval => interval.value >= 2 && interval.value <= 8);

  const handleBackClick = () => {
    navigate('/dashboard');
  };

  const handleKeyToggle = (newKey) => {
    // Update the key setting in the shared settings
    onSettingsChange({
      ...settings,
      key: newKey
    });
  };

  const handleTimeSignatureChange = (newTimeSignature) => {
    // Update the time signature setting in the shared settings
    onSettingsChange({
      ...settings,
      timeSignature: newTimeSignature
    });
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
              aria-label="Back to Dashboard"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back</span>
            </button>
            
            {/* Title */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <FaMusic className="text-white text-lg" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Intervals Practice
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
              Select Intervals
            </h2>
          </div>
        
          {/* Intervals Grid */}
          <div className="card-body p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayIntervals.map(({ value, label }) => {
                const isSelected = selectedIntervals.includes(value);
                return (
                  <button
                    key={value}
                    className={`btn btn-lg h-24 py-12 px-6 transition-all duration-300 transform hover:scale-105 ${
                      isSelected 
                        ? 'btn-primary shadow-lg' 
                        : 'btn-outline btn-primary hover:btn-primary'
                    }`}
                    onClick={() => toggleInterval(value)}
                    aria-pressed={isSelected}
                  >
                    <div className="flex flex-col items-center space-y-4">
                      <span className="font-bold text-2xl">{label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Keys Selection */}
        <div className="card bg-white shadow-lg mb-8 animate-slide-up">
          <div className="card-body p-8">
            <Keys
              selectedKeys={[settings.key]}
              onKeyToggle={handleKeyToggle}
              allowMultiple={false}
              showRandom={true}
            />
          </div>
        </div>

        {/* Time Signatures Selection */}
        <div className="card bg-white shadow-lg mb-8 animate-slide-up">
          <div className="card-body p-8">
            <TimeSignatures
              selectedTimeSignature={settings.timeSignature}
              onTimeSignatureChange={handleTimeSignatureChange}
              showLabels={true}
            />
          </div>
        </div>

        {/* Practice Button */}
        <div className="text-center animate-scale-in">
          <button 
            className="btn btn-success btn-lg px-8 py-4"
            onClick={() => navigate('/practice')}
            disabled={selectedIntervals.length === 0}
          >
            <FaPlay className="mr-3" />
            Start Practice
            {selectedIntervals.length > 0 && (
              <div className="badge badge-white text-success ml-3">
                {selectedIntervals.length}
              </div>
            )}
          </button>
          
          {selectedIntervals.length === 0 && (
            <p className="text-gray-500 text-sm mt-3">
              Please select at least one interval to start practicing
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Intervals;