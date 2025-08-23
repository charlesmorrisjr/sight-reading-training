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
import Levels from './components/Levels';
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

const PracticeView = ({ settings, onSettingsChange, onTempoClick, pressedMidiNotes = new Set(), correctNotesCount = 0, wrongNotesCount = 0, onCorrectNote, onWrongNote, onResetScoring, onPracticeEnd, isMetronomeActive, onMetronomeToggle, showPostPracticeResults = false, onResetPostPracticeResults }) => {
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
      
      // Reset post-practice highlighting when generating new exercise
      if (onResetPostPracticeResults) {
        onResetPostPracticeResults();
        console.log('🎨 Post-practice highlighting reset for new exercise');
      }
      
      console.log('📝 Generated music with metadata:', result.noteMetadata);
      console.log('🗺️ Initialized note tracking map:', initialTrackingMap);
    } catch (error) {
      console.error('Error generating ABC notation:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [effectiveSettings, onResetScoring, onResetPostPracticeResults]);

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
      extraMeasuresAtBeginning: isPracticeMode ? 2 : 0,
      isPracticeMode,
      visualObject: !!visualObjectRef.current,
      noteMetadataCount: noteMetadata.length
    });
    
    let timingCallbacks;
    try {
      timingCallbacks = new ABCJS.TimingCallbacks(visualObjectRef.current, {
        qpm: effectiveSettings.tempo, // Quarter notes per minute - matches settings
        beatSubdivisions: 4, // Get callbacks on 16th note boundaries for smoothness
        extraMeasuresAtBeginning: isPracticeMode ? 2 : 0, // Add 2 countdown measures for practice mode
        
        // Event callback - called for each musical event (note, rest, etc.)
        eventCallback: (event) => {
          // Enhanced logging to track practice end sequence
          console.log('⚡ EventCallback fired!', { 
            hasEvent: !!event, 
            eventType: typeof event, 
            isPracticeMode, 
            isPracticingRef: isPracticingRef.current,
            isMetronomeActiveRef: isMetronomeActiveRef.current,
            timestamp: new Date().toISOString().substring(17, 23)
          });
          
        if (!event) {
          console.log('🏁 MUSIC ENDED - Starting cleanup sequence');
          // Music has ended - stop playback and reset button
          if (!isPracticeMode) {
            setIsPlaying(false);
          }
          
          // Call onPracticeEnd if we were in practice mode with note tracking statistics
          console.log('🎯 Checking practice end condition:', {
            isPracticingRef: isPracticingRef.current,
            hasOnPracticeEnd: !!onPracticeEnd,
            willCallPracticeEnd: isPracticingRef.current && onPracticeEnd
          });
          
          if (isPracticingRef.current && onPracticeEnd) {
            console.log('📊 Calling onPracticeEnd...');
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
            console.log('🧹 Cleaning up practice mode state...', {
              wasPracticing: isPracticingRef.current,
              wasMetronomeActive: isMetronomeActiveRef.current
            });
            
            setIsPracticing(false);
            setIsCountingDown(false);
            setCountdownBeats(0);
            
            // CRITICAL FIX: Stop metronome immediately to prevent internal timing fallback
            if (isMetronomeActiveRef.current) {
              console.log('🔇 Setting isMetronomeActiveRef.current = false');
              isMetronomeActiveRef.current = false;
              console.log('🎯 Metronome stopped: practice ended naturally');
              
              // Also trigger metronome toggle to ensure MetronomeButton internal timing stops
              console.log('🛑 Calling onMetronomeToggle to stop MetronomeButton internal timing');
              if (onMetronomeToggle) {
                onMetronomeToggle();
              }
            } else {
              console.log('⚠️ Metronome was already inactive');
            }
          }
          setBeatInfo(''); // Clear beat info when music ends
          currentNotesRef.current = new Set(); // Clear current notes when music ends

          if (!isPracticeMode && synthRef.current) {
            synthRef.current.stop();
          }
          // Stop TimingCallbacks to prevent infinite beatCallback execution
          console.log('🛑 Attempting to stop TimingCallbacks...', {
            hasTimingCallbacks: !!timingCallbacks,
            hasCursor: !!(cursorLine && cursorLine.parentNode)
          });
          
          if (timingCallbacks) {
            console.log('⏹️ Calling timingCallbacks.stop()');
            timingCallbacks.stop();
            console.log('✅ TimingCallbacks stopped successfully');
          } else {
            console.log('⚠️ No timingCallbacks reference found');
          }
          
          // Remove cursor
          if (cursorLine && cursorLine.parentNode) {
            console.log('🗑️ Removing cursor from DOM');
            cursorLine.remove();
          }
          
          console.log('🏁 EventCallback cleanup complete - music ended');
          return;
        }
        
          // Enhanced debugging and note tracking (commented out)
          // if (event) {
          //   console.log('🎵 Processing event with data:', { event: event, eventKeys: Object.keys(event), hasMidiPitches: !!(event.midiPitches && Array.isArray(event.midiPitches)), midiPitchesLength: event.midiPitches ? event.midiPitches.length : 0, midiPitches: event.midiPitches });
          // }
        
        // For practice mode, hide cursor during countdown 
        if (isPracticeMode && event.milliseconds !== undefined) {
          const tempo = effectiveSettings.tempo || 120;
          const currentTimeInBeats = (event.milliseconds / 1000) * (tempo / 60);
          
          // Calculate dynamic countdown beats based on time signature
          const [beatsPerMeasure] = effectiveSettings.timeSignature.split('/').map(Number);
          const countdownBeats = beatsPerMeasure * 2; // 2 measures countdown
          
          if (currentTimeInBeats < countdownBeats) {
            // During countdown - hide cursor by positioning it off-screen
            cursorLine.setAttribute('x1', -100);
            cursorLine.setAttribute('y1', -100);
            cursorLine.setAttribute('x2', -100);
            cursorLine.setAttribute('y2', -100);
            console.log(`🔒 Hiding cursor during countdown: ${currentTimeInBeats.toFixed(2)}/${countdownBeats}`);
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
          
          // Only process notes after countdown period
          // Calculate dynamic countdown beats based on time signature
          const [beatsPerMeasure] = effectiveSettings.timeSignature.split('/').map(Number);
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
            
            const activeNotesAtCursor = Array.from(activeNotes);
            console.log(`🎯 Cursor at position ${cursorX.toFixed(0)}, expected notes: [${activeNotesAtCursor.join(', ')}]`);
          }
        }
      },
      
        // Beat callback - called on each beat for additional timing info
        beatCallback: (beatNumber, totalBeats) => {
          // Enhanced debug logging to track metronome decisions
          console.log(`🥁 BeatCallback: beatNumber=${beatNumber}, totalBeats=${totalBeats}, isPracticeMode=${isPracticeMode}, practicing=${isPracticingRef.current}, metronomeRef=${isMetronomeActiveRef.current}`);
          
          // CRITICAL: Check if beatCallback is still firing after music should have ended
          if (beatNumber >= totalBeats) {
            console.error(`🚨 CRITICAL: BeatCallback firing AFTER music end! Beat ${beatNumber}/${totalBeats}`);
          }
          
          // Handle countdown phase for practice mode
          if (isPracticeMode) {
            const [beatsPerMeasure] = effectiveSettings.timeSignature.split('/').map(Number);
            const countdownTotalBeats = beatsPerMeasure * 2; // 2 measures countdown
            
            // Since extraMeasuresAtBeginning doesn't seem to work in this version of ABCJS,
            // we'll create our own countdown by treating the first 8 beats as countdown
            if (beatNumber < countdownTotalBeats) {
              // We're in countdown phase (first 8 beats for 4/4 time)
              const remainingBeats = countdownTotalBeats - Math.floor(beatNumber);
              console.log(`🔢 Countdown: beatNumber=${beatNumber}, remainingBeats=${remainingBeats}`);
              setCountdownBeats(remainingBeats);
              setIsCountingDown(remainingBeats > 0);
            } else {
              // We're past countdown - in actual music
              console.log(`🎵 Music started: beatNumber=${beatNumber}`);
              setIsCountingDown(false);
              setCountdownBeats(0);
            }
          }
          
          // Beat info for debugging display
          setBeatInfo(`Beat ${beatNumber}/${totalBeats}`);
          
          // Trigger metronome on whole beat counts (including countdown beats)
          const roundedBeat = Math.round(beatNumber);
          const isWholeBeat = Math.abs(beatNumber - roundedBeat) < 0.1;
          
          console.log(`🎛️ Metronome check: roundedBeat=${roundedBeat}, isWholeBeat=${isWholeBeat}, isMetronomeActive=${isMetronomeActive}, isMetronomeActiveRef=${isMetronomeActiveRef.current}, hasTrigger=${!!metronomeTriggerRef.current}`);
          
          // For practice mode, trigger metronome during countdown OR if metronome is active
          // Use ref instead of state to avoid async timing issues
          const [beatsPerMeasure] = effectiveSettings.timeSignature.split('/').map(Number);
          const countdownTotalBeats = beatsPerMeasure * 2; // 2 measures countdown
          const shouldTriggerMetronome = isPracticeMode ? 
            (beatNumber < countdownTotalBeats || isMetronomeActiveRef.current) : // Countdown always plays, then only if metronome active
            isMetronomeActiveRef.current; // Non-practice mode only if metronome active
          
          console.log(`🔍 Metronome decision: shouldTrigger=${shouldTriggerMetronome}, countdown=${beatNumber < countdownTotalBeats}, practicing=${isPracticingRef.current}`);
          
          if (shouldTriggerMetronome && metronomeTriggerRef.current && isWholeBeat && beatNumber < totalBeats) {
            console.log(`🥁 TRIGGERING metronome beat: ${roundedBeat}`);
            metronomeTriggerRef.current();
          } else if (isWholeBeat) {
            console.log(`🔇 NOT triggering metronome: shouldTrigger=${shouldTriggerMetronome}, hasTrigger=${!!metronomeTriggerRef.current}`);
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
  }, [effectiveSettings.tempo, effectiveSettings.timeSignature, onPracticeEnd, isMetronomeActive, noteMetadata, noteTrackingMap, onMetronomeToggle]);

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
    console.log('🎹 Practice button clicked, isPracticing:', isPracticing);
    
    if (isPracticing) {
      console.log('🛑 Stopping practice mode');
      
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
        console.log('🔇 Manual stop: Setting isMetronomeActiveRef.current = false');
        isMetronomeActiveRef.current = false;
        console.log('🎯 Metronome stopped: practice stopped manually');
        
        // Also trigger metronome toggle to ensure MetronomeButton internal timing stops
        console.log('🛑 Manual stop: Calling onMetronomeToggle to stop MetronomeButton internal timing');
        if (onMetronomeToggle) {
          onMetronomeToggle();
        }
      } else {
        console.log('⚠️ Manual stop: Metronome was already inactive');
      }
      
      setIsPracticing(false);
      setIsCountingDown(false);
      setCountdownBeats(0);
      return;
    }

    if (!visualObjectRef.current) {
      console.error('No music notation loaded');
      return;
    }

    try {
      console.log('🚀 Starting practice mode with countdown');
      
      // Auto-start metronome if not already active
      if (!isMetronomeActive) {
        console.log('🥁 Auto-starting metronome for practice mode');
        onMetronomeToggle(); // This will set isMetronomeActive to true
        isMetronomeActiveRef.current = true; // Update ref immediately for sync
      }
      
      // CRITICAL FIX: Always sync ref with state when starting practice
      // This ensures metronome works on subsequent practice sessions even if manually started
      isMetronomeActiveRef.current = isMetronomeActive;
      console.log('🔄 Metronome ref synchronized with state:', {
        isMetronomeActive,
        isMetronomeActiveRef: isMetronomeActiveRef.current
      });
      
      setIsPracticing(true);
      
      // Start visual cursor with countdown - this will trigger the countdown automatically
      startVisualCursor(true); // Pass true to indicate practice mode (no audio)

    } catch (error) {
      console.error('Error during practice:', error);
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
    }
  }, [isPracticing, startVisualCursor, isMetronomeActive, onMetronomeToggle]);

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
                className={`btn btn-lg btn-outline text-gray-700 hover:bg-gray-100 ${
                  (isPlaying || isPracticing) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={isPlaying || isPracticing}
                title="Change Tempo"
              >
                <span className="text-lg font-medium">{effectiveSettings.tempo} BPM</span>
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

      {/* Countdown Display */}
      {isCountingDown && (
        <div className="bg-orange-100 border border-orange-300 px-4 py-8 text-center animate-pulse">
          <div className="text-6xl font-bold text-orange-800 mb-2">
            {countdownBeats}
          </div>
          <div className="text-lg font-medium text-orange-700">
            Practice starts in {countdownBeats} beat{countdownBeats !== 1 ? 's' : ''}
          </div>
        </div>
      )}

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
    swapHandPatterns: false,
    chordTypes: ['major', 'minor'],
    chordInversions: ['root'],
    chordVoicings: ['closed'],
    chordRhythms: ['straight'],
    melodicPatterns: ['melodies'],
    melodicArticulations: ['legato'],
    musicScale: 1.0,
    selectedLevel: null
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

  // Post-practice highlighting state
  const [showPostPracticeResults, setShowPostPracticeResults] = useState(false);

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
    console.log('🎯 handlePracticeEnd called', {
      isMetronomeActive,
      practiceStats,
      timestamp: new Date().toISOString().substring(17, 23)
    });
    
    // Auto-stop metronome when practice ends
    if (isMetronomeActive) {
      console.log('🔇 Setting isMetronomeActive to false in App component');
      setIsMetronomeActive(false);
    } else {
      console.log('⚠️ Metronome was already inactive in App component');
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
    console.log('🎨 Post-practice highlighting enabled - showing note results');
    
    // Keep essential practice end logging for troubleshooting
    if (practiceStats) {
      console.log('Practice ended - Note tracking vs Accurate scores:', {
        tracking: { correct: practiceStats.correctCount, wrong: practiceStats.wrongCount },
        accurate: { correct: capturedCorrectCount, wrong: capturedWrongCount }
      });
    }
    
    console.log('📊 Opening score modal...');
    openScoreModal();
    console.log('✅ handlePracticeEnd complete');
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
