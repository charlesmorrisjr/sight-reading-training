import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as ABCJS from 'abcjs';
import { FaMusic, FaPlay, FaStop, FaKeyboard, FaRedo, FaClock } from 'react-icons/fa';
import HamburgerMenu from './HamburgerMenu';
import MusicDisplay from './MusicDisplay';
import DarkModeToggle from './DarkModeToggle';
import TempoSelector from './TempoSelector';
import MetronomeButton from './MetronomeButton';
import { incrementExercisesGenerated, updateLastPracticed } from '../services/database';
import { generateRandomABC } from '../utils/musicGenerator';
import { incrementGuestExercisesGenerated } from '../services/settingsService';

const FlowView = ({ settings, onSettingsChange, onTempoClick, pressedMidiNotes = new Set(), correctNotesCount = 0, wrongNotesCount = 0, onCorrectNote, onWrongNote, onResetScoring, onPracticeEnd, isMetronomeActive, onMetronomeToggle, showPostPracticeResults = false, onResetPostPracticeResults, user }) => {
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
              <FaMusic className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="text-left">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Flow Mode</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sight Reading Training</p>
              </div>
            </button>

            {/* Controls */}
            <div className="flex items-center space-x-4">
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
              disabled={isGenerating || isPlaying || isPracticing}
              className="btn btn-lg px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg border-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <FaRedo className="mr-2" />
              {isGenerating ? 'Generating...' : 'Generate New'}
            </button>

            {/* Play Button */}
            <button
              onClick={handlePlayClick}
              disabled={!isVisualsReady || isGenerating || isPracticing || isInitializing}
              className="btn btn-lg px-8 py-4 bg-green-600 hover:bg-green-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg border-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <FaPlay className={`mr-2 ${isPlaying ? 'hidden' : ''}`} />
              <FaStop className={`mr-2 ${!isPlaying ? 'hidden' : ''}`} />
              {isInitializing ? 'Loading...' : (isPlaying ? 'Stop' : 'Play')}
            </button>

            {/* Practice Button */}
            <button
              onClick={handlePracticeClick}
              disabled={!isVisualsReady || isGenerating || isPlaying}
              className="btn btn-lg px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white transition-all duration-300 transform hover:scale-105 shadow-lg border-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <FaKeyboard className={`mr-2 ${isPracticing ? 'hidden' : ''}`} />
              <FaStop className={`mr-2 ${!isPracticing ? 'hidden' : ''}`} />
              {isPracticing ? 'Stop Practice' : 'Practice'}
            </button>
          </div>

          {/* Countdown Display */}
          {isCountingDown && countdownBeats > 0 && (
            <div className="text-center">
              <div className="text-6xl font-bold text-orange-500 animate-pulse">
                {countdownBeats}
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                Get ready...
              </p>
            </div>
          )}

          {/* Music Display */}
          {abcNotation && (
            <div className="music-display-container">
              <MusicDisplay
                abcNotation={abcNotation}
                onVisualsReady={handleVisualsReady}
                showPostPracticeResults={showPostPracticeResults}
              />
            </div>
          )}

          {/* Practice Status */}
          {isPracticing && (
            <div className="text-center space-y-2">
              <div className="flex justify-center space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {correctNotesCount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Correct
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {wrongNotesCount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Wrong
                  </div>
                </div>
              </div>

              {/* Debug info */}
              {beatInfo && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {beatInfo}
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