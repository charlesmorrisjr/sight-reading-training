import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaMusic, FaPlay } from 'react-icons/fa';
import { 
  AVAILABLE_INTERVALS, 
  CHORD_PROGRESSIONS, 
  AVAILABLE_LEFT_HAND_PATTERNS, 
  AVAILABLE_RIGHT_HAND_PATTERNS 
} from '../utils/musicGenerator';
import Settings from './Settings';

const FreePractice = ({ settings, onSettingsChange }) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate('/dashboard');
  };

  const handleIntervalToggle = (intervalValue) => {
    const currentIntervals = settings.intervals || [1, 2, 3, 4, 5];
    const newIntervals = currentIntervals.includes(intervalValue)
      ? currentIntervals.filter(i => i !== intervalValue)
      : [...currentIntervals, intervalValue].sort((a, b) => a - b);
    
    // Ensure at least one interval is selected
    if (newIntervals.length > 0) {
      const newSettings = { 
        ...settings, 
        intervals: newIntervals
      };
      onSettingsChange(newSettings);
    }
  };

  const handleChordProgressionToggle = (progressionId) => {
    const currentProgressions = settings.chordProgressions || ['pop', '50s', 'pop-variation', 'basic-cadence', 'jazz', 'alternating', 'minor-start', 'variation'];
    const newProgressions = currentProgressions.includes(progressionId)
      ? currentProgressions.filter(p => p !== progressionId)
      : [...currentProgressions, progressionId];
    
    // Ensure at least one progression is selected
    if (newProgressions.length > 0) {
      const newSettings = { 
        ...settings, 
        chordProgressions: newProgressions
      };
      onSettingsChange(newSettings);
    }
  };

  const handleLeftHandPatternToggle = (patternId) => {
    // Always set as the single selected pattern (radio button behavior)
    const newSettings = { 
      ...settings, 
      leftHandPatterns: [patternId]
    };
    onSettingsChange(newSettings);
  };

  const handleRightHandPatternToggle = (patternId) => {
    // Always set as the single selected pattern (radio button behavior)
    const newSettings = { 
      ...settings, 
      rightHandPatterns: [patternId]
    };
    onSettingsChange(newSettings);
  };

  const renderToggleButton = (item, isSelected, onToggle, itemKey = 'id') => {
    const key = item[itemKey] || item.value;
    const label = item.label;
    
    return (
      <button
        key={key}
        className={`btn btn-lg h-24 py-12 px-6 transition-all duration-300 transform hover:scale-105 ${
          isSelected 
            ? 'btn-primary shadow-lg' 
            : 'btn-outline btn-primary hover:btn-primary'
        }`}
        onClick={() => onToggle(key)}
        aria-pressed={isSelected}
      >
        <div className="flex flex-col items-center space-y-4">
          <span className="font-bold text-lg">{label}</span>
        </div>
      </button>
    );
  };

  // Filter intervals to show only 2nd through 8th (excluding Unison)
  const displayIntervals = AVAILABLE_INTERVALS.filter(interval => interval.value >= 2 && interval.value <= 8);

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
                Free Practice
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
              Practice Anything
            </h2>
            <p className="text-gray-600">
              Customize your sight reading practice with full control over intervals, chord progressions, and hand patterns
            </p>
          </div>
        </div>

        {/* Practice Selection Cards */}
        <div className="space-y-8">
          {/* Intervals Section */}
          <div className="card bg-white shadow-lg animate-fade-in">
            <div className="card-body p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Intervals
                </h3>
                <p className="text-gray-600">
                  Select which intervals to practice (multiple selections allowed)
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayIntervals.map((interval) => 
                  renderToggleButton(
                    interval, 
                    (settings.intervals || [1, 2, 3, 4, 5]).includes(interval.value), 
                    handleIntervalToggle,
                    'value'
                  )
                )}
              </div>
            </div>
          </div>

          {/* Chord Progressions Section */}
          <div className="card bg-white shadow-lg animate-slide-up">
            <div className="card-body p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Chord Progressions
                </h3>
                <p className="text-gray-600">
                  Select which chord progressions to practice (multiple selections allowed)
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {CHORD_PROGRESSIONS.map((progression) => 
                  renderToggleButton(
                    progression, 
                    (settings.chordProgressions || ['pop', '50s', 'pop-variation', 'basic-cadence', 'jazz', 'alternating', 'minor-start', 'variation']).includes(progression.id), 
                    handleChordProgressionToggle
                  )
                )}
              </div>
            </div>
          </div>

          {/* Left Hand Patterns Section */}
          <div className="card bg-white shadow-lg animate-slide-up">
            <div className="card-body p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Left Hand Patterns
                </h3>
                <p className="text-gray-600">
                  Select one left hand pattern to practice
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {AVAILABLE_LEFT_HAND_PATTERNS.map((pattern) => 
                  renderToggleButton(
                    pattern, 
                    (settings.leftHandPatterns || ['block-chords']).includes(pattern.id), 
                    handleLeftHandPatternToggle
                  )
                )}
              </div>
            </div>
          </div>

          {/* Right Hand Patterns Section */}
          <div className="card bg-white shadow-lg animate-scale-in">
            <div className="card-body p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Right Hand Patterns
                </h3>
                <p className="text-gray-600">
                  Select one right hand pattern to practice
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {AVAILABLE_RIGHT_HAND_PATTERNS.map((pattern) => 
                  renderToggleButton(
                    pattern, 
                    (settings.rightHandPatterns || ['single-notes']).includes(pattern.id), 
                    handleRightHandPatternToggle
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Swap Hand Patterns Section */}
        <div className="card bg-white shadow-lg animate-scale-in">
          <div className="card-body p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Swap Hand Patterns
              </h3>
              <p className="text-gray-600">
                Switch left and right hand patterns with automatic octave adjustment
              </p>
            </div>
            
            <div className="flex justify-center">
              <button
                className={`btn btn-lg h-24 py-12 px-8 transition-all duration-300 transform hover:scale-105 ${
                  settings.swapHandPatterns 
                    ? 'btn-primary shadow-lg' 
                    : 'btn-outline btn-primary hover:btn-primary'
                }`}
                onClick={() => onSettingsChange({ ...settings, swapHandPatterns: !settings.swapHandPatterns })}
                aria-pressed={settings.swapHandPatterns}
              >
                <div className="flex flex-col items-center space-y-4">
                  <span className="font-bold text-lg">
                    {settings.swapHandPatterns ? 'Patterns Swapped' : 'Normal Patterns'}
                  </span>
                  <span className="text-sm opacity-75">
                    {settings.swapHandPatterns ? 'LH in treble, RH in bass' : 'RH in treble, LH in bass'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Settings Selection Card */}
        <Settings settings={settings} onSettingsChange={onSettingsChange} />

        {/* Practice Button */}
        <div className="text-center animate-scale-in">
          <button 
            className="btn btn-success btn-lg px-8 py-4"
            onClick={() => navigate('/practice')}
          >
            <FaPlay className="mr-3" />
            Start Free Practice
          </button>
        </div>
      </main>
    </div>
  );
};

export default FreePractice;