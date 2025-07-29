import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaMusic, FaPlay } from 'react-icons/fa';
import { 
  AVAILABLE_MELODIC_PATTERNS, 
  AVAILABLE_MELODIC_ARTICULATIONS 
} from '../utils/musicGenerator';
import Settings from './Settings';

const MelodicPractice = ({ settings, onSettingsChange }) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate('/dashboard');
  };

  const handleMelodicPatternToggle = (patternId) => {
    // Always set as the single selected pattern (radio button behavior)
    const newSettings = { 
      ...settings, 
      melodicPatterns: [patternId]
    };
    onSettingsChange(newSettings);
  };

  const handleArticulationToggle = (articulationId) => {
    // Always set as the single selected articulation (radio button behavior)
    const newSettings = { 
      ...settings, 
      melodicArticulations: [articulationId]
    };
    onSettingsChange(newSettings);
  };

  const renderToggleButton = (item, isSelected, onToggle) => {
    return (
      <button
        key={item.id}
        className={`btn btn-lg h-24 py-12 px-6 transition-all duration-300 transform hover:scale-105 ${
          isSelected 
            ? 'btn-primary shadow-lg' 
            : 'btn-outline btn-primary hover:btn-primary'
        }`}
        onClick={() => onToggle(item.id)}
        aria-pressed={isSelected}
      >
        <div className="flex flex-col items-center space-y-4">
          <span className="font-bold text-lg">{item.label}</span>
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
                Melodic Practice
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
              Configure Your Melodic Practice
            </h2>
            <p className="text-gray-600">
              Select melodic patterns and articulations for your practice session
            </p>
          </div>
        </div>

        {/* Melodic Selection Cards */}
        <div className="space-y-8">
          {/* Melodic Patterns Section */}
          <div className="card bg-white shadow-lg animate-fade-in">
            <div className="card-body p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Melodic Patterns
                </h3>
                <p className="text-gray-600">
                  Select which melodic pattern to practice
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {AVAILABLE_MELODIC_PATTERNS.map((pattern) => 
                  renderToggleButton(
                    pattern, 
                    (settings.melodicPatterns || ['melodies']).includes(pattern.id), 
                    handleMelodicPatternToggle
                  )
                )}
              </div>
            </div>
          </div>

          {/* Articulations Section */}
          <div className="card bg-white shadow-lg animate-slide-up">
            <div className="card-body p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Articulations
                </h3>
                <p className="text-gray-600">
                  Select which articulation to practice
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {AVAILABLE_MELODIC_ARTICULATIONS.map((articulation) => 
                  renderToggleButton(
                    articulation, 
                    (settings.melodicArticulations || ['legato']).includes(articulation.id), 
                    handleArticulationToggle
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Settings Selection Card */}
        <Settings settings={settings} />

        {/* Practice Button */}
        <div className="text-center animate-scale-in">
          <button 
            className="btn btn-success btn-lg px-8 py-4"
            onClick={() => navigate('/practice')}
          >
            <FaPlay className="mr-3" />
            Start Melodic Practice
          </button>
        </div>
      </main>
    </div>
  );
};

export default MelodicPractice;