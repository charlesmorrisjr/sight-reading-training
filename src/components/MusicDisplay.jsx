import React, { useEffect, useRef, useState } from 'react';
import * as ABCJS from 'abcjs';
import './MusicDisplay.css';

const MusicDisplay = ({ abcNotation, settings }) => {
  const containerRef = useRef(null);
  const renderRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

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
      ABCJS.renderAbc(renderRef.current, abcNotation, renderOptions);

    } catch (error) {
      console.error('Error rendering ABC notation:', error);
      renderRef.current.innerHTML = '<p class="error-message">Error rendering music notation</p>';
    }
  }, [abcNotation, settings, windowWidth]);

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