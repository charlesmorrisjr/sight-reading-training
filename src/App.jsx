import React, { useState, useCallback, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import * as ABCJS from 'abcjs';
import { FaMusic, FaPlay, FaStop, FaKeyboard } from 'react-icons/fa';
import HamburgerMenu from './components/HamburgerMenu';
import MusicDisplay from './components/MusicDisplay';
import TempoSelector from './components/TempoSelector';
import MetronomeButton from './components/MetronomeButton';
import ScoreModal from './components/ScoreModal';
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
import { initializeMIDI } from './utils/midiManager';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PracticeView = ({ settings, onSettingsChange, onTempoClick, pressedMidiNotes = new Set(), correctNotesCount = 0, wrongNotesCount = 0, onCorrectNote, onWrongNote, onResetScoring, onPracticeEnd, isMetronomeActive, onMetronomeToggle }) => {
  const location = useLocation();
  
  // Get intervals from location state if available
  const intervalsFromState = location.state?.intervals;
  
  // Merge location state with settings if intervals were passed
  const effectiveSettings = useMemo(() => {
    return intervalsFromState 
      ? { ...settings, intervals: intervalsFromState }
      : settings;
  }, [settings, intervalsFromState]);
  
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
  

  
  // Handle metronome external beat trigger
  const handleMetronomeTrigger = useCallback((triggerFunction) => {
    metronomeTriggerRef.current = triggerFunction;
  }, []);

  // Convert MIDI pitch number to note name (e.g., 60 -> "C4")
  const midiPitchToNoteName = useCallback((midiNumber) => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNumber / 12) - 1;
    const noteIndex = midiNumber % 12;
    return noteNames[noteIndex] + octave;
  }, []);

  // Generate new exercise
  const handleGenerateNew = useCallback(async () => {
    setIsGenerating(true);
    setIsVisualsReady(false);
    
    // Reset scoring when generating new exercise
    if (onResetScoring) {
      onResetScoring();
      console.log('🎯 New exercise generated - scoring reset');
    }
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const result = generateRandomABC(effectiveSettings);
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
      
      console.log('📝 Generated music with metadata:', result.noteMetadata);
      console.log('🗺️ Initialized note tracking map:', initialTrackingMap);
    } catch (error) {
      console.error('Error generating ABC notation:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [effectiveSettings, onResetScoring]);

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
  const startVisualCursor = useCallback((isPracticeMode = false) => {
    console.log(`Starting ${isPracticeMode ? 'practice mode' : 'abcjs TimingCallbacks-based'} cursor...`);
    
    // Cursor padding constants
    const CURSOR_TOP_PADDING = 5;
    const CURSOR_BOTTOM_PADDING = 25;
    
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
    cursorLine.setAttribute('stroke', isPracticeMode ? '#f59e0b' : '#3b82f6'); // Orange for practice, blue for play
    cursorLine.setAttribute('stroke-width', '12');
    cursorLine.setAttribute('stroke-linecap', 'round');
    cursorLine.setAttribute('opacity', '0.3');
    cursorLine.style.pointerEvents = 'none';
    
    // Add cursor to SVG
    svgContainer.appendChild(cursorLine);
    console.log('Cursor line added to SVG');
    
    // Create TimingCallbacks for precise synchronization
    console.log('🚀 Creating TimingCallbacks with config:', {
      qpm: effectiveSettings.tempo,
      beatSubdivisions: 4,
      isPracticeMode,
      visualObject: !!visualObjectRef.current,
      noteMetadataCount: noteMetadata.length
    });
    
    let timingCallbacks;
    try {
      timingCallbacks = new ABCJS.TimingCallbacks(visualObjectRef.current, {
        qpm: effectiveSettings.tempo, // Quarter notes per minute - matches settings
        beatSubdivisions: 4, // Get callbacks on 16th note boundaries for smoothness
        
        // Event callback - called for each musical event (note, rest, etc.)
        eventCallback: (event) => {
          // Add immediate logging to verify callback fires
          // console.log('⚡ EventCallback fired!', { hasEvent: !!event, eventType: typeof event, isPracticeMode });
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
          }
          setBeatInfo(''); // Clear beat info when music ends
          currentNotesRef.current = new Set(); // Clear current notes when music ends

          if (!isPracticeMode && synthRef.current) {
            synthRef.current.stop();
          }
          // Remove cursor
          if (cursorLine && cursorLine.parentNode) {
            cursorLine.remove();
          }
          return;
        }
        
          // Enhanced debugging and note tracking (commented out)
          // if (event) {
          //   console.log('🎵 Processing event with data:', { event: event, eventKeys: Object.keys(event), hasMidiPitches: !!(event.midiPitches && Array.isArray(event.midiPitches)), midiPitchesLength: event.midiPitches ? event.midiPitches.length : 0, midiPitches: event.midiPitches });
          // }
        
        // Note: Current notes are now managed by beatCallback for more reliable detection
        // This eventCallback focuses on cursor positioning only
        
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
        
        // 🎯 Calculate current active notes using ABCJS event timing
        // This approach uses event.milliseconds for precise timing that works across all BPM values
        // and eliminates timing lag between beat calculation and cursor display
        if (isPracticeMode && event && event.milliseconds !== undefined) {
          // Validate tempo to prevent division by zero or invalid values
          let tempo = effectiveSettings.tempo || 120;
          if (tempo <= 0 || tempo > 300) {
            console.warn(`Invalid tempo: ${tempo}, using default 120 BPM`);
            tempo = 120;
          }
          
          // Convert ABCJS milliseconds to musical beats
          // This formula works for any BPM: (ms / 1000 seconds) * (beats per minute / 60 seconds) = beats
          const currentTimeInBeats = (event.milliseconds / 1000) * (tempo / 60);
          
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
            
            if (currentTimeInBeats >= absoluteStartBeat && currentTimeInBeats < absoluteEndBeat) {
              activeNotes.add(noteData.expectedNote);
              activeNoteIds.add(noteData.id);
            }
          });
          
          // Update current notes refs
          currentNotesRef.current = activeNotes;
          currentNoteIdsRef.current = activeNoteIds;
          
          const activeNotesAtCursor = Array.from(activeNotes);
          console.log(`🎯 Cursor at position ${cursorX.toFixed(0)}, expected notes: [${activeNotesAtCursor.join(', ')}]`);
        }
      },
      
        // Beat callback - called on each beat for additional timing info
        beatCallback: (beatNumber, totalBeats) => {
          // Beat info for debugging display
          setBeatInfo(`Beat ${beatNumber}/${totalBeats}`);
          
          // Only trigger metronome on whole beat counts: 1, 2, 3, 4... (exclude 0)
          // Since beatSubdivisions=4, beatNumber increments: 0.0, 0.25, 0.5, 0.75, 1.0, 1.25...
          // We want metronome clicks only on beats 1, 2, 3, 4... (not on beat 0)
          const roundedBeat = Math.round(beatNumber);
          const isWholeBeat = Math.abs(beatNumber - roundedBeat) < 0.1 && roundedBeat >= 1;
          
          // Trigger metronome beat if active, external trigger available, and on whole beat >= 1
          if (isMetronomeActive && metronomeTriggerRef.current && isWholeBeat) {
            metronomeTriggerRef.current();
          }
        },
      
      // Line end callback - called when reaching end of a music line
      lineEndCallback: (info) => {
        // console.log('Line end reached:', info);
        
        // Use line-level bounds when available for more accurate cursor positioning
        if (info && info.top !== undefined && info.bottom !== undefined && svgContainer.contains(cursorLine)) {
          // Update cursor height to span the entire line with consistent padding
          cursorLine.setAttribute('y1', info.top - CURSOR_TOP_PADDING);
          cursorLine.setAttribute('y2', info.bottom + CURSOR_BOTTOM_PADDING);
          
          // Debug
          // console.log(`Updated cursor height using line bounds with padding: Y=${(info.top - CURSOR_TOP_PADDING).toFixed(0)} to ${(info.bottom + CURSOR_BOTTOM_PADDING).toFixed(0)}`);
        }
      }
      });
    } catch (error) {
      console.error('❌ Error creating TimingCallbacks:', error);
      return; // Exit if TimingCallbacks creation fails
    }
    
    // Store timing callbacks reference for cleanup
    cursorLine.timingCallbacks = timingCallbacks;
    
    // Create a way to stop the animation externally
    cursorLine.stopAnimation = () => {
      console.log('External stop called on TimingCallbacks cursor');
      if (timingCallbacks) {
        timingCallbacks.stop();
      }
    };
    
    // Start the timing callbacks with error handling
    console.log('🚀 Starting TimingCallbacks...');
    try {
      timingCallbacks.start();
      console.log('✅ TimingCallbacks started successfully');
    } catch (error) {
      console.error('❌ Error starting TimingCallbacks:', error);
    }
    
    console.log(`${isPracticeMode ? 'Practice mode' : 'abcjs TimingCallbacks'} cursor setup completed`);
  }, [effectiveSettings.tempo, onPracticeEnd, isMetronomeActive, noteMetadata, noteTrackingMap]);

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
      
      // Start playback normally 
      synthRef.current.start(undefined, {
        end: () => {
          console.log('Playback ended');
          setIsPlaying(false);
        }
      });
      
      // Start visual cursor
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
      
      setIsPracticing(false);
      return;
    }

    if (!visualObjectRef.current) {
      console.error('No music notation loaded');
      return;
    }

    try {
      setIsPracticing(true);
      

      
      // Start visual cursor without audio playback
      startVisualCursor(true); // Pass true to indicate practice mode (no audio)

    } catch (error) {
      console.error('Error during practice:', error);
      setIsPracticing(false);
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
  }, [isPracticing, startVisualCursor]);

  React.useEffect(() => {
    handleGenerateNew();
  }, [handleGenerateNew]);

  // Keep refs synchronized with state to avoid stale closure issues
  // Fixes problem with visual cursor disappearing when notes were highlighted
  React.useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  React.useEffect(() => {
    isPracticingRef.current = isPracticing;
  }, [isPracticing]);

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
    }
    
    // Skip scoring if locked (already scored at this cursor position)
    if (scoringLockedRef.current) {
      // Update previous pressed notes even when locked to avoid stale state
      previousPressedNotesRef.current = new Set(pressedMidiNotes);
      return;
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
      
      // Find the first unplayed note that matches (priority-based matching)
      // This prevents one key press from matching multiple note IDs
      for (const noteId of currentActiveNoteIds) {
        const trackedNote = noteTrackingMap.get(noteId);
        
        if (trackedNote && trackedNote.status === 'unplayed') {
          // Check if the pressed note matches this tracked note
          if (trackedNote.expectedNote === pressedNote || 
              (trackedNote.midiPitch && midiPitchToNoteName(trackedNote.midiPitch) === pressedNote)) {
            
            // Mark note as correct and update tracking
            setNoteTrackingMap(prevMap => {
              const newMap = new Map(prevMap);
              newMap.set(noteId, { ...trackedNote, status: 'correct' });
              return newMap;
            });
            
            onCorrectNote(pressedNote);
            noteProcessed = true;
            processedNotesInThisCycle.add(pressedNote); // Mark as processed
            scoringLockedRef.current = true; // Lock scoring after correct note
            break; // Only match the first unplayed note - prevents duplicates
          }
        }
      }
      
      // If note wasn't processed as correct, check if it's a wrong note
      if (!noteProcessed && !expectedNotes.has(pressedNote)) {
        // Completely wrong note - only count if not already processed
        onWrongNote(pressedNote);
        processedNotesInThisCycle.add(pressedNote); // Mark as processed
        scoringLockedRef.current = true; // Lock scoring after wrong note
      }
    });

    // Update previous pressed notes for next comparison
    previousPressedNotesRef.current = new Set(pressedMidiNotes);
  }, [pressedMidiNotes, isPracticing, onCorrectNote, onWrongNote, noteTrackingMap, midiPitchToNoteName, correctNotesCount, wrongNotesCount]);

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

            {/* Control Buttons */}
            <div className="flex items-center space-x-4">
              {/* Tempo Button */}
              <button
                onClick={onTempoClick}
                className="btn btn-outline text-gray-700 hover:bg-gray-100"
                title="Change Tempo"
              >
                <span className="text-sm font-medium">{effectiveSettings.tempo} BPM</span>
              </button>

              {/* Metronome Button */}
              <MetronomeButton
                tempo={effectiveSettings.tempo}
                isActive={isMetronomeActive}
                onToggle={onMetronomeToggle}
                disabled={isInitializing || !isVisualsReady || isPlaying || isPracticing}
                useExternalTiming={isPlaying || isPracticing}
                onExternalBeatTrigger={handleMetronomeTrigger}
              />

              {/* Play Button */}
              <button 
                className={`btn btn-lg ${isPlaying ? 'btn-error' : 'btn-primary'} ${
                  (isInitializing || !isVisualsReady || isPracticing) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handlePlayClick}
                disabled={isInitializing || !isVisualsReady || isPracticing}
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

              {/* Practice Button */}
              <button 
                className={`btn btn-lg ${isPracticing ? 'btn-error' : 'btn-warning'} ${
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

              {/* Settings */}
              <HamburgerMenu
                settings={settings}
                onSettingsChange={onSettingsChange}
              />
            </div>
          </div>
        </div>
      </header>

      {/* MIDI Debug Display - for testing */}
      <div className="bg-yellow-100 border border-yellow-300 px-4 py-2 text-center">
        <span className="text-sm font-medium text-yellow-800">
          MIDI Notes: {pressedMidiNotes.size > 0 ? Array.from(pressedMidiNotes).join(', ') : 'None pressed'} | 
          {beatInfo || 'No beat info'} | 
          <span className="text-green-700">✓ Correct: {correctNotesCount}</span> | 
          <span className="text-red-700">✗ Wrong: {wrongNotesCount}</span>
        </span>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Music Display Section */}
        <div className="card-body p-8">
          <MusicDisplay 
            abcNotation={abcNotation} 
            settings={effectiveSettings}
            onVisualsReady={handleVisualsReady}
            pressedMidiNotes={pressedMidiNotes}
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
    tempo: 120,
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

  // Tempo modal state
  const [tempoModalOpen, setTempoModalOpen] = useState(false);

  // Metronome state
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);

  // MIDI state - track currently pressed notes
  const [pressedMidiNotes, setPressedMidiNotes] = useState(new Set());

  // Scoring state - track correct and wrong notes during practice
  const [correctNotesCount, setCorrectNotesCount] = useState(0);
  const [wrongNotesCount, setWrongNotesCount] = useState(0);
  
  // Refs to track current scoring values without causing re-renders
  const correctNotesCountRef = useRef(0);
  const wrongNotesCountRef = useRef(0);
  
  // Score modal state
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  
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

  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings);
  }, []);

  const handleTempoChange = useCallback((newTempo) => {
    setSettings(prev => ({ ...prev, tempo: newTempo }));
  }, []);

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

  // Handle practice end - always show score modal
  const handlePracticeEnd = useCallback((practiceStats) => {
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
    
    // Keep essential practice end logging for troubleshooting
    if (practiceStats) {
      console.log('Practice ended - Note tracking vs Accurate scores:', {
        tracking: { correct: practiceStats.correctCount, wrong: practiceStats.wrongCount },
        accurate: { correct: capturedCorrectCount, wrong: capturedWrongCount }
      });
    }
    
    openScoreModal();
  }, [correctNotes, wrongNotes, openScoreModal]);

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

  const resetScoring = useCallback(() => {
    setCorrectNotesCount(0);
    setWrongNotesCount(0);
    setCorrectNotes([]);
    setWrongNotes([]);
    correctNotesCountRef.current = 0;
    wrongNotesCountRef.current = 0;
  }, []);

  // MIDI event handler
  const handleMidiEvent = useCallback((midiEvent) => {
    // Debugging MIDI events
    // console.log('MIDI Event received in App:', midiEvent);
    setPressedMidiNotes(prevNotes => {
      const newNotes = new Set(prevNotes);
      if (midiEvent.type === 'noteon') {
        newNotes.add(midiEvent.note);
      } else if (midiEvent.type === 'noteoff') {
        newNotes.delete(midiEvent.note);
      }
      return newNotes;
    });
  }, []);

  // Initialize MIDI when app starts
  React.useEffect(() => {
    initializeMIDI(handleMidiEvent);
  }, [handleMidiEvent]);

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
                  />
                </ProtectedRoute>
              } 
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
        
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
        </ChordsProvider>
      </IntervalsProvider>
    </AuthProvider>
  );
}

export default App;
