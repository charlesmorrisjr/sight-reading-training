import React, { useState, useCallback } from 'react';
import HamburgerMenu from './components/HamburgerMenu';
import MusicDisplay from './components/MusicDisplay';
import { generateRandomABC } from './utils/musicGenerator';
import './App.css';

function App() {
  // Default settings
  const [settings, setSettings] = useState({
    key: 'C',
    timeSignature: '4/4',
    measures: 8,
    intervals: [1, 2, 3, 4, 5],
    noteDurations: ['1/8', '1/4'],
    chordProgressions: ['pop', '50s', 'pop-variation', 'basic-cadence', 'jazz', 'alternating', 'minor-start', 'variation'],
    leftHandPatterns: ['block-chords']
  });

  // Current ABC notation
  const [abcNotation, setAbcNotation] = useState('');

  // Loading state
  const [isGenerating, setIsGenerating] = useState(false);

  // Handle settings changes
  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings);
  }, []);

  // Generate new exercise
  const handleGenerateNew = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const newAbc = generateRandomABC(settings);
      setAbcNotation(newAbc);
    } catch (error) {
      console.error('Error generating ABC notation:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [settings]);

  // Generate initial exercise on mount
  React.useEffect(() => {
    handleGenerateNew();
  }, [handleGenerateNew]);

  return (
    <div className="app">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="app-title">
            <span className="title-icon" role="img" aria-label="Musical note">
              🎼
            </span>
            <div>
              <h1>Sight Reading Trainer</h1>
              <p className="app-subtitle">
                Perfect your piano sight reading skills
              </p>
            </div>
          </div>
          <HamburgerMenu
            settings={settings}
            onSettingsChange={handleSettingsChange}
          />
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="main-content">
        {/* Music display */}
        <section className="music-section">
          <MusicDisplay 
            abcNotation={abcNotation} 
            settings={settings}
          />
        </section>

        {/* Generate button */}
        <div className="generate-button-container">
          <button 
            className="generate-btn primary"
            onClick={handleGenerateNew}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate New Exercise'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
