import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaMusic } from 'react-icons/fa';

const Keys = ({ settings, onSettingsChange }) => {
  const navigate = useNavigate();

  // All major keys from MAJOR_SCALE_DEGREES
  const majorKeys = [
    { key: 'C', label: 'C' },
    { key: 'C#', label: 'C#' },
    { key: 'D', label: 'D' },
    { key: 'D#', label: 'D#' },
    { key: 'E', label: 'E' },
    { key: 'F', label: 'F' },
    { key: 'F#', label: 'F#' },
    { key: 'G', label: 'G' },
    { key: 'G#', label: 'G#' },
    { key: 'A', label: 'A' },
    { key: 'A#', label: 'A#' },
    { key: 'B', label: 'B' }
  ];

  // All minor keys from MINOR_SCALE_DEGREES
  const minorKeys = [
    { key: 'Am', label: 'Am' },
    { key: 'A#m', label: 'A#m' },
    { key: 'Bm', label: 'Bm' },
    { key: 'Cm', label: 'Cm' },
    { key: 'C#m', label: 'C#m' },
    { key: 'Dm', label: 'Dm' },
    { key: 'D#m', label: 'D#m' },
    { key: 'Em', label: 'Em' },
    { key: 'Fm', label: 'Fm' },
    { key: 'F#m', label: 'F#m' },
    { key: 'Gm', label: 'Gm' },
    { key: 'G#m', label: 'G#m' }
  ];

  // Random option
  const randomOption = { key: 'random', label: 'Random' };

  // Keep keys separate for organized display

  const handleBackClick = () => {
    navigate(-1); // Go back to previous page in history
  };

  const handleKeyClick = (key) => {
    // Update the key setting in the shared settings
    onSettingsChange({
      ...settings,
      key: key
    });
    
    // Automatically navigate back to the previous page
    navigate(-1);
  };

  const renderKeyButton = ({ key, label }) => {
    const isSelected = settings.key === key;

    return (
      <button
        key={key}
        className={`btn btn-lg h-24 py-6 px-4 transition-all duration-300 transform hover:scale-105 ${
          isSelected 
            ? 'btn-primary shadow-lg' 
            : 'btn-outline btn-primary hover:btn-primary'
        }`}
        onClick={() => handleKeyClick(key)}
      >
        <span className="text-lg font-semibold">{label}</span>
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
              aria-label="Back to Intervals"
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
                Select Key
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
              Choose a Key
            </h2>
            <p className="text-gray-600">
              Select the key signature for your practice session
            </p>
          </div>
        
          {/* Keys Grid */}
          <div className="card-body p-8 space-y-8">
            
            {/* Major Keys Section */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Major Keys</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {majorKeys.map((keyOption) => renderKeyButton(keyOption))}
              </div>
            </div>

            {/* Minor Keys Section */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Minor Keys</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {minorKeys.map((keyOption) => renderKeyButton(keyOption))}
              </div>
            </div>

            {/* Random Option Section */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Special</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {renderKeyButton(randomOption)}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Keys;