import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaMusic, FaPlay } from 'react-icons/fa';
import { useChords } from '../contexts/useChords';
import { 
  AVAILABLE_CHORD_TYPES, 
  AVAILABLE_CHORD_INVERSIONS, 
  AVAILABLE_CHORD_VOICINGS, 
  AVAILABLE_CHORD_RHYTHMS 
} from '../utils/musicGenerator';

// eslint-disable-next-line no-unused-vars
const ChordsPractice = ({ settings, onSettingsChange }) => {
  const navigate = useNavigate();
  const {
    selectedChordTypes,
    toggleChordType,
    selectedChordInversions,
    toggleChordInversion,
    selectedChordVoicings,
    toggleChordVoicing,
    selectedChordRhythms,
    toggleChordRhythm
  } = useChords();

  const handleBackClick = () => {
    navigate('/dashboard');
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
                Chords Practice
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
              Configure Your Chord Practice
            </h2>
            <p className="text-gray-600">
              Select chord types, inversions, voicings, and rhythms for your practice session
            </p>
          </div>
        </div>

        {/* Chord Selection Cards */}
        <div className="space-y-8">
          {/* Chord Types Section */}
          <div className="card bg-white shadow-lg animate-fade-in">
            <div className="card-body p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Chord Types
                </h3>
                <p className="text-gray-600">
                  Select which chord types to practice
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {AVAILABLE_CHORD_TYPES.map((chordType) => 
                  renderToggleButton(
                    chordType, 
                    selectedChordTypes.includes(chordType.id), 
                    toggleChordType
                  )
                )}
              </div>
            </div>
          </div>

          {/* Chord Inversions Section */}
          <div className="card bg-white shadow-lg animate-slide-up">
            <div className="card-body p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Chord Inversions
                </h3>
                <p className="text-gray-600">
                  Select which chord inversions to practice
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {AVAILABLE_CHORD_INVERSIONS.map((inversion) => 
                  renderToggleButton(
                    inversion, 
                    selectedChordInversions.includes(inversion.id), 
                    toggleChordInversion
                  )
                )}
              </div>
            </div>
          </div>

          {/* Chord Voicings Section */}
          <div className="card bg-white shadow-lg animate-slide-up">
            <div className="card-body p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Chord Voicings
                </h3>
                <p className="text-gray-600">
                  Select which chord voicings to practice
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {AVAILABLE_CHORD_VOICINGS.map((voicing) => 
                  renderToggleButton(
                    voicing, 
                    selectedChordVoicings.includes(voicing.id), 
                    toggleChordVoicing
                  )
                )}
              </div>
            </div>
          </div>

          {/* Chord Rhythms Section */}
          <div className="card bg-white shadow-lg animate-scale-in">
            <div className="card-body p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Chord Rhythms
                </h3>
                <p className="text-gray-600">
                  Select which chord rhythms to practice
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {AVAILABLE_CHORD_RHYTHMS.map((rhythm) => 
                  renderToggleButton(
                    rhythm, 
                    selectedChordRhythms.includes(rhythm.id), 
                    toggleChordRhythm
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Settings Selection Card */}
        <div className="card bg-white shadow-lg mb-8 mt-8 animate-slide-up">
          <div className="card-body p-8">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Settings</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Key Selection Button */}
              <button
                className="btn btn-lg h-24 py-6 px-4 transition-all duration-300 transform hover:scale-105 btn-outline btn-secondary hover:btn-secondary"
                onClick={() => navigate('/keys')}
              >
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium text-gray-600 mb-1">Selected Key</span>
                  <span className="text-lg font-bold">{settings.key}</span>
                </div>
              </button>

              {/* Time Signature Selection Button */}
              <button
                className="btn btn-lg h-24 py-6 px-4 transition-all duration-300 transform hover:scale-105 btn-outline btn-secondary hover:btn-secondary"
                onClick={() => navigate('/time-signatures')}
              >
                <div className="flex flex-col items-center">
                  <span className="text-sm font-medium text-gray-600 mb-1">Selected Time Signature</span>
                  <span className="text-lg font-bold">{settings.timeSignature}</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Practice Button */}
        <div className="text-center animate-scale-in">
          <button 
            className="btn btn-success btn-lg px-8 py-4"
            onClick={() => navigate('/practice')}
          >
            <FaPlay className="mr-3" />
            Start Chord Practice
          </button>
        </div>
      </main>
    </div>
  );
};

export default ChordsPractice;