import React, { useState, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import * as ABCJS from 'abcjs';
import HamburgerMenu from './components/HamburgerMenu';
import MusicDisplay from './components/MusicDisplay';
import Dashboard from './components/Dashboard';
import Intervals from './components/Intervals';
import Login from './components/Login';
import Signup from './components/Signup';
import { useAuth } from './contexts/AuthContext';
import { AuthProvider } from './contexts/AuthProvider';
import { IntervalsProvider } from './contexts/IntervalsProvider';
import { generateRandomABC } from './utils/musicGenerator';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PracticeView = ({ settings, onSettingsChange }) => {
  // Current ABC notation
  const [abcNotation, setAbcNotation] = useState('');

  // Loading state
  const [isGenerating, setIsGenerating] = useState(false);

  // Audio/synth state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isVisualsReady, setIsVisualsReady] = useState(false);
  const audioContextRef = useRef(null);
  const synthRef = useRef(null);
  const visualObjectRef = useRef(null);

  // Generate new exercise
  const handleGenerateNew = useCallback(async () => {
    setIsGenerating(true);
    setIsVisualsReady(false);
    
    try {
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
    setIsVisualsReady(true);
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

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      synthRef.current = new ABCJS.synth.CreateSynth();

      await synthRef.current.init({
        audioContext: audioContextRef.current,
        visualObj: visualObjectRef.current,
        options: {
          soundFontUrl: "https://paulrosen.github.io/midi-js-soundfonts/MusyngKite/"
        }
      });

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
      if (!synthRef.current) {
        const initialized = await initializeSynth();
        if (!initialized) {
          return;
        }
      }

      setIsPlaying(true);
      
      synthRef.current.start(undefined, {
        end: () => {
          setIsPlaying(false);
        }
      });

    } catch (error) {
      console.error('Error playing music:', error);
      setIsPlaying(false);
    }
  }, [isPlaying, initializeSynth]);

  React.useEffect(() => {
    handleGenerateNew();
  }, [handleGenerateNew]);

  React.useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="app-title">
            <div>
              <h1>🎹 Sight Reading Trainer</h1>
            </div>
          </div>
          <div className="play-button-container">
            <button 
              className="play-btn"
              onClick={handlePlayClick}
              disabled={isInitializing || !isVisualsReady}
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
                  <rect x="6" y="6" width="12" height="12"/>
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
            onSettingsChange={onSettingsChange}
          />
        </div>
      </header>

      <main id="main-content" className="main-content">
        <section className="music-section">
          <MusicDisplay 
            abcNotation={abcNotation} 
            settings={settings}
            onVisualsReady={handleVisualsReady}
          />
        </section>

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
};

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

  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings);
  }, []);

  return (
    <AuthProvider>
      <IntervalsProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard 
                    settings={settings} 
                    onSettingsChange={handleSettingsChange}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/intervals" 
              element={
                <ProtectedRoute>
                  <Intervals />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/practice" 
              element={
                <ProtectedRoute>
                  <PracticeView 
                    settings={settings} 
                    onSettingsChange={handleSettingsChange}
                  />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </IntervalsProvider>
    </AuthProvider>
  );
}

export default App;
