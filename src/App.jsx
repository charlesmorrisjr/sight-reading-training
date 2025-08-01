import React, { useState, useCallback, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import * as ABCJS from 'abcjs';
import { FaMusic, FaPlay, FaStop } from 'react-icons/fa';
import HamburgerMenu from './components/HamburgerMenu';
import MusicDisplay from './components/MusicDisplay';
import Dashboard from './components/Dashboard';
import Intervals from './components/Intervals';
import Keys from './components/Keys';
import MeasuresPage from './components/MeasuresPage';
import ChordsPractice from './components/ChordsPractice';
import MelodicPractice from './components/MelodicPractice';
import NoteDuration from './components/NoteDuration';
import FreePractice from './components/FreePractice';
import TimeSignatures from './components/TimeSignatures';
import Login from './components/Login';
import Signup from './components/Signup';
import { useAuth } from './contexts/AuthContext';
import { AuthProvider } from './contexts/AuthProvider';
import { IntervalsProvider } from './contexts/IntervalsProvider';
import { ChordsProvider } from './contexts/ChordsProvider';
import { generateRandomABC } from './utils/musicGenerator';
import CursorControl from './components/CursorControl';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PracticeView = ({ settings, onSettingsChange }) => {
  const location = useLocation();
  
  // Get intervals from location state if available
  const intervalsFromState = location.state?.intervals;
  
  // Merge location state with settings if intervals were passed
  const effectiveSettings = useMemo(() => {
    return intervalsFromState 
      ? { ...settings, intervals: intervalsFromState }
      : settings;
  }, [settings, intervalsFromState]);
  
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
  const cursorControlRef = useRef(new CursorControl());

  // Generate new exercise
  const handleGenerateNew = useCallback(async () => {
    setIsGenerating(true);
    setIsVisualsReady(false);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const newAbc = generateRandomABC(effectiveSettings);
      setAbcNotation(newAbc);
    } catch (error) {
      console.error('Error generating ABC notation:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [effectiveSettings]);

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

  // abcjs TimingCallbacks-based cursor that syncs perfectly with music
  const startVisualCursor = useCallback(() => {
    console.log('Starting abcjs TimingCallbacks-based cursor...');
    
    if (!visualObjectRef.current) {
      console.log('No visual object available for cursor');
      return;
    }
    
    const svgContainer = document.querySelector('.music-notation svg');
    if (!svgContainer) {
      console.log('No SVG container found');
      return;
    }
    
    // Remove any existing cursor
    const existingCursor = svgContainer.querySelector('.playback-cursor');
    if (existingCursor) {
      existingCursor.remove();
    }
    
    // Create the cursor line
    const cursorLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    cursorLine.setAttribute('class', 'playback-cursor');
    cursorLine.setAttribute('stroke', '#fbbf24'); // Yellow
    cursorLine.setAttribute('stroke-width', '3');
    cursorLine.setAttribute('opacity', '0.8');
    cursorLine.style.pointerEvents = 'none';
    
    // Add cursor to SVG
    svgContainer.appendChild(cursorLine);
    console.log('Cursor line added to SVG');
    
    // Track current piano system for height management
    let currentSystemY = { treble: 0, bass: 0 };
    let isFirstEvent = true;
    
    // Create TimingCallbacks for precise synchronization
    const timingCallbacks = new ABCJS.TimingCallbacks(visualObjectRef.current, {
      qpm: 120, // Quarter notes per minute - should match settings
      beatSubdivisions: 4, // Get callbacks on 16th note boundaries for smoothness
      
      // Event callback - called for each musical event (note, rest, etc.)
      eventCallback: (event) => {
        console.log('Event callback:', event);
        
        if (!event || !svgContainer.contains(cursorLine)) {
          return; // Animation stopped or cursor removed
        }
        
        // Get cursor position from event
        let cursorX = event.left || 0;
        
        // Handle piano system detection and height management
        if (event.top !== undefined) {
          // Check if we're in a new piano system by comparing Y positions
          const eventY = event.top;
          const isNewSystem = isFirstEvent || Math.abs(eventY - currentSystemY.treble) > 100;
          
          if (isNewSystem) {
            console.log('Detected new piano system at Y position:', eventY);
            
            // Find all elements at similar X position to determine system bounds
            const elementsNearX = Array.from(svgContainer.querySelectorAll('g[data-name*="note"]'))
              .map(el => {
                const rect = el.getBoundingClientRect();
                const svgRect = svgContainer.getBoundingClientRect();
                return {
                  element: el,
                  x: rect.left - svgRect.left,
                  y: rect.top - svgRect.top
                };
              })
              .filter(el => Math.abs(el.x - cursorX) < 100); // Within 100px horizontally
            
            if (elementsNearX.length > 0) {
              const yPositions = elementsNearX.map(el => el.y);
              currentSystemY.treble = Math.min(...yPositions);
              currentSystemY.bass = Math.max(...yPositions);
              
              console.log(`Updated system Y bounds: treble=${currentSystemY.treble.toFixed(0)}, bass=${currentSystemY.bass.toFixed(0)}`);
            } else {
              // Fallback: use event Y position with reasonable padding
              currentSystemY.treble = eventY - 20;
              currentSystemY.bass = eventY + 80; // Approximate bass staff position
            }
            
            isFirstEvent = false;
          }
        }
        
        // Update cursor position and height
        const cursorTopY = currentSystemY.treble - 15;
        const cursorBottomY = currentSystemY.bass + 15;
        
        cursorLine.setAttribute('x1', cursorX);
        cursorLine.setAttribute('y1', cursorTopY);
        cursorLine.setAttribute('x2', cursorX);
        cursorLine.setAttribute('y2', cursorBottomY);
        
        console.log(`Cursor positioned at x=${cursorX.toFixed(0)}, Y=${cursorTopY.toFixed(0)} to ${cursorBottomY.toFixed(0)}`);
      },
      
      // Beat callback - called on each beat for additional timing info
      beatCallback: (beatNumber, totalBeats, totalTime) => {
        console.log(`Beat ${beatNumber}/${totalBeats} at ${totalTime.toFixed(0)}ms`);
      },
      
      // Line end callback - called when reaching end of a music line
      lineEndCallback: (data) => {
        console.log('Line end reached:', data);
      }
    });
    
    // Store timing callbacks reference for cleanup
    cursorLine.timingCallbacks = timingCallbacks;
    
    // Create a way to stop the animation externally
    cursorLine.stopAnimation = () => {
      console.log('External stop called on TimingCallbacks cursor');
      if (timingCallbacks) {
        timingCallbacks.stop();
      }
    };
    
    // Start the timing callbacks
    console.log('Starting TimingCallbacks...');
    timingCallbacks.start();
    
    console.log('abcjs TimingCallbacks cursor setup completed');
  }, []);

  // Handle play button click
  const handlePlayClick = useCallback(async () => {
    if (isPlaying) {
      if (synthRef.current) {
        synthRef.current.stop();
      }
      // Stop and remove any existing cursor
      const existingCursor = document.querySelector('.playback-cursor');
      if (existingCursor) {
        if (existingCursor.stopAnimation) {
          existingCursor.stopAnimation();
        }
        if (existingCursor.timingCallbacks) {
          existingCursor.timingCallbacks.stop();
        }
        existingCursor.remove();
      }
      // Reset cursor control when stopping
      if (cursorControlRef.current) {
        cursorControlRef.current.reset();
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
      
      console.log('Starting synth with cursor control:', cursorControlRef.current);
      console.log('Cursor control methods:', {
        onEvent: cursorControlRef.current.onEvent,
        onBeat: cursorControlRef.current.onBeat,
        onLineEnd: cursorControlRef.current.onLineEnd
      });
      
      // Start playback normally 
      synthRef.current.start(undefined, {
        end: () => {
          console.log('Playback ended');
          setIsPlaying(false);
          if (cursorControlRef.current) {
            cursorControlRef.current.reset();
          }
        }
      });
      
      // Manually implement cursor tracking since abcjs CreateSynth doesn't support it directly
      if (cursorControlRef.current && cursorControlRef.current.onStart) {
        cursorControlRef.current.onStart();
      }
      
      // Start simple visual cursor
      startVisualCursor();

    } catch (error) {
      console.error('Error playing music:', error);
      setIsPlaying(false);
      // Stop and remove any existing cursor on error
      const existingCursor = document.querySelector('.playback-cursor');
      if (existingCursor) {
        if (existingCursor.stopAnimation) {
          existingCursor.stopAnimation();
        }
        if (existingCursor.timingCallbacks) {
          existingCursor.timingCallbacks.stop();
        }
        existingCursor.remove();
      }
      // Reset cursor control on error
      if (cursorControlRef.current) {
        cursorControlRef.current.reset();
      }
    }
  }, [isPlaying, initializeSynth, startVisualCursor]);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* App Title */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <FaMusic className="text-white text-lg" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Sight Reading Trainer
              </h1>
            </div>

            {/* Play Button */}
            <div className="flex items-center space-x-4">
              <button 
                className={`btn btn-lg ${isPlaying ? 'btn-error' : 'btn-primary'} ${
                  (isInitializing || !isVisualsReady) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handlePlayClick}
                disabled={isInitializing || !isVisualsReady}
                title={isPlaying ? 'Stop' : 'Play'}
              >
                {isInitializing ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <FaStop className="w-5 h-5" />
                ) : (
                  <FaPlay className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">
                  {isInitializing ? 'Loading...' : isPlaying ? 'Stop' : 'Play'}
                </span>
              </button>

              {/* Settings */}
              <HamburgerMenu
                settings={settings}
                onSettingsChange={onSettingsChange}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Music Display Section */}
        <div className="card-body p-8">
          <MusicDisplay 
            abcNotation={abcNotation} 
            settings={effectiveSettings}
            onVisualsReady={handleVisualsReady}
            cursorControl={cursorControlRef.current}
          />
        </div>

        {/* Generate Button */}
        <div className="text-center">
          <button 
            className={`btn btn-primary btn-lg ${isGenerating ? 'loading' : ''}`}
            onClick={handleGenerateNew}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              'Generate New Exercise'
            )}
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
    rightHandPatterns: ['single-notes'],
    rightHandIntervals: ['2nd'],
    rightHand4NoteChords: ['major'],
    chordTypes: ['major', 'minor'],
    chordInversions: ['root'],
    chordVoicings: ['closed'],
    chordRhythms: ['straight'],
    melodicPatterns: ['melodies'],
    melodicArticulations: ['legato'],
    musicScale: 1.0
  });

  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings);
  }, []);

  return (
    <AuthProvider>
      <IntervalsProvider>
        <ChordsProvider>
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
                  <Intervals 
                    settings={settings} 
                    onSettingsChange={handleSettingsChange}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/keys" 
              element={
                <ProtectedRoute>
                  <Keys 
                    settings={settings} 
                    onSettingsChange={handleSettingsChange}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/time-signatures" 
              element={
                <ProtectedRoute>
                  <TimeSignatures 
                    settings={settings} 
                    onSettingsChange={handleSettingsChange}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/measures" 
              element={
                <ProtectedRoute>
                  <MeasuresPage 
                    settings={settings} 
                    onSettingsChange={handleSettingsChange}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chords" 
              element={
                <ProtectedRoute>
                  <ChordsPractice 
                    settings={settings} 
                    onSettingsChange={handleSettingsChange}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/melodic" 
              element={
                <ProtectedRoute>
                  <MelodicPractice 
                    settings={settings} 
                    onSettingsChange={handleSettingsChange}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/free-practice" 
              element={
                <ProtectedRoute>
                  <FreePractice 
                    settings={settings} 
                    onSettingsChange={handleSettingsChange}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/note-durations" 
              element={
                <ProtectedRoute>
                  <NoteDuration 
                    settings={settings} 
                    onSettingsChange={handleSettingsChange}
                  />
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
        </ChordsProvider>
      </IntervalsProvider>
    </AuthProvider>
  );
}

export default App;
