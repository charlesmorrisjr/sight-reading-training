import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as ABCJS from 'abcjs';
import { FaMusic, FaKeyboard, FaRedo, FaClock, FaStop } from 'react-icons/fa';
import HamburgerMenu from './HamburgerMenu';
import MusicDisplay from './MusicDisplay';
import DarkModeToggle from './DarkModeToggle';
import TempoSelector from './TempoSelector';
import MetronomeButton from './MetronomeButton';
import { incrementExercisesGenerated, updateLastPracticed } from '../services/database';
import { generateRandomABC } from '../utils/musicGenerator';
import { incrementGuestExercisesGenerated } from '../services/settingsService';

const FlowView = ({ settings, onSettingsChange, onTempoClick, pressedMidiNotes = new Set(), midiNoteStates = new Map(), onUpdateCursorPosition, correctNotesCount = 0, wrongNotesCount = 0, onCorrectNote, onWrongNote, onResetScoring, onPracticeEnd, isMetronomeActive, onMetronomeToggle, showPostPracticeResults = false, onResetPostPracticeResults, user }) => {
  const navigate = useNavigate();

  // Current ABC notation and note metadata for first display
  const [abcNotation, setAbcNotation] = useState('');
  const [noteMetadata, setNoteMetadata] = useState([]);

  // Second display ABC notation and note metadata
  const [abcNotation2, setAbcNotation2] = useState('');
  const [noteMetadata2, setNoteMetadata2] = useState([]);

  // Loading state
  const [isGenerating, setIsGenerating] = useState(false);

  // Practice state
  const [isPracticing, setIsPracticing] = useState(false);

  // Continuous practice state
  const [currentPlayingDisplay, setCurrentPlayingDisplay] = useState(null); // 1, 2, or null
  const [continuousPracticeActive, setContinuousPracticeActive] = useState(false);
  const [isVisualsReady, setIsVisualsReady] = useState(false);
  const [isVisualsReady2, setIsVisualsReady2] = useState(false);
  const visualObjectRef = useRef(null);
  const visualObjectRef2 = useRef(null);

  // Beat tracking state for debugging display
  const [beatInfo, setBeatInfo] = useState('');

  // Countdown state
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownBeats, setCountdownBeats] = useState(0);

  // Current notes tracking for debugging display - use ref to avoid stale closure
  const currentNotesRef = useRef(new Set());

  // Note tracking system - separate maps for each exercise
  const [noteTrackingMap1, setNoteTrackingMap1] = useState(new Map());
  const [noteTrackingMap2, setNoteTrackingMap2] = useState(new Map());
  const currentNoteIdsRef = useRef(new Set());

  // Refs to track current practice state without causing re-renders
  const isPracticingRef = useRef(false);
  const continuousPracticeActiveRef = useRef(false);
  const currentPlayingDisplayRef = useRef(null);

  // Track background generation state to prevent race conditions
  const backgroundGenerationActiveRef = useRef(new Set());

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

      // Reset note tracking map statuses to 'unplayed' for both exercises
      setNoteTrackingMap1(prevMap => {
        const newMap = new Map();
        prevMap.forEach((note, id) => {
          newMap.set(id, { ...note, status: 'unplayed' });
        });
        return newMap;
      });

      setNoteTrackingMap2(prevMap => {
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
    setIsVisualsReady2(false);

    // Reset scoring when generating new exercise
    if (onResetScoring) {
      onResetScoring();
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      // Generate first 4-measure exercise
      const settingsFor4Measures = { ...settings, measures: 4 };
      const result1 = generateRandomABC(settingsFor4Measures);
      setAbcNotation(result1.abcNotation);
      setNoteMetadata(result1.noteMetadata);

      // Generate second 4-measure exercise
      const result2 = generateRandomABC(settingsFor4Measures);
      setAbcNotation2(result2.abcNotation);
      setNoteMetadata2(result2.noteMetadata);

      // Initialize separate note tracking maps for each exercise
      const initialTrackingMap1 = new Map();
      const initialTrackingMap2 = new Map();

      // Add notes from first exercise
      result1.noteMetadata.forEach(note => {
        initialTrackingMap1.set(note.id, {
          ...note,
          status: 'unplayed', // unplayed | correct | incorrect
          displayNumber: 1
        });
      });

      // Add notes from second exercise (no unique ID prefix needed since they're in separate maps)
      result2.noteMetadata.forEach(note => {
        initialTrackingMap2.set(note.id, {
          ...note,
          status: 'unplayed',
          displayNumber: 2
        });
      });

      setNoteTrackingMap1(initialTrackingMap1);
      setNoteTrackingMap2(initialTrackingMap2);

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

  // Update note tracking map for a specific display
  const updateNoteTrackingForDisplay = useCallback((displayNumber, newNoteMetadata) => {
    if (displayNumber === 1) {
      // Update tracking map for Exercise 1
      const newMap = new Map();
      newNoteMetadata.forEach(note => {
        newMap.set(note.id, {
          ...note,
          status: 'unplayed',
          displayNumber: 1
        });
      });
      setNoteTrackingMap1(newMap);
    } else if (displayNumber === 2) {
      // Update tracking map for Exercise 2
      const newMap = new Map();
      newNoteMetadata.forEach(note => {
        newMap.set(note.id, {
          ...note,
          status: 'unplayed',
          displayNumber: 2
        });
      });
      setNoteTrackingMap2(newMap);
    }
  }, []);

  // Generate new exercise for a specific display (1 or 2)
  const generateSingleExercise = useCallback(async (displayNumber) => {
    try {
      // Generate new 4-measure exercise
      const settingsFor4Measures = { ...settings, measures: 4 };
      const result = generateRandomABC(settingsFor4Measures);

      // Update the appropriate display's notation and metadata
      if (displayNumber === 1) {
        setAbcNotation(result.abcNotation);
        setNoteMetadata(result.noteMetadata);
      } else {
        setAbcNotation2(result.abcNotation);
        setNoteMetadata2(result.noteMetadata);
      }

      // Update note tracking map for this display
      updateNoteTrackingForDisplay(displayNumber, result.noteMetadata);

      // Increment exercises_generated counter
      if (user?.id) {
        try {
          if (user.isGuest) {
            incrementGuestExercisesGenerated();
          } else {
            await incrementExercisesGenerated(user.id);
          }
        } catch {
          // Don't fail exercise generation if counter update fails
        }
      }

      return result;
    } catch (error) {
      console.error(`Error generating exercise for display ${displayNumber}:`, error);
      return null;
    }
  }, [settings, user?.id, user?.isGuest, updateNoteTrackingForDisplay]);

  // Generate exercise in background for the next display (non-blocking)
  const generateNextExerciseInBackground = useCallback(async (nextDisplayNumber) => {
    try {
      // Prevent duplicate generation for the same display
      if (backgroundGenerationActiveRef.current.has(nextDisplayNumber)) {
        console.log(`⏭️ BACKGROUND GENERATION: Already generating for display ${nextDisplayNumber}, skipping`);
        return;
      }

      // Check if practice is still active before starting generation
      if (!continuousPracticeActiveRef.current) {
        console.log(`⏹️ BACKGROUND GENERATION: Practice stopped, skipping generation for display ${nextDisplayNumber}`);
        return;
      }

      console.log(`🔄 BACKGROUND GENERATION: Generating exercise for next display ${nextDisplayNumber}`);
      backgroundGenerationActiveRef.current.add(nextDisplayNumber);

      // Generate new exercise asynchronously without blocking current playback
      setTimeout(async () => {
        try {
          // Double-check practice is still active
          if (!continuousPracticeActiveRef.current) {
            console.log(`⏹️ BACKGROUND GENERATION: Practice stopped during generation, aborting for display ${nextDisplayNumber}`);
            backgroundGenerationActiveRef.current.delete(nextDisplayNumber);
            return;
          }

          await generateSingleExercise(nextDisplayNumber);
          console.log(`✅ BACKGROUND GENERATION: Exercise ready for display ${nextDisplayNumber}`);
        } catch (error) {
          console.error(`❌ BACKGROUND GENERATION: Failed for display ${nextDisplayNumber}:`, error);
        } finally {
          backgroundGenerationActiveRef.current.delete(nextDisplayNumber);
        }
      }, 0); // Run asynchronously in next tick
    } catch (error) {
      console.error(`Error initiating background generation for display ${nextDisplayNumber}:`, error);
      backgroundGenerationActiveRef.current.delete(nextDisplayNumber);
    }
  }, [generateSingleExercise]);

  // Handle when visual objects are ready from MusicDisplay
  const handleVisualsReady = useCallback(async (visualObj) => {
    visualObjectRef.current = visualObj;
    setIsVisualsReady(true);
  }, []);

  // Handle when visual objects are ready from second MusicDisplay
  const handleVisualsReady2 = useCallback(async (visualObj) => {
    visualObjectRef2.current = visualObj;
    setIsVisualsReady2(true);
  }, []);

  // abcjs TimingCallbacks-based cursor that syncs perfectly with music
  const startVisualCursor = useCallback((isPracticeMode = false, displayNumber = 1, visualObj = null, continuousCallback = null, isInitialStart = false) => {

    // Cursor padding constants
    const CURSOR_TOP_PADDING = 5;
    const CURSOR_BOTTOM_PADDING = 25;

    // Use provided visual object or default based on display number
    const targetVisualObj = visualObj || (displayNumber === 1 ? visualObjectRef.current : visualObjectRef2.current);

    if (!targetVisualObj) {
      return;
    }

    // Target the specific display's SVG container
    const displayContainer = document.querySelector(`[data-display="${displayNumber}"]`);
    if (!displayContainer) {
      console.error(`Could not find display container ${displayNumber}`);
      return;
    }

    const svgContainer = displayContainer.querySelector('.music-notation svg');
    if (!svgContainer) {
      console.error(`Could not find SVG in display ${displayNumber}`);
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
    cursorLine.setAttribute('stroke', '#f59e0b'); // Orange for practice
    cursorLine.setAttribute('stroke-width', '12');
    cursorLine.setAttribute('stroke-linecap', 'round');
    cursorLine.setAttribute('opacity', '0.3');
    cursorLine.style.pointerEvents = 'none';

    // Add cursor to SVG
    svgContainer.appendChild(cursorLine);

    // Create CursorControl for note highlighting in practice mode
    if (isPracticeMode) {
      cursorControlRef.current = createCursorControl(isPracticeMode);
      console.log('🎯 Created CursorControl for practice mode');
    }

    // Create TimingCallbacks for precise synchronization

    let timingCallbacks;
    try {
      timingCallbacks = new ABCJS.TimingCallbacks(targetVisualObj, {
        qpm: settings.tempo, // Quarter notes per minute - matches settings
        beatSubdivisions: 4, // Get callbacks on 16th note boundaries for smoothness
        extraMeasuresAtBeginning: (isPracticeMode && isInitialStart) ? 2 : 0, // Add 2 countdown measures only for initial practice start

        // Event callback - called for each musical event (note, rest, etc.)
        eventCallback: (event) => {

        if (!event) {
          // Music has ended - handle different practice modes
          console.log(`🏁 VISUAL CURSOR: Music ended for display ${displayNumber}, mode: practice, continuousPractice: ${continuousPracticeActiveRef.current}`);

          // Handle continuous practice flow
          if (continuousPracticeActiveRef.current && continuousCallback) {
            console.log(`🔄 CONTINUOUS FLOW: Display ${displayNumber} finished, switching to next (practice mode)`);

            // Clean up current cursor
            if (cursorLine && cursorLine.parentNode) {
              cursorLine.remove();
            }

            // Stop current TimingCallbacks
            if (timingCallbacks) {
              timingCallbacks.stop();
            }

            // Use the passed callback to trigger next display
            setTimeout(() => {
              continuousCallback(displayNumber);
            }, 50); // Tiny delay to ensure cleanup completes

            return; // Exit early for continuous flow
          }

          // Call onPracticeEnd if we were in practice mode with note tracking statistics
          if (isPracticingRef.current && onPracticeEnd) {
            // Calculate final scores from the appropriate tracking map for the current display
            let correctCount = 0;
            let wrongCount = 0;
            let unplayedCount = 0;
            const correctNotesList = [];
            const wrongNotesList = [];

            // Use the tracking map for the display that just finished
            const currentTrackingMap = displayNumber === 1 ? noteTrackingMap1 : noteTrackingMap2;
            currentTrackingMap.forEach((note) => {
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
              totalNotes: currentTrackingMap.size,
              correctNotes: correctNotesList,
              wrongNotes: wrongNotesList
            });
          }

          if (isPracticeMode) {
            // Clear candidate wrong notes when practice ends
            candidateWrongNotesRef.current.clear();

            setIsPracticing(false);
            setIsCountingDown(false);
            setCountdownBeats(0);

            // CRITICAL FIX: Stop metronome immediately to prevent internal timing fallback (following App.jsx pattern)
            if (isMetronomeActive && onMetronomeToggle) {
              onMetronomeToggle(); // This will update the parent state
            }
            // Also update the ref for immediate consistency
            isMetronomeActiveRef.current = false;
          }
          setBeatInfo(''); // Clear beat info when music ends
          currentNotesRef.current = new Set(); // Clear current notes when music ends

          // Clean up all note highlights when practice ends using robust cleanup
          resetAllNoteHighlighting();

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

        // For practice mode, hide cursor during countdown (only on initial start)
        if (isPracticeMode && isInitialStart && event.milliseconds !== undefined) {
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

        // 🎮 Calculate current active notes using ABCJS event timing
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

          // Only process notes after countdown period (if this is initial start)
          // Calculate dynamic countdown beats based on time signature
          const [beatsPerMeasure] = settings.timeSignature.split('/').map(Number);
          const countdownBeats = isInitialStart ? (beatsPerMeasure * 2) : 0; // 2 measures countdown only for initial start
          if (currentTimeInBeats >= countdownBeats) {
            // Adjust for countdown offset
            const adjustedCurrentTime = currentTimeInBeats - countdownBeats;

            // Detect cursor position change: only update expected notes when cursor moves to new beat
            const currentCursorBeat = Math.floor(adjustedCurrentTime);
            const cursorMoved = currentCursorBeat !== previousCursorBeatRef.current;

            if (cursorMoved) {
              previousCursorBeatRef.current = currentCursorBeat;

              const allActiveNoteIds = new Set();  // All note IDs currently sounding (including sustained)
              const newNotes = new Set();          // Only notes that START at current position
              const newNoteIds = new Set();        // Only note IDs that START at current position

              // Process notes from the current display only
              const currentNoteMetadata = displayNumber === 1 ? noteMetadata : noteMetadata2;
              currentNoteMetadata.forEach(noteData => {
                // Convert measure-relative timing to absolute timing in eighth-note units
                const beatsPerMeasure = 8; // 4/4 time with L=1/8 (eighth note units)
                const absoluteStartTime = noteData.startTime + (noteData.measureIndex * beatsPerMeasure);
                const absoluteEndTime = absoluteStartTime + noteData.duration;

                // Convert from eighth-note units to quarter-note beats for ABCJS timing comparison
                const absoluteStartBeat = absoluteStartTime / 2;
                const absoluteEndBeat = absoluteEndTime / 2;

                // Check if note is currently sounding (for sustained note detection)
                if (adjustedCurrentTime >= absoluteStartBeat && adjustedCurrentTime < absoluteEndBeat) {
                  allActiveNoteIds.add(noteData.id);
                }

                // Check if note STARTS at current cursor beat (for expected notes)
                if (Math.floor(absoluteStartBeat) === currentCursorBeat) {
                  newNotes.add(noteData.expectedNote);
                  newNoteIds.add(noteData.id);
                }
              });

              // currentNotesRef = expected notes to play (NEW notes only)
              currentNotesRef.current = newNotes;
              // currentNoteIdsRef = ALL currently sounding note IDs (for sustained note skip logic)
              currentNoteIdsRef.current = allActiveNoteIds;

              console.log(`🎼BEAT ${currentCursorBeat}: exp=[${Array.from(newNotes).join(',')}] all=[${Array.from(allActiveNoteIds).join(',')}]`);

              // CRITICAL: Trigger React effect to check for missed notes
              // Refs don't trigger re-renders, so we use state to force effect to run
              setCursorMoveTimestamp(Date.now());

              // CRITICAL: Save current cursor elements BEFORE clearing (for deferred highlighting)
              // This must happen here (before clear) because React effects run AFTER this callback
              previousCursorElementsRef.current = new Map(currentCursorElementsRef.current);

              // Capture DOM elements at current cursor position for highlighting
              currentCursorElementsRef.current.clear();

              // Try to map DOM elements to active note IDs using ABCJS event elements
              if (event.elements && Array.isArray(event.elements)) {
                event.elements.forEach((element, index) => {
                  if (Array.isArray(element) && element.length > 0) {
                    const domElement = element[0]; // This is the actual DOM element

                    // Map this DOM element to corresponding note IDs
                    // Since we can't directly correlate elements to note IDs, we'll use position-based mapping
                    const allActiveNoteIdsArray = Array.from(allActiveNoteIds);
                    if (allActiveNoteIdsArray[index]) {
                      currentCursorElementsRef.current.set(allActiveNoteIdsArray[index], domElement);
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

          // Handle countdown phase for practice mode (only on initial start)
          if (isPracticeMode && isInitialStart) {
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
          } else if (isPracticeMode && !isInitialStart) {
            // For continuous transitions, ensure countdown is disabled
            setIsCountingDown(false);
            setCountdownBeats(0);
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
            ((isInitialStart && beatNumber < countdownTotalBeats) || isMetronomeActiveRef.current) : // Countdown only on initial start, then only if metronome active
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

  }, [settings.tempo, settings.timeSignature, onPracticeEnd, noteMetadata, noteMetadata2, noteTrackingMap1, noteTrackingMap2, onMetronomeToggle, createCursorControl, resetAllNoteHighlighting, isMetronomeActive]);

  // Stop continuous practice
  const stopContinuousPractice = useCallback(() => {
    setContinuousPracticeActive(false);
    continuousPracticeActiveRef.current = false;
    setCurrentPlayingDisplay(null);
    currentPlayingDisplayRef.current = null;

    // Clean up visual cursors
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

    // Clear background generation tracking
    backgroundGenerationActiveRef.current.clear();

    // Stop metronome when continuous practice ends (following App.jsx pattern)
    if (isMetronomeActive && onMetronomeToggle) {
      onMetronomeToggle(); // This will update the parent state
    }
    // Also update the ref for immediate consistency
    isMetronomeActiveRef.current = false;
  }, [onMetronomeToggle, isMetronomeActive]);

  // Start continuous practice that alternates between displays
  const startContinuousPractice = useCallback(async () => {
    // Verify both visual objects are ready (no synth requirement for practice mode)
    if (!visualObjectRef.current || !visualObjectRef2.current) {
      console.error('Both visual objects must be ready for continuous practice flow');
      return;
    }

    setContinuousPracticeActive(true);
    continuousPracticeActiveRef.current = true;
    setCurrentPlayingDisplay(1);
    currentPlayingDisplayRef.current = 1;

    // Track whether this is the initial start of the practice session
    let isFirstCall = true;

    const practiceNextDisplay = async (displayNumber) => {
      // Check if continuous practice was stopped
      if (!continuousPracticeActiveRef.current) {
        return;
      }

      setCurrentPlayingDisplay(displayNumber);
      currentPlayingDisplayRef.current = displayNumber;

      // Get the appropriate visual object for the current display
      const visualObj = displayNumber === 1 ? visualObjectRef.current : visualObjectRef2.current;

      try {
        if (!visualObj) {
          console.error(`Display ${displayNumber} not ready for continuous practice flow`);
          stopContinuousPractice();
          return;
        }

        // For continuous practice mode, pass callback function to handle instant transitions
        const continuousTransitionCallback = (currentDisplay) => {
          console.log(`🔄 INSTANT TRANSITION: Switching from display ${currentDisplay} to next`);

          // Switch to next display immediately (no blocking generation)
          const nextDisplay = currentDisplay === 1 ? 2 : 1;

          // Start background generation for the display we're switching away from
          // This ensures it's ready for the next cycle
          generateNextExerciseInBackground(currentDisplay);

          // Switch to next display immediately
          practiceNextDisplay(nextDisplay);
        };

        // Pass isInitialStart = true only for the very first call of the practice session
        const isInitialStart = isFirstCall;
        if (isFirstCall) {
          isFirstCall = false; // Mark that we've made the first call
        }
        startVisualCursor(true, displayNumber, visualObj, continuousTransitionCallback, isInitialStart);

        // Start generating next exercise in background immediately when current exercise begins
        const nextDisplayForGeneration = displayNumber === 1 ? 2 : 1;
        generateNextExerciseInBackground(nextDisplayForGeneration);

      } catch (error) {
        console.error(`Error in continuous practice flow for display ${displayNumber}:`, error);
        stopContinuousPractice();
      }
    };

    // Start with first display
    practiceNextDisplay(1);
  }, [startVisualCursor, stopContinuousPractice, generateNextExerciseInBackground]);

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

      // CRITICAL FIX: Stop metronome when manually stopping practice (following App.jsx pattern)
      if (isMetronomeActive && onMetronomeToggle) {
        onMetronomeToggle(); // This will update the parent state
      }
      // Also update the ref for immediate consistency
      isMetronomeActiveRef.current = false;

      // Stop continuous practice if it's active
      if (continuousPracticeActiveRef.current) {
        setContinuousPracticeActive(false);
        continuousPracticeActiveRef.current = false;
        setCurrentPlayingDisplay(null);
        currentPlayingDisplayRef.current = null;
      }

      // Clean up all note highlights when manually stopping practice using robust cleanup
      resetAllNoteHighlighting();

      // Clear candidate wrong notes when practice stops
      candidateWrongNotesRef.current.clear();

      setIsPracticing(false);
      setIsCountingDown(false);
      setCountdownBeats(0);
      return;
    }

    // Verify both visual objects are ready for continuous flow
    if (!visualObjectRef.current || !visualObjectRef2.current) {
      console.error('Both visual objects must be ready for continuous practice flow');
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

      // Start continuous practice flow
      startContinuousPractice();

    } catch {
      // Clear candidate wrong notes on error
      candidateWrongNotesRef.current.clear();

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

      // Stop metronome on error (following App.jsx pattern)
      if (isMetronomeActive && onMetronomeToggle) {
        onMetronomeToggle(); // This will update the parent state
      }
      // Also update the ref for immediate consistency
      isMetronomeActiveRef.current = false;

      // Clean up all note highlights on error using robust cleanup
      resetAllNoteHighlighting();
    }
  }, [isPracticing, startContinuousPractice, isMetronomeActive, onMetronomeToggle, resetAllNoteHighlighting]);

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
  React.useEffect(() => {
    isPracticingRef.current = isPracticing;
  }, [isPracticing]);

  // Keep metronome ref synchronized with state
  React.useEffect(() => {
    isMetronomeActiveRef.current = isMetronomeActive;
  }, [isMetronomeActive]);

  // Keep continuous practice refs synchronized with state
  React.useEffect(() => {
    currentPlayingDisplayRef.current = currentPlayingDisplay;
  }, [currentPlayingDisplay]);

  React.useEffect(() => {
    continuousPracticeActiveRef.current = continuousPracticeActive;
  }, [continuousPracticeActive]);

  // Enhanced scoring logic using note tracking system to prevent duplicate counting
  const previousPressedNotesRef = useRef(new Set());

  // Cursor position-based scoring lock to prevent multiple counting at same position
  const previousActiveNoteIdsRef = useRef(new Set());
  const scoringLockedRef = useRef(false);

  // Deferred wrong note detection - tracks wrong keys pressed at current position
  const candidateWrongNotesRef = useRef(new Set());

  // Store previous cursor position's DOM elements for deferred highlighting
  const previousCursorElementsRef = useRef(new Map());

  // Track previous cursor beat position to detect new notes vs sustained notes
  const previousCursorBeatRef = useRef(-1);

  // State to trigger React effect when cursor moves (refs don't trigger re-renders)
  const [cursorMoveTimestamp, setCursorMoveTimestamp] = useState(0);

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

    // Get the appropriate tracking map based on current playing display
    const currentTrackingMap = currentPlayingDisplayRef.current === 1 ? noteTrackingMap1 : noteTrackingMap2;
    const setCurrentTrackingMap = currentPlayingDisplayRef.current === 1 ? setNoteTrackingMap1 : setNoteTrackingMap2;

    // FIRST: Check if cursor moved to new notes (runs ALWAYS, even with zero key presses)
    if (noteIdsChanged) {
      console.log(`🎯POS: ids=[${Array.from(currentActiveNoteIds).join(',')}]`);
      console.log(`📋CHECK: prev=${previousActiveNoteIdsRef.current.size} notes`);

      // DEFERRED DETECTION: Check for missed notes from PREVIOUS position
      let missedCount = 0;
      previousActiveNoteIdsRef.current.forEach(noteId => {
        // Skip notes still active in current position (sustained notes like whole notes)
        if (currentActiveNoteIds.has(noteId)) {
          console.log(`  ${noteId}: SKIP (still active)`);
          return; // Don't check yet - note is still sustaining
        }

        const note = currentTrackingMap.get(noteId);
        console.log(`  ${noteId}: ${note ? note.status : 'NOT_FOUND'}`);

        if (note && note.status === 'unplayed') {
          missedCount++;
          // Mark as incorrect/missed
          setCurrentTrackingMap(prevMap => {
            const newMap = new Map(prevMap);
            newMap.set(noteId, { ...note, status: 'incorrect' });
            return newMap;
          });

          // Highlight red - try both current and previous cursor element refs
          const domElement = currentCursorElementsRef.current.get(noteId);
          const prevElement = previousCursorElementsRef.current.get(noteId);

          if (domElement && domElement.classList) {
            domElement.classList.add('abcjs-note-incorrect');
            console.log(`  ❌MISS ${note.expectedNote}: curr=YES prev=${!!prevElement}`);
          } else if (prevElement && prevElement.classList) {
            prevElement.classList.add('abcjs-note-incorrect');
            console.log(`  ❌MISS ${note.expectedNote}: curr=NO prev=YES`);
          } else {
            console.log(`  ❌MISS ${note.expectedNote}: curr=NO prev=NO`);
          }

          // Increment wrong counter for missed note
          onWrongNote(note.expectedNote);
        }
      });

      console.log(`📊MISSED: ${missedCount} notes`);

      // Score all candidate wrong notes that were pressed
      candidateWrongNotesRef.current.forEach(wrongKey => {
        onWrongNote(wrongKey);
        console.log(`❌WRONG: ${wrongKey} (finalized)`);
      });

      // Clear candidate wrongs for new position
      candidateWrongNotesRef.current.clear();

      scoringLockedRef.current = false;
      previousActiveNoteIdsRef.current = new Set(currentActiveNoteIds);
      previousPressedNotesRef.current = new Set(); // Reset: all held notes now "new" for this position

      // Notify parent component about cursor position change for MIDI note lifecycle tracking
      if (onUpdateCursorPosition) {
        onUpdateCursorPosition(Array.from(currentActiveNoteIds));
      }
    }

    // SECOND: Continue with key press scoring logic (only if keys were pressed)

    // Skip scoring if locked (already scored at this cursor position)
    if (scoringLockedRef.current) {
      // Allow processing if we're trying to correct an incorrect note
      const hasIncorrectNotes = Array.from(currentActiveNoteIds).some(noteId => {
        const trackedNote = currentTrackingMap.get(noteId);
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

    console.log(`🎼NEW: [${Array.from(newlyPressedNotes).join(',')}] exp=[${Array.from(expectedNotes).join(',')}]`);

    // Track processed notes and note IDs in this scoring cycle to prevent duplicates and overwrites
    const processedNotesInThisCycle = new Set();
    const scoredNoteIdsInThisCycle = new Set(); // Track note IDs that have been scored correctly

    // Check each newly pressed note
    newlyPressedNotes.forEach(pressedNote => {
      // Skip if we already processed this note in this cycle
      if (processedNotesInThisCycle.has(pressedNote)) {
        return;
      }

      // LEGATO FIX: Check MIDI note lifecycle to determine if this should be scored
      const noteState = midiNoteStates.get(pressedNote);
      if (noteState) {
        // If note is held from previous position and wasn't released/re-pressed, skip scoring
        if (noteState.heldFromPreviousPosition && !noteState.wasReleasedAndRepressed) {
          console.log(`⏭️SKIP: ${pressedNote} held=true repress=false`);
          processedNotesInThisCycle.add(pressedNote); // Mark as processed to prevent re-evaluation
          return;
        }
      }

      let noteProcessed = false;

      // Find the first unplayed or incorrect note that matches (priority-based matching)
      // This prevents one key press from matching multiple note IDs
      for (const noteId of currentActiveNoteIds) {
        const trackedNote = currentTrackingMap.get(noteId);

        if (trackedNote && (trackedNote.status === 'unplayed' || trackedNote.status === 'incorrect')) {
          // Check if the pressed note matches this tracked note
          if (trackedNote.expectedNote === pressedNote ||
              (trackedNote.midiPitch && midiPitchToNoteName(trackedNote.midiPitch) === pressedNote)) {

            // Determine the new status and highlight type based on previous state
            const isCorrection = trackedNote.status === 'incorrect';
            const newStatus = isCorrection ? 'corrected' : 'correct';
            const highlightType = isCorrection ? 'corrected' : 'correct';

            console.log(`✅${isCorrection ? 'FIX' : 'OK'}: ${pressedNote} id=${noteId}`);

            // Mark note with appropriate status and update tracking
            setCurrentTrackingMap(prevMap => {
              const newMap = new Map(prevMap);
              newMap.set(noteId, { ...trackedNote, status: newStatus });
              return newMap;
            });

            // Highlight the note with appropriate color (green for correct, dark yellow for corrected)
            highlightNoteById(noteId, highlightType);

            onCorrectNote(pressedNote);
            noteProcessed = true;
            processedNotesInThisCycle.add(pressedNote); // Mark as processed
            scoredNoteIdsInThisCycle.add(noteId); // Track this note ID as correctly scored
            // Don't lock scoring - allow multiple correct notes in chords to be scored
            break; // Only match the first unplayed/incorrect note - prevents duplicates
          }
        }
      }

      // If note wasn't processed as correct, defer wrong note detection
      // Note: Held notes were already filtered out at lines 1145-1150
      if (!noteProcessed && !expectedNotes.has(pressedNote)) {
        // DEFERRED DETECTION: Track wrong key, don't score yet
        candidateWrongNotesRef.current.add(pressedNote);
        console.log(`⏸️DEFER-WRONG: ${pressedNote}`);
        processedNotesInThisCycle.add(pressedNote); // Mark as processed
      }
    });

    // Update previous pressed notes for next comparison
    previousPressedNotesRef.current = new Set(pressedMidiNotes);
  }, [pressedMidiNotes, cursorMoveTimestamp, midiNoteStates, isPracticing, onCorrectNote, onWrongNote, noteTrackingMap1, noteTrackingMap2, midiPitchToNoteName, correctNotesCount, wrongNotesCount, highlightNoteById, onUpdateCursorPosition]);

  // Reset note tracking when practice mode starts
  React.useEffect(() => {
    if (isPracticing && onResetScoring) {
      // Reset both note tracking maps to 'unplayed' status
      setNoteTrackingMap1(prevMap => {
        const newMap = new Map();
        prevMap.forEach((note, id) => {
          newMap.set(id, { ...note, status: 'unplayed' });
        });
        return newMap;
      });

      setNoteTrackingMap2(prevMap => {
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
              <FaMusic className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="text-left">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Flow Mode</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sight Reading Training</p>
              </div>
            </button>

            {/* Controls */}
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

              {/* Tempo Control */}
              <button
                onClick={onTempoClick}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                title="Adjust Tempo"
              >
                <FaClock className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {settings.tempo}
                </span>
              </button>

              {/* Metronome */}
              <MetronomeButton
                isActive={isMetronomeActive}
                onToggle={onMetronomeToggle}
                onTrigger={handleMetronomeTrigger}
                tempo={settings.tempo}
                timeSignature={settings.timeSignature}
              />

              {/* Dark Mode Toggle */}
              <DarkModeToggle />

              {/* Settings Menu */}
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
        <div className="space-y-8">

          {/* Practice Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">

            {/* Generate New Button */}
            <button
              onClick={handleGenerateNew}
              disabled={isGenerating || isPracticing || continuousPracticeActive}
              className="btn btn-lg px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg border-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <FaRedo className="mr-2" />
              {isGenerating ? 'Generating...' : 'Generate New'}
            </button>

            {/* Practice Button */}
            <button
              onClick={handlePracticeClick}
              disabled={!isVisualsReady || !isVisualsReady2 || isGenerating}
              className="btn btn-lg px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg border-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <FaKeyboard className={`mr-2 ${isPracticing || continuousPracticeActive ? 'hidden' : ''}`} />
              <FaStop className={`mr-2 ${!isPracticing && !continuousPracticeActive ? 'hidden' : ''}`} />
              {isPracticing || continuousPracticeActive ? 'Stop Practice Flow' : 'Practice Flow'}
            </button>
          </div>


          {/* Music Displays */}
          <div className="space-y-6">
            {/* First Exercise */}
            {abcNotation && (
              <div className="music-display-container" data-display="1">
                <div className="text-center mb-2">
                  <h3 className={`text-lg font-semibold flex items-center justify-center space-x-2 ${
                    currentPlayingDisplay === 1
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    <span>Exercise 1</span>
                    {currentPlayingDisplay === 1 && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full dark:bg-orange-900 dark:text-orange-300 animate-pulse">
                        Playing
                      </span>
                    )}
                  </h3>
                </div>
                <MusicDisplay
                  abcNotation={abcNotation}
                  onVisualsReady={handleVisualsReady}
                  showPostPracticeResults={showPostPracticeResults}
                />
              </div>
            )}

            {/* Second Exercise */}
            {abcNotation2 && (
              <div className="music-display-container" data-display="2">
                <div className="text-center mb-2">
                  <h3 className={`text-lg font-semibold flex items-center justify-center space-x-2 ${
                    currentPlayingDisplay === 2
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    <span>Exercise 2</span>
                    {currentPlayingDisplay === 2 && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full dark:bg-orange-900 dark:text-orange-300 animate-pulse">
                        Playing
                      </span>
                    )}
                  </h3>
                </div>
                <MusicDisplay
                  abcNotation={abcNotation2}
                  onVisualsReady={handleVisualsReady2}
                  showPostPracticeResults={showPostPracticeResults}
                />
              </div>
            )}
          </div>

          {/* Practice Statistics */}
          {isPracticing && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Practice Session</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {correctNotesCount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {wrongNotesCount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Wrong</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round((correctNotesCount / Math.max(correctNotesCount + wrongNotesCount, 1)) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                    {currentPlayingDisplay ? `Ex ${currentPlayingDisplay}` : 'Ready'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Current</div>
                </div>
              </div>
              {beatInfo && (
                <div className="mt-4 text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {beatInfo}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FlowView;
