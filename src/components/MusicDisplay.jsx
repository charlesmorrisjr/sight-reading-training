import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as ABCJS from 'abcjs';
import './MusicDisplay.css';

const MusicDisplay = ({ abcNotation, settings, onVisualsReady, cursorControl, pressedMidiNotes = new Set() }) => {
  const containerRef = useRef(null);
  const renderRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Helper function to convert MIDI note to pitch position class
  const midiNoteToPitchClass = (midiNote) => {
    // Parse MIDI note (e.g., "C4", "D#5")
    const noteMatch = midiNote.match(/^([A-G])([#b]?)(\d+)$/);
    if (!noteMatch) return null;
    
    const [, noteLetter, accidental, octaveStr] = noteMatch;
    const octave = parseInt(octaveStr);
    
    // Convert to chromatic pitch number (C4 = 0, C#4 = 1, etc.)
    const noteValues = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
    let pitch = noteValues[noteLetter];
    
    // Apply accidentals
    if (accidental === '#') pitch += 1;
    if (accidental === 'b') pitch -= 1;
    
    // Add octave offset (C4 = 0, so octave 4 = 0 * 12)
    pitch += (octave - 4) * 12;
    
    return `abcjs-p${pitch}`;
  };

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
  }, [pressedMidiNotes]);

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

      // Reset cursor control when new music is rendered
      if (cursorControl) {
        cursorControl.reset();
      }

      // Re-apply highlights to new notation
      setTimeout(() => {
        highlightMidiNotes();
      }, 100);

    } catch (error) {
      console.error('Error rendering ABC notation:', error);
      renderRef.current.innerHTML = '<p class="error-message">Error rendering music notation</p>';
    }
  }, [abcNotation, settings, windowWidth, onVisualsReady, cursorControl, highlightMidiNotes]);

  // Update highlights when MIDI notes change
  useEffect(() => {
    // Small delay to ensure DOM is updated after rendering
    const timer = setTimeout(() => {
      highlightMidiNotes();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [pressedMidiNotes, highlightMidiNotes]);

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