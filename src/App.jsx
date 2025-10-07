import React, { useState, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import * as ABCJS from 'abcjs';
import * as Tone from 'tone';
import { FaMusic, FaPlay, FaStop, FaKeyboard, FaRedo, FaClock } from 'react-icons/fa';
import HamburgerMenu from './components/HamburgerMenu';
import MusicDisplay from './components/MusicDisplay';
import DarkModeToggle from './components/DarkModeToggle';
import TempoSelector from './components/TempoSelector';
import MetronomeButton from './components/MetronomeButton';
import ScoreModal from './components/ScoreModal';
import SaveExerciseModal from './components/SaveExerciseModal';
import Dashboard from './components/Dashboard';
import Intervals from './components/Intervals';
import Keys from './components/Keys';
import MeasuresPage from './components/MeasuresPage';
import ChordsPractice from './components/ChordsPractice';
import MelodicPractice from './components/MelodicPractice';
import NoteDuration from './components/NoteDuration';
import FreePractice from './components/FreePractice';
import TimeSignatures from './components/TimeSignatures';
import Levels from './components/Levels';
import Login from './components/Login';
import Signup from './components/Signup';
import LandingPage from './components/LandingPage';
import FlowView from './components/FlowView';
import { useAuth } from './contexts/AuthContext';
import { ExerciseService } from './services/exerciseService';
import { incrementExercisesGenerated, updateLastPracticed } from './services/database';
import { AuthProvider } from './contexts/AuthProvider';
import { ChordsProvider } from './contexts/ChordsProvider';
import ThemeProvider from './contexts/ThemeProvider';
import { generateRandomABC } from './utils/musicGenerator';
import { initializeMIDI } from './utils/midiManager';
import { loadUserSettings, saveUserSettings, DEFAULT_SETTINGS, incrementGuestExercisesGenerated, saveGuestExercise } from './services/settingsService';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PracticeView = ({ settings, onSettingsChange, onTempoClick, pressedMidiNotes = new Set(), correctNotesCount = 0, wrongNotesCount = 0, onCorrectNote, onWrongNote, onResetScoring, onPracticeEnd, isMetronomeActive, onMetronomeToggle, showPostPracticeResults = false, onResetPostPracticeResults, onSaveExercise, user }) => {
  const navigate = useNavigate();
  
  // Current ABC notation and note metadata
  const [abcNotation, setAbcNotation] = useState('');
  const [noteMetadata, setNoteMetadata] = useState([]);

  // Loading state
  const [isGenerating, setIsGenerating] = useState(false);

  // Audio/synth state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPracticing, setIsPracticing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isVisualsReady, setIsVisualsReady] = useState(false);
  const audioContextRef = useRef(null);
  const synthRef = useRef(null);
  const visualObjectRef = useRef(null);

  // Beat tracking state for debugging display
  const [beatInfo, setBeatInfo] = useState('');
  
  // Countdown state
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownBeats, setCountdownBeats] = useState(0);
  
  // Current notes tracking for debugging display - use ref to avoid stale closure
  const currentNotesRef = useRef(new Set());
  
  // Note tracking system - map of note ID to note status
  const [noteTrackingMap, setNoteTrackingMap] = useState(new Map());
  const currentNoteIdsRef = useRef(new Set());
  
  // Refs to track current playing state without causing re-renders
  const isPlayingRef = useRef(false);
  const isPracticingRef = useRef(false);
  
  // Ref to store metronome trigger function
  const metronomeTriggerRef = useRef(null);
  
  // Ref to track metronome state immediately (avoids async state update issues)
  const isMetronomeActiveRef = useRef(false);

  // Ref to track previously highlighted note elements for cleanup
  const previouslyHighlightedElementsRef = useRef(new Set());

  // Ref to track all notes that have been highlighted and should stay green
  const allHighlightedElementsRef = useRef(new Set());

  // CursorControl object for proper note highlighting
  const cursorControlRef = useRef(null);

  // Ref to track DOM elements at the current cursor position
  const currentCursorElementsRef = useRef(new Map()); // Map of noteId -> DOM element



  // Handle metronome external beat trigger
  const handleMetronomeTrigger = useCallback((triggerFunction) => {
    metronomeTriggerRef.current = triggerFunction;
  }, []);

  // Robust cleanup function that doesn't rely on stored DOM references
  const resetAllNoteHighlighting = useCallback(() => {
    try {
      // Find all highlighted notes via CSS selectors instead of stored references
      const svgContainer = document.querySelector('.music-notation svg');
      if (svgContainer) {
        const highlightedNotes = svgContainer.querySelectorAll('.abcjs-note_selected, .abcjs-note-incorrect, .abcjs-note-played, .abcjs-note-corrected');
        highlightedNotes.forEach(element => {
          if (element && element.classList) {
            element.classList.remove('abcjs-note_selected', 'abcjs-note-incorrect', 'abcjs-note-played', 'abcjs-note-corrected');
            console.log('Removed highlighting from note element');
          }
        });
        console.log(`Reset highlighting for ${highlightedNotes.length} notes`);
      }

      // Clear all stored references
      previouslyHighlightedElementsRef.current.clear();
      allHighlightedElementsRef.current.clear();
      currentCursorElementsRef.current.clear();

      // Reset note tracking map statuses to 'unplayed'
      setNoteTrackingMap(prevMap => {
        const newMap = new Map();
        prevMap.forEach((note, id) => {
          newMap.set(id, { ...note, status: 'unplayed' });
        });
        return newMap;
      });

      console.log('Successfully reset all note highlighting and tracking');
    } catch (error) {
      console.warn('Error during note highlighting cleanup:', error);
    }
  }, []);

  // Create CursorControl object for note highlighting
  const createCursorControl = useCallback((isPracticeMode) => {
    const CursorControl = function() {
      this.onStart = function() {
        console.log('🎯 CursorControl: Playback started');
      };

      this.onFinished = function() {
        console.log('🎯 CursorControl: Playback finished');
        // Use robust cleanup function instead of manual reference cleanup
        resetAllNoteHighlighting();
      };

      this.onEvent = function(event) {
        // Only highlight during practice mode
        if (!isPracticeMode) return;

        console.log('🎯 CursorControl event:', {
          hasElements: !!event.elements,
          elementsType: typeof event.elements,
          elementsLength: event.elements?.length,
          eventKeys: Object.keys(event),
          event: event
        });

        // Convert current highlights to persistent before clearing
        previouslyHighlightedElementsRef.current.forEach(element => {
          if (element && element.classList) {
            // Remove current highlight class and add persistent class
            element.classList.remove('abcjs-note_selected', 'cursor-highlighted');
            element.classList.add('abcjs-note-played');
            // Move to persistent tracking
            allHighlightedElementsRef.current.add(element);
          }
        });
        previouslyHighlightedElementsRef.current.clear();

        // Try highlighting with CursorControl elements
        if (event.elements && Array.isArray(event.elements) && event.elements.length > 0) {
          console.log('🎯 CursorControl highlighting', event.elements.length, 'elements');

          event.elements.forEach((element, index) => {
            console.log(`🎯 CursorControl Element ${index}:`, {
              type: typeof element,
              isArray: Array.isArray(element),
              length: element?.length,
              firstItem: Array.isArray(element) && element.length > 0 ? element[0] : null
            });

            // CursorControl: Use direct DOM element access
            if (Array.isArray(element) && element.length > 0) {
              const domElement = element[0]; // This is the actual DOM element

              if (domElement && domElement.classList) {
                domElement.classList.add('abcjs-note_selected');
                previouslyHighlightedElementsRef.current.add(domElement);
                console.log('✅ CursorControl added abcjs-note_selected to DOM element', index);
              } else {
                console.log('❌ CursorControl DOM element missing classList', index);
              }
            }
          });
        } else {
          console.log('❌ CursorControl: No valid elements array found');
        }
      };

      this.onBeat = function(/* beatNumber, totalBeats, totalTime */) {
        // Optional: could be used for additional timing-based highlighting
      };
    };

    return new CursorControl();
  }, [resetAllNoteHighlighting]);

  // Convert MIDI pitch number to note name (e.g., 60 -> "C4")
  const midiPitchToNoteName = useCallback((midiNumber) => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNumber / 12) - 1;
    const noteIndex = midiNumber % 12;
    return noteNames[noteIndex] + octave;
  }, []);

  // Helper function to highlight a specific note ID using cursor position mapping
  const highlightNoteById = useCallback((noteId, highlightType) => {
    // Only highlight notes that are at the current cursor position
    const domElement = currentCursorElementsRef.current.get(noteId);

    if (!domElement || !domElement.classList) {
      console.log(`No DOM element found for note ID ${noteId} at current cursor position`);
      return;
    }

    // Apply highlighting class based on type
    let className;
    if (highlightType === 'correct') {
      className = 'abcjs-note_selected';
    } else if (highlightType === 'incorrect') {
      className = 'abcjs-note-incorrect';
    } else if (highlightType === 'corrected') {
      className = 'abcjs-note-corrected';
    } else {
      console.warn(`Unknown highlight type: ${highlightType}`);
      return;
    }

    // Remove any existing highlighting classes
    domElement.classList.remove('abcjs-note_selected', 'abcjs-note-incorrect', 'abcjs-note-played', 'abcjs-note-corrected');

    // Add the appropriate highlighting class
    domElement.classList.add(className);

    // Store reference for cleanup
    if (highlightType === 'correct' || highlightType === 'corrected') {
      allHighlightedElementsRef.current.add(domElement);
    }

    console.log(`Successfully highlighted note ID ${noteId} as ${highlightType} at cursor position`);
  }, []);

  // Generate new exercise
  const handleGenerateNew = useCallback(async () => {
    setIsGenerating(true);
    setIsVisualsReady(false);
    
    // Reset scoring when generating new exercise
    if (onResetScoring) {
      onResetScoring();
    }
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const result = generateRandomABC(settings);
      setAbcNotation(result.abcNotation);
      setNoteMetadata(result.noteMetadata);
      
      // Initialize note tracking map with 'unplayed' status
      const initialTrackingMap = new Map();
      result.noteMetadata.forEach(note => {
        initialTrackingMap.set(note.id, {
          ...note,
          status: 'unplayed' // unplayed | correct | incorrect
        });
      });
      setNoteTrackingMap(initialTrackingMap);
      
      // Reset post-practice highlighting when generating new exercise
      if (onResetPostPracticeResults) {
        onResetPostPracticeResults();
      }

      // Clear all note highlights for fresh start using robust cleanup
      resetAllNoteHighlighting();
      
      // Increment exercises_generated counter based on user type
      if (user?.id) {
        try {
          if (user.isGuest) {
            // Increment guest counter in localStorage
            incrementGuestExercisesGenerated();
          } else {
            // Increment authenticated user counter in database
            await incrementExercisesGenerated(user.id);
          }
        } catch {
          // Failed to increment exercise counter
          // Don't fail the exercise generation if counter update fails
        }
      }
      
    } catch {
      // Error generating ABC notation
    } finally {
      setIsGenerating(false);
    }
  }, [settings, onResetScoring, onResetPostPracticeResults, user?.id, user?.isGuest, resetAllNoteHighlighting]);

  // Handle when visual objects are ready from MusicDisplay
  const handleVisualsReady = useCallback((visualObj) => {
    visualObjectRef.current = visualObj;
    setIsVisualsReady(true);
    
    // Use refs to get current values without causing re-renders
    // Fixes problem with visual cursor disappearing when notes were highlighted
    if (synthRef.current && !isPlayingRef.current && !isPracticingRef.current) {
      synthRef.current.stop();
      synthRef.current = null;
    }
    
    // Only reset playing state if we're not currently in practice mode
    if (!isPracticingRef.current) {
      setIsPlaying(false);
    }
  }, []);

  // Initialize audio context and synth
  const initializeSynth = useCallback(async () => {
    if (!visualObjectRef.current) {
      return false;
    }

    try {
      setIsInitializing(true);

      if (!audioContextRef.current) {
        // @ts-ignore - webkitAudioContext fallback for older browsers
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
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
    } catch {
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // abcjs TimingCallbacks-based cursor that syncs perfectly with music
  const startVisualCursor = useCallback((isPracticeMode = false) => {
    
    // Cursor padding constants
    const CURSOR_TOP_PADDING = 5;
    const CURSOR_BOTTOM_PADDING = 25;
    
    if (!visualObjectRef.current) {
      return;
    }
    
    const svgContainer = document.querySelector('.music-notation svg');
    if (!svgContainer) {
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
    cursorLine.setAttribute('stroke', isPracticeMode ? '#f59e0b' : '#3b82f6'); // Orange for practice, blue for play
    cursorLine.setAttribute('stroke-width', '12');
    cursorLine.setAttribute('stroke-linecap', 'round');
    cursorLine.setAttribute('opacity', '0.3');
    cursorLine.style.pointerEvents = 'none';
    
    // Add cursor to SVG
    svgContainer.appendChild(cursorLine);
    
    // Create CursorControl for note highlighting
    if (isPracticeMode) {
      cursorControlRef.current = createCursorControl(isPracticeMode);
      console.log('🎯 Created CursorControl for practice mode');
    }

    // Create TimingCallbacks for precise synchronization

    let timingCallbacks;
    try {
      timingCallbacks = new ABCJS.TimingCallbacks(visualObjectRef.current, {
        qpm: settings.tempo, // Quarter notes per minute - matches settings
        beatSubdivisions: 4, // Get callbacks on 16th note boundaries for smoothness
        extraMeasuresAtBeginning: isPracticeMode ? 2 : 0, // Add 2 countdown measures for practice mode
        
        // Event callback - called for each musical event (note, rest, etc.)
        eventCallback: (event) => {
          
        if (!event) {
          // Music has ended - stop playback and reset button
          if (!isPracticeMode) {
            setIsPlaying(false);
          }
          
          // Call onPracticeEnd if we were in practice mode with note tracking statistics
          
          if (isPracticingRef.current && onPracticeEnd) {
            // Calculate final scores from note tracking map
            let correctCount = 0;
            let wrongCount = 0;
            let unplayedCount = 0;
            const correctNotesList = [];
            const wrongNotesList = [];
            
            noteTrackingMap.forEach((note) => {
              if (note.status === 'correct') {
                correctCount++;
                correctNotesList.push(note.expectedNote || note.abcNotation);
              } else if (note.status === 'incorrect') {
                wrongCount++;
                wrongNotesList.push(note.expectedNote || note.abcNotation);
              } else {
                unplayedCount++;
              }
            });
            
            onPracticeEnd({
              correctCount,
              wrongCount,
              unplayedCount,
              totalNotes: noteTrackingMap.size,
              correctNotes: correctNotesList,
              wrongNotes: wrongNotesList
            });
          }
          
          if (isPracticeMode) {
            
            setIsPracticing(false);
            setIsCountingDown(false);
            setCountdownBeats(0);
            
            // CRITICAL FIX: Stop metronome immediately to prevent internal timing fallback
            if (isMetronomeActiveRef.current) {
              isMetronomeActiveRef.current = false;
              
              // Also trigger metronome toggle to ensure MetronomeButton internal timing stops
              if (onMetronomeToggle) {
                onMetronomeToggle();
              }
            }
          }
          setBeatInfo(''); // Clear beat info when music ends
          currentNotesRef.current = new Set(); // Clear current notes when music ends

          // Clean up all note highlights when practice ends using robust cleanup
          resetAllNoteHighlighting();

          if (!isPracticeMode && synthRef.current) {
            synthRef.current.stop();
          }
          // Stop TimingCallbacks to prevent infinite beatCallback execution
          
          if (timingCallbacks) {
            timingCallbacks.stop();
          }
          
          // Clean up practice timer if it exists
          if (cursorLine && cursorLine.practiceTimer) {
            clearInterval(cursorLine.practiceTimer);
          }

          // Remove cursor
          if (cursorLine && cursorLine.parentNode) {
            cursorLine.remove();
          }
          
          return;
        }
        
          // Enhanced debugging and note tracking (commented out)
          // if (event) {
          // }
        
        // For practice mode, hide cursor during countdown 
        if (isPracticeMode && event.milliseconds !== undefined) {
          const tempo = settings.tempo || 120;
          const currentTimeInBeats = (event.milliseconds / 1000) * (tempo / 60);
          
          // Calculate dynamic countdown beats based on time signature
          const [beatsPerMeasure] = settings.timeSignature.split('/').map(Number);
          const countdownBeats = beatsPerMeasure * 2; // 2 measures countdown
          
          if (currentTimeInBeats < countdownBeats) {
            // During countdown - hide cursor by positioning it off-screen
            cursorLine.setAttribute('x1', -100);
            cursorLine.setAttribute('y1', -100);
            cursorLine.setAttribute('x2', -100);
            cursorLine.setAttribute('y2', -100);
            return; // Skip normal cursor positioning
          }
        }
        
        // Use abcjs-provided positioning data for precise cursor placement
        const cursorX = (event.left + 5) || 0;    // Add 5px to the left to center the cursor
        const eventTopY = event.top || 0;
        const eventHeight = event.height || 30;
        
        // Set cursor bounds using abcjs measurements with padding constants
        const cursorTopY = eventTopY - CURSOR_TOP_PADDING;
        const cursorBottomY = eventTopY + eventHeight + CURSOR_BOTTOM_PADDING;
        
        // Update cursor position and dimensions
        cursorLine.setAttribute('x1', (cursorX));
        cursorLine.setAttribute('y1', cursorTopY);
        cursorLine.setAttribute('x2', cursorX);
        cursorLine.setAttribute('y2', cursorBottomY);

        // Note: Automatic highlighting removed - notes will only highlight when user plays correct MIDI notes
        
        // 🏯 Calculate current active notes using ABCJS event timing
        // This approach uses event.milliseconds for precise timing that works across all BPM values
        // and eliminates timing lag between beat calculation and cursor display
        if (isPracticeMode && event && event.milliseconds !== undefined) {
          // Validate tempo to prevent division by zero or invalid values
          let tempo = settings.tempo || 120;
          if (tempo <= 0 || tempo > 300) {
            tempo = 120;
          }
          
          // Convert ABCJS milliseconds to musical beats
          // This formula works for any BPM: (ms / 1000 seconds) * (beats per minute / 60 seconds) = beats
          const currentTimeInBeats = (event.milliseconds / 1000) * (tempo / 60);
          
          // Only process notes after countdown period
          // Calculate dynamic countdown beats based on time signature
          const [beatsPerMeasure] = settings.timeSignature.split('/').map(Number);
          const countdownBeats = beatsPerMeasure * 2; // 2 measures countdown
          if (currentTimeInBeats >= countdownBeats) {
            const activeNotes = new Set();
            const activeNoteIds = new Set();
            
            // Find notes that should be active at the current time
            // Note metadata uses eighth-note units, so we convert to quarter-note beats for comparison
            noteMetadata.forEach(noteData => {
              // Convert measure-relative timing to absolute timing in eighth-note units
              const beatsPerMeasure = 8; // 4/4 time with L=1/8 (eighth note units)
              const absoluteStartTime = noteData.startTime + (noteData.measureIndex * beatsPerMeasure);
              const absoluteEndTime = absoluteStartTime + noteData.duration;
              
              // Convert from eighth-note units to quarter-note beats for ABCJS timing comparison
              const absoluteStartBeat = absoluteStartTime / 2;
              const absoluteEndBeat = absoluteEndTime / 2;
              
              // Adjust for countdown offset
              const adjustedCurrentTime = currentTimeInBeats - countdownBeats;
              
              if (adjustedCurrentTime >= absoluteStartBeat && adjustedCurrentTime < absoluteEndBeat) {
                activeNotes.add(noteData.expectedNote);
                activeNoteIds.add(noteData.id);
              }
            });
            
            // Update current notes refs
            currentNotesRef.current = activeNotes;
            currentNoteIdsRef.current = activeNoteIds;

            // Capture DOM elements at current cursor position for highlighting
            currentCursorElementsRef.current.clear();

            // Try to map DOM elements to active note IDs using ABCJS event elements
            if (event.elements && Array.isArray(event.elements)) {
              event.elements.forEach((element, index) => {
                if (Array.isArray(element) && element.length > 0) {
                  const domElement = element[0]; // This is the actual DOM element

                  // Map this DOM element to corresponding note IDs
                  // Since we can't directly correlate elements to note IDs, we'll use position-based mapping
                  const activeNoteIdsArray = Array.from(activeNoteIds);
                  if (activeNoteIdsArray[index]) {
                    currentCursorElementsRef.current.set(activeNoteIdsArray[index], domElement);
                  }
                }
              });
            } else {
              // Fallback: Use coordinate-based approach to find DOM elements at cursor position
              const svgContainer = document.querySelector('.music-notation svg');
              if (svgContainer && event.left !== undefined && event.top !== undefined) {
                const noteElements = svgContainer.querySelectorAll('.abcjs-note');
                const tolerance = 30; // pixels

                noteElements.forEach((noteElement) => {
                  const rect = noteElement.getBoundingClientRect();
                  const svgRect = svgContainer.getBoundingClientRect();

                  // Convert to SVG coordinates
                  const noteX = rect.left - svgRect.left;
                  const noteY = rect.top - svgRect.top;

                  // Check if note is near cursor position
                  const distance = Math.sqrt(Math.pow(noteX - event.left, 2) + Math.pow(noteY - event.top, 2));

                  if (distance < tolerance) {
                    // Map this element to the first unassigned active note ID
                    const activeNoteIdsArray = Array.from(activeNoteIds);
                    for (const noteId of activeNoteIdsArray) {
                      if (!currentCursorElementsRef.current.has(noteId)) {
                        currentCursorElementsRef.current.set(noteId, noteElement);
                        break;
                      }
                    }
                  }
                });
              }
            }
          }
        }
      },
      
        // Beat callback - called on each beat for additional timing info
        beatCallback: (beatNumber, totalBeats) => {
          // Enhanced debug logging to track metronome decisions
          
          // CRITICAL: Check if beatCallback is still firing after music should have ended
          
          // Handle countdown phase for practice mode
          if (isPracticeMode) {
            const [beatsPerMeasure] = settings.timeSignature.split('/').map(Number);
            const countdownTotalBeats = beatsPerMeasure * 2; // 2 measures countdown
            
            // Since extraMeasuresAtBeginning doesn't seem to work in this version of ABCJS,
            // we'll create our own countdown by treating the first 8 beats as countdown
            if (beatNumber < countdownTotalBeats) {
              // We're in countdown phase (first 8 beats for 4/4 time)
              const remainingBeats = countdownTotalBeats - Math.floor(beatNumber);
              setCountdownBeats(remainingBeats);
              setIsCountingDown(remainingBeats > 0);
            } else {
              // We're past countdown - in actual music
              setIsCountingDown(false);
              setCountdownBeats(0);
            }
          }
          
          // Beat info for debugging display
          setBeatInfo(`Beat ${beatNumber}/${totalBeats}`);
          
          // Trigger metronome on whole beat counts (including countdown beats)
          const roundedBeat = Math.round(beatNumber);
          const isWholeBeat = Math.abs(beatNumber - roundedBeat) < 0.1;
          
          
          // For practice mode, trigger metronome during countdown OR if metronome is active
          // Use ref instead of state to avoid async timing issues
          const [beatsPerMeasure] = settings.timeSignature.split('/').map(Number);
          const countdownTotalBeats = beatsPerMeasure * 2; // 2 measures countdown
          const shouldTriggerMetronome = isPracticeMode ? 
            (beatNumber < countdownTotalBeats || isMetronomeActiveRef.current) : // Countdown always plays, then only if metronome active
            isMetronomeActiveRef.current; // Non-practice mode only if metronome active
          
          
          if (shouldTriggerMetronome && metronomeTriggerRef.current && isWholeBeat && beatNumber < totalBeats) {
            metronomeTriggerRef.current();
          }
        },
      
      // Line end callback - called when reaching end of a music line
      lineEndCallback: (info) => {
        
        // Use line-level bounds when available for more accurate cursor positioning
        if (info && info.top !== undefined && info.bottom !== undefined && svgContainer.contains(cursorLine)) {
          // Update cursor height to span the entire line with consistent padding
          cursorLine.setAttribute('y1', info.top - CURSOR_TOP_PADDING);
          cursorLine.setAttribute('y2', info.bottom + CURSOR_BOTTOM_PADDING);
          
        }
      }
      });
    } catch {
      return; // Exit if TimingCallbacks creation fails
    }
    
    // Store timing callbacks reference for cleanup
    cursorLine.timingCallbacks = timingCallbacks;
    
    // Create a way to stop the animation externally
    cursorLine.stopAnimation = () => {
      if (timingCallbacks) {
        timingCallbacks.stop();
      }
      if (cursorLine.practiceTimer) {
        clearInterval(cursorLine.practiceTimer);
      }
    };
    
    // Start the timing callbacks with error handling
    try {
      timingCallbacks.start();
    } catch {
      // Error starting TimingCallbacks
    }

    // For practice mode, also initialize CursorControl timing without audio
    if (isPracticeMode && cursorControlRef.current) {
      try {
        // Create a mock timing system for CursorControl in practice mode
        const practiceTimer = setInterval(() => {
          // This is a basic implementation - in a real scenario, we'd need to sync with the timing
          // For now, we'll rely on the coordinate-based fallback in TimingCallbacks
        }, 100);

        // Store timer reference for cleanup
        cursorLine.practiceTimer = practiceTimer;
        console.log('🎯 Started practice mode timer for CursorControl');
      } catch {
        console.log('❌ Error starting CursorControl practice timer');
      }
    }
    
  }, [settings.tempo, settings.timeSignature, onPracticeEnd, noteMetadata, noteTrackingMap, onMetronomeToggle, createCursorControl, resetAllNoteHighlighting]);

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
      setIsPlaying(false);
      return;
    }

    if (!visualObjectRef.current) {
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
      
      // Start playback normally 
      synthRef.current.start(undefined, {
        end: () => {
          setIsPlaying(false);
        }
      });
      
      // Start visual cursor
      startVisualCursor();

    } catch {
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
    }
  }, [isPlaying, initializeSynth, startVisualCursor]);


  
  // Handle practice button click - does not play audio
  const handlePracticeClick = useCallback(async () => {
    
    if (isPracticing) {
      
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
      
      // CRITICAL FIX: Stop metronome when manually stopping practice
      if (isMetronomeActiveRef.current) {
        isMetronomeActiveRef.current = false;

        // Also trigger metronome toggle to ensure MetronomeButton internal timing stops
        if (onMetronomeToggle) {
          onMetronomeToggle();
        }
      }

      // Clean up all note highlights when manually stopping practice using robust cleanup
      resetAllNoteHighlighting();

      setIsPracticing(false);
      setIsCountingDown(false);
      setCountdownBeats(0);
      return;
    }

    if (!visualObjectRef.current) {
      return;
    }

    try {
      
      // Auto-start metronome if not already active
      if (!isMetronomeActive) {
        onMetronomeToggle(); // This will set isMetronomeActive to true
        isMetronomeActiveRef.current = true; // Update ref immediately for sync
      }
      
      // CRITICAL FIX: Always sync ref with state when starting practice
      // This ensures metronome works on subsequent practice sessions even if manually started
      isMetronomeActiveRef.current = isMetronomeActive;
      
      setIsPracticing(true);
      
      // Start visual cursor with countdown - this will trigger the countdown automatically
      startVisualCursor(true); // Pass true to indicate practice mode (no audio)

    } catch {
      setIsPracticing(false);
      setIsCountingDown(false);
      setCountdownBeats(0);
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

      // Clean up all note highlights on error using robust cleanup
      resetAllNoteHighlighting();
    }
  }, [isPracticing, startVisualCursor, isMetronomeActive, onMetronomeToggle, resetAllNoteHighlighting]);

  React.useEffect(() => {
    handleGenerateNew();
  }, [handleGenerateNew]);

  // Update last practiced date when user enters practice route
  React.useEffect(() => {
    const updatePracticeDate = async () => {
      if (user?.id && !user?.isGuest) {
        try {
          await updateLastPracticed(user.id);
        } catch {
          // Failed to update last practice date
          // Non-blocking - practice continues even if update fails
        }
      }
    };

    updatePracticeDate();
  }, [user?.id, user?.isGuest]); // Depend on user properties

  // Keep refs synchronized with state to avoid stale closure issues
  // Fixes problem with visual cursor disappearing when notes were highlighted
  React.useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  React.useEffect(() => {
    isPracticingRef.current = isPracticing;
  }, [isPracticing]);
  
  // Keep metronome ref synchronized with state
  React.useEffect(() => {
    isMetronomeActiveRef.current = isMetronomeActive;
  }, [isMetronomeActive]);

  React.useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
  
    };
  }, []);

  // Enhanced scoring logic using note tracking system to prevent duplicate counting
  const previousPressedNotesRef = useRef(new Set());
  
  // Cursor position-based scoring lock to prevent multiple counting at same position
  const previousActiveNoteIdsRef = useRef(new Set());
  const scoringLockedRef = useRef(false);
  React.useEffect(() => {
    // Only perform scoring during practice mode
    if (!isPracticing || !onCorrectNote || !onWrongNote) {
      return;
    }

    // Get current expected notes from the music
    const expectedNotes = currentNotesRef.current;
    const currentActiveNoteIds = currentNoteIdsRef.current;
    
    // Detect cursor position change by comparing current vs previous note IDs
    const previousNoteIds = previousActiveNoteIdsRef.current;
    const noteIdsChanged = !areSetsSame(currentActiveNoteIds, previousNoteIds);
    
    // Helper function to compare Sets
    function areSetsSame(set1, set2) {
      if (set1.size !== set2.size) return false;
      for (const item of set1) {
        if (!set2.has(item)) return false;
      }
      return true;
    }
    
    // If cursor moved to new notes, unlock scoring for the new position
    if (noteIdsChanged) {
      scoringLockedRef.current = false;
      previousActiveNoteIdsRef.current = new Set(currentActiveNoteIds);
      previousPressedNotesRef.current = new Set(); // Reset: all held notes now "new" for this position
    }
    
    // Skip scoring if locked (already scored at this cursor position)
    if (scoringLockedRef.current) {
      // Allow processing if we're trying to correct an incorrect note
      const hasIncorrectNotes = Array.from(currentActiveNoteIds).some(noteId => {
        const trackedNote = noteTrackingMap.get(noteId);
        return trackedNote && trackedNote.status === 'incorrect';
      });

      if (!hasIncorrectNotes) {
        // Update previous pressed notes even when locked to avoid stale state
        previousPressedNotesRef.current = new Set(pressedMidiNotes);
        return;
      }
      // If there are incorrect notes, continue processing to allow corrections
    }

    // Get newly pressed notes (notes that weren't pressed before)
    const newlyPressedNotes = new Set(
      [...pressedMidiNotes].filter(note => !previousPressedNotesRef.current.has(note))
    );
    
    // Skip if no new notes pressed
    if (newlyPressedNotes.size === 0) {
      return;
    }

    // Track processed notes in this scoring cycle to prevent duplicates
    const processedNotesInThisCycle = new Set();

    // Check each newly pressed note
    newlyPressedNotes.forEach(pressedNote => {
      // Skip if we already processed this note in this cycle
      if (processedNotesInThisCycle.has(pressedNote)) {
        return;
      }

      let noteProcessed = false;
      
      // Find the first unplayed or incorrect note that matches (priority-based matching)
      // This prevents one key press from matching multiple note IDs
      for (const noteId of currentActiveNoteIds) {
        const trackedNote = noteTrackingMap.get(noteId);

        if (trackedNote && (trackedNote.status === 'unplayed' || trackedNote.status === 'incorrect')) {
          // Check if the pressed note matches this tracked note
          if (trackedNote.expectedNote === pressedNote ||
              (trackedNote.midiPitch && midiPitchToNoteName(trackedNote.midiPitch) === pressedNote)) {

            // Determine the new status and highlight type based on previous state
            const isCorrection = trackedNote.status === 'incorrect';
            const newStatus = isCorrection ? 'corrected' : 'correct';
            const highlightType = isCorrection ? 'corrected' : 'correct';

            // Mark note with appropriate status and update tracking
            setNoteTrackingMap(prevMap => {
              const newMap = new Map(prevMap);
              newMap.set(noteId, { ...trackedNote, status: newStatus });
              return newMap;
            });

            // Highlight the note with appropriate color (green for correct, dark yellow for corrected)
            highlightNoteById(noteId, highlightType);

            onCorrectNote(pressedNote);
            noteProcessed = true;
            processedNotesInThisCycle.add(pressedNote); // Mark as processed
            scoringLockedRef.current = true; // Lock scoring after correct note
            break; // Only match the first unplayed/incorrect note - prevents duplicates
          }
        }
      }
      
      // If note wasn't processed as correct, check if it's a wrong note
      if (!noteProcessed && !expectedNotes.has(pressedNote)) {
        // Completely wrong note - highlight the first unplayed note at current position as incorrect
        for (const noteId of currentActiveNoteIds) {
          const trackedNote = noteTrackingMap.get(noteId);
          if (trackedNote && trackedNote.status === 'unplayed') {
            // Mark note as incorrect and update tracking
            setNoteTrackingMap(prevMap => {
              const newMap = new Map(prevMap);
              newMap.set(noteId, { ...trackedNote, status: 'incorrect' });
              return newMap;
            });

            // Highlight the note red for incorrect input
            highlightNoteById(noteId, 'incorrect');
            break; // Only mark one note as incorrect per wrong press
          }
        }

        onWrongNote(pressedNote);
        processedNotesInThisCycle.add(pressedNote); // Mark as processed
        scoringLockedRef.current = true; // Lock scoring after wrong note
      }
    });

    // Update previous pressed notes for next comparison
    previousPressedNotesRef.current = new Set(pressedMidiNotes);
  }, [pressedMidiNotes, isPracticing, onCorrectNote, onWrongNote, noteTrackingMap, midiPitchToNoteName, correctNotesCount, wrongNotesCount, highlightNoteById]);

  // Reset note tracking when practice mode starts
  React.useEffect(() => {
    if (isPracticing && onResetScoring) {
      // Reset note tracking map to 'unplayed' status
      setNoteTrackingMap(prevMap => {
        const newMap = new Map();
        prevMap.forEach((note, id) => {
          newMap.set(id, { ...note, status: 'unplayed' });
        });
        return newMap;
      });
      
      onResetScoring();
      
      // Reset cursor position tracking and scoring lock
      previousActiveNoteIdsRef.current = new Set();
      scoringLockedRef.current = false;
    }
  }, [isPracticing, onResetScoring]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* App Title */}
            <button 
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <FaMusic className="text-white text-lg" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                Practisia
              </h1>
            </button>

            {/* Control Buttons */}
            <div className="flex items-center space-x-4">
              {/* Countdown Display */}
              {isCountingDown && countdownBeats > 0 && (
                <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-orange-100 dark:bg-orange-900 border border-orange-200 dark:border-orange-700">
                  <span className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                    Starting in:
                  </span>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 animate-pulse">
                    {countdownBeats}
                  </div>
                </div>
              )}

              {/* Tempo Button */}
              <button
                onClick={onTempoClick}
                className={`btn btn-lg btn-outline text-gray-700 hover:bg-gray-100 ${
                  (isPlaying || isPracticing) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isPlaying || isPracticing}
                title="Change Tempo"
              >
                <span className="text-lg font-medium">{settings.tempo} BPM</span>
              </button>

              {/* Metronome Button */}
              <MetronomeButton
                tempo={settings.tempo}
                isActive={isMetronomeActive}
                onToggle={onMetronomeToggle}
                disabled={isInitializing || !isVisualsReady || isPlaying || isPracticing}
                useExternalTiming={isPlaying || isPracticing}
                onExternalBeatTrigger={handleMetronomeTrigger}
              />

              {/* Play Button */}
              <button 
                className={`btn btn-lg btn-outline ${isPlaying ? 'btn-error' : 'bg-white border-gray-300 hover:bg-gray-50'} ${
                  (isInitializing || !isVisualsReady || isPracticing) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handlePlayClick}
                disabled={isInitializing || !isVisualsReady || isPracticing}
                title={isPlaying ? 'Stop' : 'Play'}
              >
                {isInitializing ? (
                  <div className="w-7 h-7 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <FaStop className="w-7 h-7" />
                ) : (
                  <FaPlay className="w-7 h-7" />
                )}
              </button>

              {/* Practice Button */}
              <button 
                className={`btn btn-lg btn-outline ${isPracticing ? 'btn-error' : 'btn-warning'} ${
                  (isInitializing || !isVisualsReady || isPlaying) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handlePracticeClick}
                disabled={isInitializing || !isVisualsReady || isPlaying}
                title={isPracticing ? 'Stop Practice' : 'Practice'}
              >
                {isInitializing ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isPracticing ? (
                  <FaStop className="w-5 h-5" />
                ) : (
                  <FaKeyboard className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">
                  {isInitializing ? 'Loading...' : isPracticing ? 'Stop' : 'Practice'}
                </span>
              </button>

              {/* Dark Mode Toggle */}
              <DarkModeToggle />

              {/* Settings */}
              <HamburgerMenu
                settings={settings}
                onSettingsChange={onSettingsChange}
                onSaveExercise={onSaveExercise}
              />
            </div>
          </div>
        </div>
      </header>


      {/* MIDI Debug Display - for testing */}
      <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 px-4 py-2 text-center">
        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
          MIDI Notes: {pressedMidiNotes.size > 0 ? Array.from(pressedMidiNotes).join(', ') : 'None pressed'} | 
          {beatInfo || 'No beat info'} | 
          <span className="text-green-700 dark:text-green-300">✓ Correct: {correctNotesCount}</span> | 
          <span className="text-red-700 dark:text-red-300">✗ Wrong: {wrongNotesCount}</span>
        </span>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Music Display Section */}
        <div className="card-body p-8">
          <MusicDisplay 
            abcNotation={abcNotation} 
            settings={settings}
            onVisualsReady={handleVisualsReady}
            pressedMidiNotes={pressedMidiNotes}
            enableRealtimeHighlighting={false}
            noteTrackingMap={noteTrackingMap}
            showPostPracticeResults={showPostPracticeResults}
          />
        </div>

        {/* Generate Button */}
        <div className="text-center">
          <button 
            className={`btn btn-primary btn-lg ${isGenerating ? 'loading' : ''} ${
              (isGenerating || isPlaying || isPracticing) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            onClick={handleGenerateNew}
            disabled={isGenerating || isPlaying || isPracticing}
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

function AppContent() {
  // Get current user from auth context
  const { user } = useAuth();
  
  // Settings state - will be loaded from persistence
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Tempo modal state
  const [tempoModalOpen, setTempoModalOpen] = useState(false);

  // Metronome state
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);

  // MIDI state - track currently pressed notes
  const [pressedMidiNotes, setPressedMidiNotes] = useState(new Set());

  // MIDI note lifecycle tracking for legato detection
  const [midiNoteStates, setMidiNoteStates] = useState(new Map());

  // Tone.js piano sampler for MIDI keyboard playback
  const pianoSamplerRef = useRef(null);

  // Scoring state - track correct and wrong notes during practice
  const [correctNotesCount, setCorrectNotesCount] = useState(0);
  const [wrongNotesCount, setWrongNotesCount] = useState(0);
  
  // Refs to track current scoring values without causing re-renders
  const correctNotesCountRef = useRef(0);
  const wrongNotesCountRef = useRef(0);
  
  // Score modal state
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  
  // Save exercise modal state
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  
  // Arrays to track individual notes played correctly and incorrectly
  const [correctNotes, setCorrectNotes] = useState([]);
  const [wrongNotes, setWrongNotes] = useState([]);
  
  // Captured scores to avoid race condition with resets
  const [capturedScores, setCapturedScores] = useState({
    correctCount: 0,
    wrongCount: 0,
    correctNotes: [],
    wrongNotes: []
  });

  // Post-practice highlighting state
  const [showPostPracticeResults, setShowPostPracticeResults] = useState(false);

  const handleSettingsChange = useCallback(async (newSettings) => {
    setSettings(newSettings);
    
    // Save settings automatically based on user type
    if (user && settingsLoaded) {
      const result = await saveUserSettings(user, newSettings);
      if (!result.success) {
        // Failed to save settings
      }
    }
  }, [user, settingsLoaded]);

  // Handle loading a saved exercise
  const handleLoadExercise = useCallback((exerciseSettings) => {
    setSettings(exerciseSettings);
  }, []);

  const handleTempoChange = useCallback(async (newTempo) => {
    const newSettings = { ...settings, tempo: newTempo };
    await handleSettingsChange(newSettings);
  }, [settings, handleSettingsChange]);

  const openTempoModal = useCallback(() => {
    setTempoModalOpen(true);
  }, []);

  const closeTempoModal = useCallback(() => {
    setTempoModalOpen(false);
  }, []);

  const handleMetronomeToggle = useCallback(() => {
    setIsMetronomeActive(prev => !prev);
  }, []);

  // Score modal functions
  const openScoreModal = useCallback(() => {
    setScoreModalOpen(true);
  }, []);

  const closeScoreModal = useCallback(() => {
    setScoreModalOpen(false);
  }, []);

  // Save modal functions
  const openSaveModal = useCallback(() => {
    setSaveModalOpen(true);
  }, []);

  const closeSaveModal = useCallback(() => {
    setSaveModalOpen(false);
  }, []);

  // Handle practice end - always show score modal
  const handlePracticeEnd = useCallback((practiceStats) => {
    
    // Auto-stop metronome when practice ends
    if (isMetronomeActive) {
      setIsMetronomeActive(false);
    }
    
    // Always use the accurate counters from MIDI Debug Display
    // These are the same counters shown in the debug display and are guaranteed to be correct
    const capturedCorrectCount = correctNotesCountRef.current;
    const capturedWrongCount = wrongNotesCountRef.current;
    const capturedCorrectNotes = [...correctNotes];
    const capturedWrongNotes = [...wrongNotes];
    
    setCapturedScores({
      correctCount: capturedCorrectCount,
      wrongCount: capturedWrongCount,
      correctNotes: capturedCorrectNotes,
      wrongNotes: capturedWrongNotes,
      // Include additional stats if provided by note tracking system
      totalNotes: practiceStats?.totalNotes,
      unplayedCount: practiceStats?.unplayedCount
    });
    
    // Enable post-practice highlighting to show results
    setShowPostPracticeResults(true);
    
    
    openScoreModal();
  }, [correctNotes, wrongNotes, openScoreModal, isMetronomeActive, setShowPostPracticeResults]);

  // Scoring functions
  const incrementCorrectNotes = useCallback((note) => {
    setCorrectNotesCount(prev => {
      const newValue = prev + 1;
      correctNotesCountRef.current = newValue;
      return newValue;
    });
    setCorrectNotes(prev => [...prev, note]);
  }, []);

  const incrementWrongNotes = useCallback((note) => {
    setWrongNotesCount(prev => {
      const newValue = prev + 1;
      wrongNotesCountRef.current = newValue;
      return newValue;
    });
    setWrongNotes(prev => [...prev, note]);
  }, []);

  const resetPostPracticeResults = useCallback(() => {
    setShowPostPracticeResults(false);
  }, []);

  const resetScoring = useCallback(() => {
    setCorrectNotesCount(0);
    setWrongNotesCount(0);
    setCorrectNotes([]);
    setWrongNotes([]);
    correctNotesCountRef.current = 0;
    wrongNotesCountRef.current = 0;
  }, []);

  // Handle save exercise - open modal
  const handleSaveExercise = useCallback(() => {
    openSaveModal();
  }, [openSaveModal]);

  // Handle cursor position change - mark currently held notes as "held from previous position"
  const handleCursorPositionChange = useCallback((activeNoteIds) => {
    console.log(`📍CURSOR: ids=[${activeNoteIds?.join(',') || 'none'}]`);
    setMidiNoteStates(prevStates => {
      const newStates = new Map(prevStates);
      const markedNotes = [];

      // Mark all currently pressed notes as "held from previous position"
      // This happens when the cursor moves to a new position
      newStates.forEach((noteState, noteName) => {
        if (noteState.isCurrentlyPressed) {
          newStates.set(noteName, {
            ...noteState,
            heldFromPreviousPosition: true
            // Don't reset wasReleasedAndRepressed - preserve it to detect re-presses
          });
          markedNotes.push(noteName);
        }
      });

      if (markedNotes.length > 0) {
        console.log(`📍MARKED: [${markedNotes.join(',')}]`);
      }

      return newStates;
    });
  }, []);

  // Handle actual save with exercise name
  const handleSaveExerciseWithName = useCallback(async (exerciseName) => {
    try {
      
      if (!user) {
        return { success: false, error: 'You must be logged in to save exercises.' };
      }

      if (user.isGuest) {
        // Save exercise to localStorage for guest users
        const exerciseData = {
          exercise_name: exerciseName.trim(),
          key_signature: settings.key || 'C',
          time_signature: settings.timeSignature || '4/4',
          measures: settings.measures || 8,
          tempo: settings.tempo || 120,
          intervals: settings.intervals || [1, 2, 3, 4, 5],
          note_durations: settings.noteDurations || ['1/8', '1/4'],
          chord_progressions: settings.chordProgressions || ['pop'],
          left_hand_patterns: settings.leftHandPatterns || ['block-chords'],
          left_hand_broken_chords: settings.leftHandBrokenChords || ['1-3-5-3'],
          right_hand_patterns: settings.rightHandPatterns || ['single-notes'],
          right_hand_intervals: settings.rightHandIntervals || ['2nd'],
          right_hand_4_note_chords: settings.rightHand4NoteChords || ['major'],
          swap_hand_patterns: settings.swapHandPatterns || false,
          chord_types: settings.chordTypes || ['major', 'minor'],
          chord_inversions: settings.chordInversions || ['root'],
          chord_voicings: settings.chordVoicings || ['closed'],
          chord_rhythms: settings.chordRhythms || ['straight'],
          melodic_patterns: settings.melodicPatterns || ['melodies'],
          melodic_articulations: settings.melodicArticulations || ['legato'],
          music_scale: settings.musicScale || 1.0,
          selected_level: settings.selectedLevel
        };

        const result = saveGuestExercise(exerciseData);
        
        if (result.success) {
          alert(`Exercise "${exerciseName}" saved successfully!`);
          return { success: true };
        } else {
          // Failed to save guest exercise
          return { success: false, error: result.error };
        }
      } else {
        // Save exercise using the database service for authenticated users
        const result = await ExerciseService.saveExercise(exerciseName, settings, user.id);
        
        if (result.success) {
          // Show success notification
          alert(`Exercise "${exerciseName}" saved successfully!`);
          return { success: true };
        } else {
          // Save failed
          return { success: false, error: result.error };
        }
      }
    } catch {
      // Error saving exercise
      return { success: false, error: 'An unexpected error occurred while saving the exercise.' };
    }
  }, [settings, user]);

  // MIDI event handler with full lifecycle tracking and audio playback
  const handleMidiEvent = useCallback((midiEvent) => {
    const currentTime = Date.now();

    // Play audio using Tone.js piano sampler
    if (pianoSamplerRef.current) {
      if (midiEvent.type === 'noteon') {
        // Start audio context if needed (required for user interaction)
        if (Tone.context.state !== 'running') {
          Tone.context.resume();
        }

        // Trigger note attack with velocity
        const velocity = midiEvent.velocity || 0.8;
        pianoSamplerRef.current.triggerAttack(midiEvent.note, Tone.now(), velocity);
        console.log(`🎵 Playing: ${midiEvent.note}`);
      } else if (midiEvent.type === 'noteoff') {
        // Release note
        pianoSamplerRef.current.triggerRelease(midiEvent.note, Tone.now());
      }
    }

    // Update pressed notes Set
    setPressedMidiNotes(prevNotes => {
      const newNotes = new Set(prevNotes);
      if (midiEvent.type === 'noteon') {
        newNotes.add(midiEvent.note);
      } else if (midiEvent.type === 'noteoff') {
        newNotes.delete(midiEvent.note);
      }
      return newNotes;
    });

    // Update MIDI note lifecycle states
    setMidiNoteStates(prevStates => {
      const newStates = new Map(prevStates);
      const noteName = midiEvent.note;

      if (midiEvent.type === 'noteon') {
        const existingState = newStates.get(noteName);

        // Check if this is a re-press (note was released and pressed again)
        const wasReleasedAndRepressed = existingState
          ? existingState.lastReleaseTime !== null && currentTime > existingState.lastReleaseTime
          : false;

        const newState = {
          isCurrentlyPressed: true,
          lastPressTime: currentTime,
          lastReleaseTime: existingState?.lastReleaseTime || null,
          heldFromPreviousPosition: existingState?.heldFromPreviousPosition || false,
          wasReleasedAndRepressed: wasReleasedAndRepressed
        };

        console.log(`🎹ON ${noteName}: held=${newState.heldFromPreviousPosition} repress=${wasReleasedAndRepressed}`);
        newStates.set(noteName, newState);
      } else if (midiEvent.type === 'noteoff') {
        const existingState = newStates.get(noteName);

        if (existingState) {
          console.log(`🎹OFF ${noteName}`);
          newStates.set(noteName, {
            ...existingState,
            isCurrentlyPressed: false,
            lastReleaseTime: currentTime,
            wasReleasedAndRepressed: false // Reset when released
          });
        }
      }

      return newStates;
    });
  }, []);

  // Initialize MIDI when app starts
  React.useEffect(() => {
    initializeMIDI(handleMidiEvent);
  }, [handleMidiEvent]);

  // Initialize Tone.js piano sampler for MIDI keyboard playback
  React.useEffect(() => {
    // Create piano sampler with Salamander Grand Piano samples
    pianoSamplerRef.current = new Tone.Sampler({
      urls: {
        A0: "A0.mp3",
        C1: "C1.mp3",
        "D#1": "Ds1.mp3",
        "F#1": "Fs1.mp3",
        A1: "A1.mp3",
        C2: "C2.mp3",
        "D#2": "Ds2.mp3",
        "F#2": "Fs2.mp3",
        A2: "A2.mp3",
        C3: "C3.mp3",
        "D#3": "Ds3.mp3",
        "F#3": "Fs3.mp3",
        A3: "A3.mp3",
        C4: "C4.mp3",
        "D#4": "Ds4.mp3",
        "F#4": "Fs4.mp3",
        A4: "A4.mp3",
        C5: "C5.mp3",
        "D#5": "Ds5.mp3",
        "F#5": "Fs5.mp3",
        A5: "A5.mp3",
        C6: "C6.mp3",
        "D#6": "Ds6.mp3",
        "F#6": "Fs6.mp3",
        A6: "A6.mp3",
        C7: "C7.mp3",
        "D#7": "Ds7.mp3",
        "F#7": "Fs7.mp3",
        A7: "A7.mp3",
        C8: "C8.mp3"
      },
      release: 1,
      baseUrl: "https://tonejs.github.io/audio/salamander/"
    }).toDestination();

    console.log('🎹 Tone.js piano sampler initialized');

    // Cleanup on unmount
    return () => {
      if (pianoSamplerRef.current) {
        pianoSamplerRef.current.dispose();
        console.log('🎹 Tone.js piano sampler disposed');
      }
    };
  }, []);

  // Load settings when user changes
  React.useEffect(() => {
    const loadSettings = async () => {
      if (user) {
        const result = await loadUserSettings(user);
        if (result.success) {
          setSettings(result.settings);
          setSettingsLoaded(true);
        } else {
          // Failed to load user settings
          setSettings(DEFAULT_SETTINGS);
          setSettingsLoaded(true);
        }
      } else {
        // No user, use defaults
        setSettings(DEFAULT_SETTINGS);
        setSettingsLoaded(false);
      }
    };

    loadSettings();
  }, [user]);

  return (
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
                    onLoadExercise={handleLoadExercise}
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
              path="/levels" 
              element={
                <ProtectedRoute>
                  <Levels 
                    selectedLevel={settings.selectedLevel} 
                    onLevelChange={(level) => handleSettingsChange({ ...settings, selectedLevel: level })}
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
                    onTempoClick={openTempoModal}
                    pressedMidiNotes={pressedMidiNotes}
                    correctNotesCount={correctNotesCount}
                    wrongNotesCount={wrongNotesCount}
                    onCorrectNote={incrementCorrectNotes}
                    onWrongNote={incrementWrongNotes}
                    onResetScoring={resetScoring}
                    onPracticeEnd={handlePracticeEnd}
                    isMetronomeActive={isMetronomeActive}
                    onMetronomeToggle={handleMetronomeToggle}
                    showPostPracticeResults={showPostPracticeResults}
                    onResetPostPracticeResults={resetPostPracticeResults}
                    onSaveExercise={handleSaveExercise}
                    user={user}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/flow"
              element={
                <ProtectedRoute>
                  <FlowView
                    settings={settings}
                    onSettingsChange={handleSettingsChange}
                    onTempoClick={openTempoModal}
                    pressedMidiNotes={pressedMidiNotes}
                    midiNoteStates={midiNoteStates}
                    onUpdateCursorPosition={handleCursorPositionChange}
                    correctNotesCount={correctNotesCount}
                    wrongNotesCount={wrongNotesCount}
                    onCorrectNote={incrementCorrectNotes}
                    onWrongNote={incrementWrongNotes}
                    onResetScoring={resetScoring}
                    onPracticeEnd={handlePracticeEnd}
                    isMetronomeActive={isMetronomeActive}
                    onMetronomeToggle={handleMetronomeToggle}
                    showPostPracticeResults={showPostPracticeResults}
                    onResetPostPracticeResults={resetPostPracticeResults}
                    onSaveExercise={handleSaveExercise}
                    user={user}
                  />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<LandingPage />} />
          </Routes>
          
          {/* Tempo Modal */}
          {tempoModalOpen && (
            <TempoSelector
              tempo={settings.tempo}
              onTempoChange={handleTempoChange}
              onClose={closeTempoModal}
            />
          )}

          {/* Score Modal */}
          {scoreModalOpen && (
            <ScoreModal
              isOpen={scoreModalOpen}
              onClose={closeScoreModal}
              correctCount={capturedScores.correctCount}
              wrongCount={capturedScores.wrongCount}
              correctNotes={capturedScores.correctNotes}
              wrongNotes={capturedScores.wrongNotes}
            />
          )}

          {/* Save Exercise Modal */}
          <SaveExerciseModal
            isOpen={saveModalOpen}
            onClose={closeSaveModal}
            onSave={handleSaveExerciseWithName}
          />
        </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChordsProvider>
          <AppContent />
        </ChordsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
