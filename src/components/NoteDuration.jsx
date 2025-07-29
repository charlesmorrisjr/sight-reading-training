import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaMusic, FaPlay } from 'react-icons/fa';
import { AVAILABLE_NOTE_DURATIONS } from '../utils/musicGenerator';
import Settings from './Settings';

const NoteDuration = ({ settings, onSettingsChange }) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleNoteDurationToggle = (duration) => {
    const currentDurations = settings.noteDurations || ['1/8', '1/4'];
    const newDurations = currentDurations.includes(duration)
      ? currentDurations.filter(d => d !== duration)
      : [...currentDurations, duration];
    
    // Ensure at least one duration is selected
    if (newDurations.length > 0) {
      const newSettings = { 
        ...settings, 
        noteDurations: newDurations
      };
      onSettingsChange(newSettings);
    }
  };

  const renderToggleButton = (duration) => {
    const isSelected = (settings.noteDurations || ['1/8', '1/4']).includes(duration.value);
    return (
      <button
        key={duration.value}
        className={`btn btn-lg h-24 py-12 px-6 transition-all duration-300 transform hover:scale-105 ${
          isSelected 
            ? 'btn-primary shadow-lg' 
            : 'btn-outline btn-primary hover:btn-primary'
        }`}
        onClick={() => handleNoteDurationToggle(duration.value)}
        aria-pressed={isSelected}
      >
        <div className="flex flex-col items-center space-y-2">
          <span className="font-bold text-lg">{duration.label}</span>
          <span className="text-sm opacity-75">{duration.value}</span>
        </div>
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
              aria-label="Back to previous page"
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
                Note Durations
              </h1>
            </div>
            
            {/* Spacer for centering */}
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Section */}
        <div className="card bg-white shadow-lg mb-8 animate-fade-in">
          <div className="card-body p-8 text-center animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Select Note Durations
            </h2>
            <p className="text-gray-600">
              Choose which note durations you'd like to practice
            </p>
          </div>
        </div>

        {/* Note Durations Grid */}
        <div className="card bg-white shadow-lg mb-8 animate-slide-up">
          <div className="card-body p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {AVAILABLE_NOTE_DURATIONS.map((duration) => renderToggleButton(duration))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NoteDuration;