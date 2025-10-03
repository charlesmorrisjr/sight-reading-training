import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as ABCJS from 'abcjs';
import './MusicDisplay.css';

const MusicDisplay = ({ 
  abcNotation, 
  settings, 
  onVisualsReady, 
  cursorControl, 
  pressedMidiNotes = new Set(),
  enableRealtimeHighlighting = true,
  noteTrackingMap = new Map(),
  showPostPracticeResults = false,
  svgId
}) => {
  const containerRef = useRef(null);
  const renderRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Helper function to convert MIDI note to pitch position class using scale degrees
  const midiNoteToPitchClass = useCallback((midiNote) => {
    // Parse MIDI note (e.g., "C4", "D#5")
    const noteMatch = midiNote.match(/^([A-G])([#b]?)(\d+)$/);
    if (!noteMatch) return null;
    
    const [, noteLetter, accidental, octaveStr] = noteMatch;
    const octave = parseInt(octaveStr);
    
    // Get current key from settings (default to C if not provided)
    const currentKey = settings?.key || 'C';
    
    // Major key scale degree mappings - maps note names to scale degrees (0-6)
    const keyScaleDegrees = {
      'C': { 'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6 },
      'G': { 'G': 0, 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6 },
      'D': { 'D': 0, 'E': 1, 'F': 2, 'G': 3, 'A': 4, 'B': 5, 'C': 6 },
      'A': { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6 },
      'E': { 'E': 0, 'F': 1, 'G': 2, 'A': 3, 'B': 4, 'C': 5, 'D': 6 },
      'B': { 'B': 0, 'C': 1, 'D': 2, 'E': 3, 'F': 4, 'G': 5, 'A': 6 },
      'F': { 'F': 0, 'G': 1, 'A': 2, 'B': 3, 'C': 4, 'D': 5, 'E': 6 }
    };
    
    // Key signature accidentals - which notes are sharp/flat in each key
    const keyAccidentals = {
      'C': {},
      'G': { 'F': '#' },
      'D': { 'F': '#', 'C': '#' },
      'A': { 'F': '#', 'C': '#', 'G': '#' },
      'E': { 'F': '#', 'C': '#', 'G': '#', 'D': '#' },
      'B': { 'F': '#', 'C': '#', 'G': '#', 'D': '#', 'A': '#' },
      'F': { 'B': 'b' }
    };
    
    // Get scale degree for the note letter in the current key
    const scaleMapping = keyScaleDegrees[currentKey];
    if (!scaleMapping) {
      console.warn(`Unknown key: ${currentKey}, falling back to C major`);
      return `abcjs-p${(octave - 4) * 7}`;
    }
    
    let scaleDegree = scaleMapping[noteLetter];
    if (scaleDegree === undefined) {
      console.warn(`Note ${noteLetter} not found in key ${currentKey}`);
      return null;
    }
    
    // Handle accidentals - check if the played note matches the key signature
    const keyAccidental = keyAccidentals[currentKey][noteLetter] || '';
    
    // If the MIDI note has an accidental that doesn't match the key signature,
    // it's a chromatic alteration. For now, we'll try to find the closest match.
    if (accidental !== keyAccidental) {
      // This is a chromatic note outside the key signature
      // For simplicity, we'll still use the scale degree but log it
      console.log(`Chromatic note: ${midiNote} in key ${currentKey}`);
    }
    
    // Calculate final pitch class: scale degree + octave offset
    // Use base-7 system (7 scale degrees per octave) instead of base-12 chromatic
    const pitch = scaleDegree + (octave - 4) * 7;
    
    return `abcjs-p${pitch}`;
  }, [settings]);

  // Function to highlight notes using CSS classes
  const highlightMidiNotes = useCallback(() => {
    if (!renderRef.current) return;
    
    const svgContainer = renderRef.current.querySelector('svg');
    if (!svgContainer) return;
    
    // Remove existing highlight classes
    const previousHighlights = svgContainer.querySelectorAll('.midi-highlighted');
    previousHighlights.forEach(element => {
      element.classList.remove('midi-highlighted');
      element.style.fill = '';
      element.style.stroke = '';
    });
    
    if (pressedMidiNotes.size === 0) return;
    
    console.log('Highlighting MIDI notes:', Array.from(pressedMidiNotes));
    
    // Find and highlight matching notes using CSS classes
    Array.from(pressedMidiNotes).forEach(midiNote => {
      const pitchClass = midiNoteToPitchClass(midiNote);
      if (!pitchClass) return;
      
      console.log(`Looking for notes with class: ${pitchClass}`);
      
      // Find all note elements with matching pitch class
      const matchingNotes = svgContainer.querySelectorAll(`.abcjs-note.${pitchClass}`);
      console.log(`Found ${matchingNotes.length} matching notes for ${midiNote}`);
      
      matchingNotes.forEach(noteElement => {
        noteElement.classList.add('midi-highlighted');
        noteElement.style.fill = 'rgba(255, 0, 0, 0.7)';
        noteElement.style.stroke = 'red';
        noteElement.style.strokeWidth = '2';
      });
    });
  }, [pressedMidiNotes, midiNoteToPitchClass]);

  // Function to highlight notes based on practice results (correct=green, incorrect=red)
  const highlightNoteResults = useCallback(() => {
    if (!renderRef.current) return;
    
    const svgContainer = renderRef.current.querySelector('svg');
    if (!svgContainer) return;
    
    // Remove existing highlight classes
    const previousHighlights = svgContainer.querySelectorAll('.midi-highlighted, .result-highlighted');
    previousHighlights.forEach(element => {
      element.classList.remove('midi-highlighted', 'result-highlighted');
      element.style.fill = '';
      element.style.stroke = '';
      element.style.strokeWidth = '';
    });
    
    if (noteTrackingMap.size === 0) return;
    
    console.log('Highlighting practice results:', noteTrackingMap.size, 'notes');
    
    // Highlight notes based on their status
    noteTrackingMap.forEach((noteData, noteId) => {
      if (noteData.status === 'unplayed') return; // Don't highlight unplayed notes
      
      // Find the note element by its unique identifier
      // Note elements should have data attributes or classes that match noteId
      const noteElement = svgContainer.querySelector(`[data-note-id="${noteId}"]`) || 
                         svgContainer.querySelector(`.note-${noteId}`);
      
      if (noteElement) {
        noteElement.classList.add('result-highlighted');
        
        if (noteData.status === 'correct') {
          noteElement.style.fill = 'rgba(34, 197, 94, 0.7)'; // Green
          noteElement.style.stroke = 'rgb(34, 197, 94)';
        } else if (noteData.status === 'incorrect') {
          noteElement.style.fill = 'rgba(239, 68, 68, 0.7)'; // Red
          noteElement.style.stroke = 'rgb(239, 68, 68)';
        }
        noteElement.style.strokeWidth = '2';
      } else {
        console.warn(`Could not find note element for ID: ${noteId}`);
      }
    });
  }, [noteTrackingMap]);

  useEffect(() => {
    if (!abcNotation || !renderRef.current) return;

    try {
      // Calculate responsive staff width
      const containerWidth = containerRef.current?.clientWidth || 900;
      const staffWidth = Math.min(containerWidth - 80, 1200); // Max width with padding

      // Determine measures per line based on screen size and time signature
      let preferredMeasuresPerLine = 4;
      if (containerWidth < 768) {
        preferredMeasuresPerLine = 2; // Mobile
      } else if (containerWidth < 1024) {
        preferredMeasuresPerLine = 3; // Tablet
      }

      // Adjust for time signature - longer signatures need fewer measures per line
      const timeSignature = settings?.timeSignature || '4/4';
      if (timeSignature === '6/8' || timeSignature === '12/8') {
        preferredMeasuresPerLine = Math.max(preferredMeasuresPerLine - 1, 2);
      }

      // Determine if we should use responsive behavior
      // Only use responsive on smaller screens (< 800px) to allow scale control on larger screens
      const useResponsive = containerWidth < 800;
      
      const renderOptions = {
        wrap: {
          minSpacing: 1.8,
          maxSpacing: 2.8,
          preferredMeasuresPerLine: preferredMeasuresPerLine
        },
        staffwidth: staffWidth,
        // Only use responsive on smaller screens
        ...(useResponsive && { responsive: 'resize' }),
        scale: settings?.musicScale || 1.0,
        add_classes: true, // Enable CSS classes for note identification
        paddingleft: 20,
        paddingright: 20,
        paddingtop: 20,
        paddingbottom: 20,
        format: {
          titlefont: 'serif 16',
          gchordfont: 'serif 12',
          annotationfont: 'serif 12',
          voicefont: 'serif 13',
          wordsfont: 'serif 13'
        }
      };

      // Clear previous render
      renderRef.current.innerHTML = '';

      // Render the ABC notation
      const visualObjs = ABCJS.renderAbc(renderRef.current, abcNotation, renderOptions);
      
      // Pass the visual objects to parent for synth functionality
      if (onVisualsReady && visualObjs && visualObjs.length > 0) {
        onVisualsReady(visualObjs[0]);
      }

      // ADD THESE LINES (after line 228):
      // Apply unique ID to the SVG for targeted DOM queries
      if (svgId) {
        const svg = renderRef.current.querySelector('svg');
        if (svg) {
          svg.id = svgId;
        }
      }

      // Reset cursor control when new music is rendered
      if (cursorControl) {
        cursorControl.reset();
      }

    } catch (error) {
      console.error('Error rendering ABC notation:', error);
      renderRef.current.innerHTML = '<p class="error-message">Error rendering music notation</p>';
    }
  }, [abcNotation, settings, windowWidth, onVisualsReady, cursorControl]);

  // Update highlights when MIDI notes change (only if real-time highlighting is enabled)
  useEffect(() => {
    if (!enableRealtimeHighlighting) return;
    
    // Small delay to ensure DOM is updated after rendering
    const timer = setTimeout(() => {
      highlightMidiNotes();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [pressedMidiNotes, highlightMidiNotes, enableRealtimeHighlighting]);

  // Update highlights when showing post-practice results
  useEffect(() => {
    if (!showPostPracticeResults) return;
    
    // Small delay to ensure DOM is updated after rendering
    const timer = setTimeout(() => {
      highlightNoteResults();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [showPostPracticeResults, highlightNoteResults]);

  // Handle window resize to update responsive behavior
  useEffect(() => {
    const handleResize = () => {
      // Debounce resize events
      clearTimeout(window.resizeTimer);
      window.resizeTimer = setTimeout(() => {
        setWindowWidth(window.innerWidth);
      }, 250);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(window.resizeTimer);
    };
  }, []);

  if (!abcNotation) {
    return (
      <div className="music-display" ref={containerRef}>
        <div className="music-placeholder">
          <div className="placeholder-icon">♪</div>
          <p>Click "Generate New Exercise" to create your sight reading practice</p>
        </div>
      </div>
    );
  }

  return (
    <div className="music-display" ref={containerRef}>
      <div 
        ref={renderRef} 
        className="music-notation"
        role="img"
        aria-label="Musical notation for sight reading practice"
      />
    </div>
  );
};

export default MusicDisplay;