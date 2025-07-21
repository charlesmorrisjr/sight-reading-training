import React, { useState, useCallback, useRef } from 'react';
import * as ABCJS from 'abcjs';
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
    leftHandPatterns: ['block-chords'],
    leftHandBrokenChords: ['1-3-5-3'],
    rightHandIntervals: ['2nd'],
    musicScale: 1.0
  });

  // Current ABC notation
  const [abcNotation, setAbcNotation] = useState('');

  // Loading state
  const [isGenerating, setIsGenerating] = useState(false);

  // Audio/synth state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const audioContextRef = useRef(null);
  const synthRef = useRef(null);
  const visualObjectRef = useRef(null);

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

  // Handle when visual objects are ready from MusicDisplay
  const handleVisualsReady = useCallback((visualObj) => {
    visualObjectRef.current = visualObj;
    // Reset synth when new music is loaded
    if (synthRef.current) {
      synthRef.current.stop();
      synthRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Initialize audio context and synth
  const initializeSynth = useCallback(async () => {
    if (!visualObjectRef.current) {
      console.error('No visual object available for synth');
      return false;
    }

    try {
      setIsInitializing(true);

      // Create audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Resume audio context if suspended (required for user interaction)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Create synth instance
      synthRef.current = new ABCJS.synth.CreateSynth();

      // Initialize synth with options
      await synthRef.current.init({
        audioContext: audioContextRef.current,
        visualObj: visualObjectRef.current,
        options: {
          soundFontUrl: "https://paulrosen.github.io/midi-js-soundfonts/MusyngKite/"
        }
      });

      // Prime the synth (load sounds)
      await synthRef.current.prime();

      return true;
    } catch (error) {
      console.error('Error initializing synth:', error);
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Handle play button click
  const handlePlayClick = useCallback(async () => {
    if (isPlaying) {
      // Stop current playback
      if (synthRef.current) {
        synthRef.current.stop();
      }
      setIsPlaying(false);
      return;
    }

    if (!visualObjectRef.current) {
      console.error('No music notation loaded');
      return;
    }

    try {
      // Initialize synth if needed
      if (!synthRef.current) {
        const initialized = await initializeSynth();
        if (!initialized) {
          return;
        }
      }

      // Start playback
      setIsPlaying(true);
      synthRef.current.start();

      // Set up completion handler
      synthRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });

    } catch (error) {
      console.error('Error playing music:', error);
      setIsPlaying(false);
    }
  }, [isPlaying, initializeSynth]);

  // Generate initial exercise on mount
  React.useEffect(() => {
    handleGenerateNew();
  }, [handleGenerateNew]);

  // Cleanup audio context on unmount
  React.useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

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
            <div>
              <h1>Sight Reading Trainer</h1>
              <p className="app-subtitle">
                Perfect your piano sight reading skills
              </p>
            </div>
          </div>
          <div className="play-button-container">
            <button 
              className="play-btn"
              onClick={handlePlayClick}
              disabled={isInitializing || !visualObjectRef.current}
              title={isPlaying ? 'Stop' : 'Play'}
            >
              {isInitializing ? (
                <svg className="play-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="3">
                    <animate attributeName="r" values="3;8;3" dur="1s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/>
                  </circle>
                </svg>
              ) : isPlaying ? (
                <svg className="play-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
              ) : (
                <svg className="play-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
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
            onVisualsReady={handleVisualsReady}
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
