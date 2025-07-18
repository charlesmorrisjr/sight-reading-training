import React, { useState, useEffect, useRef } from 'react';
import { 
  AVAILABLE_KEYS, 
  AVAILABLE_TIME_SIGNATURES, 
  AVAILABLE_NOTE_DURATIONS, 
  AVAILABLE_INTERVALS,
  CHORD_PROGRESSIONS,
  AVAILABLE_LEFT_HAND_PATTERNS,
  AVAILABLE_RIGHT_HAND_PATTERNS
} from '../utils/musicGenerator';
import './HamburgerMenu.css';

const HamburgerMenu = ({ 
  settings, 
  onSettingsChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMenu, setCurrentMenu] = useState('main');
  const [menuHistory, setMenuHistory] = useState(['main']);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setCurrentMenu('main');
    setMenuHistory(['main']);
  };

  const navigateToMenu = (menuName) => {
    setCurrentMenu(menuName);
    setMenuHistory([...menuHistory, menuName]);
  };

  const goBack = () => {
    if (menuHistory.length > 1) {
      const newHistory = menuHistory.slice(0, -1);
      setMenuHistory(newHistory);
      setCurrentMenu(newHistory[newHistory.length - 1]);
    }
  };

  const handleSettingChange = (field, value) => {
    let newSettings = { ...settings, [field]: value };
    
    // If changing time signature, validate bass pattern compatibility
    if (field === 'timeSignature') {
      const currentLeftHandPattern = settings.leftHandPatterns?.[0];
      const pattern = AVAILABLE_LEFT_HAND_PATTERNS.find(p => p.id === currentLeftHandPattern);
      
      if (pattern && !pattern.supportedTimeSignatures.includes(value)) {
        // Auto-switch to block chords if current pattern unsupported
        newSettings.leftHandPatterns = ['block-chords'];
      }
    }
    
    onSettingsChange(newSettings);
  };

  const handleIntervalToggle = (interval) => {
    const currentIntervals = settings.intervals || [1, 2, 3, 4, 5];
    const newIntervals = currentIntervals.includes(interval)
      ? currentIntervals.filter(i => i !== interval)
      : [...currentIntervals, interval].sort((a, b) => a - b);
    
    if (newIntervals.length > 0) {
      handleSettingChange('intervals', newIntervals);
    }
  };

  const handleNoteDurationToggle = (duration) => {
    const currentDurations = settings.noteDurations || ['1/8', '1/4'];
    const newDurations = currentDurations.includes(duration)
      ? currentDurations.filter(d => d !== duration)
      : [...currentDurations, duration];
    
    if (newDurations.length > 0) {
      handleSettingChange('noteDurations', newDurations);
    }
  };

  const handleChordProgressionToggle = (progressionId) => {
    const currentProgressions = settings.chordProgressions || ['pop', '50s', 'pop-variation', 'basic-cadence', 'jazz', 'alternating', 'minor-start', 'variation'];
    const newProgressions = currentProgressions.includes(progressionId)
      ? currentProgressions.filter(p => p !== progressionId)
      : [...currentProgressions, progressionId];
    
    if (newProgressions.length > 0) {
      handleSettingChange('chordProgressions', newProgressions);
    }
  };

  const handleLeftHandPatternToggle = (patternId) => {
    // Always set as the single selected pattern (radio button behavior)
    handleSettingChange('leftHandPatterns', [patternId]);
  };

  const handleRightHandPatternToggle = (patternId) => {
    // Always set as the single selected pattern (radio button behavior)
    handleSettingChange('rightHandPatterns', [patternId]);
  };

  const handleRightHandIntervalToggle = (intervalId) => {
    // Always set as the single selected interval (radio button behavior)
    // Also set rightHandPatterns to 'intervals' to enable interval generation
    const newSettings = { 
      ...settings, 
      rightHandIntervals: [intervalId],
      rightHandPatterns: ['intervals']
    };
    onSettingsChange(newSettings);
  };

  const handleRightHand4NoteChordToggle = (chordId) => {
    // Always set as the single selected chord type (radio button behavior)
    // Also set rightHandPatterns to '4-note-chords' to enable 4-note chord generation
    const newSettings = { 
      ...settings, 
      rightHand4NoteChords: [chordId],
      rightHandPatterns: ['4-note-chords']
    };
    onSettingsChange(newSettings);
  };

  const handleLeftHandBrokenChordToggle = (patternId) => {
    // Always set as the single selected pattern (radio button behavior)
    // Also set leftHandPatterns to 'broken-chords' to enable broken chord generation
    const newSettings = { 
      ...settings, 
      leftHandBrokenChords: [patternId],
      leftHandPatterns: ['broken-chords']
    };
    onSettingsChange(newSettings);
  };

  const handleScaleChange = (delta) => {
    const currentScale = settings.musicScale || 1.0;
    const newScale = Math.max(1.0, Math.min(2.0, currentScale + delta));
    handleSettingChange('musicScale', newScale);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && 
          !menuRef.current.contains(event.target) &&
          !buttonRef.current.contains(event.target)) {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const renderMenuContent = () => {
    const majorKeys = AVAILABLE_KEYS.filter(key => !key.includes('m'));
    const minorKeys = AVAILABLE_KEYS.filter(key => key.includes('m'));

    switch (currentMenu) {
      case 'main':
        return (
          <div className="menu-nav">
            <button 
              className="menu-nav-item"
              onClick={() => navigateToMenu('key')}
            >
              Key
              <span className="menu-nav-arrow">→</span>
            </button>
            <button 
              className="menu-nav-item"
              onClick={() => navigateToMenu('timeSignature')}
            >
              Time Signature
              <span className="menu-nav-arrow">→</span>
            </button>
            <button 
              className="menu-nav-item"
              onClick={() => navigateToMenu('measures')}
            >
              Measures
              <span className="menu-nav-arrow">→</span>
            </button>
            <button 
              className="menu-nav-item"
              onClick={() => navigateToMenu('intervals')}
            >
              Intervals
              <span className="menu-nav-arrow">→</span>
            </button>
            <button 
              className="menu-nav-item"
              onClick={() => navigateToMenu('noteDurations')}
            >
              Note Durations
              <span className="menu-nav-arrow">→</span>
            </button>
            <button 
              className="menu-nav-item"
              onClick={() => navigateToMenu('chordProgressions')}
            >
              Chord Progressions
              <span className="menu-nav-arrow">→</span>
            </button>
            <button 
              className="menu-nav-item"
              onClick={() => navigateToMenu('rightHandPatterns')}
            >
              Right Hand Patterns
              <span className="menu-nav-arrow">→</span>
            </button>
            <button 
              className="menu-nav-item"
              onClick={() => navigateToMenu('leftHandPatterns')}
            >
              Left Hand Patterns
              <span className="menu-nav-arrow">→</span>
            </button>
          </div>
        );

      case 'key':
        return (
          <div>
            <button className="back-button" onClick={goBack}>
              ← Back
            </button>
            <div className="menu-nav">
              <button 
                className="menu-nav-item"
                onClick={() => navigateToMenu('majorKeys')}
              >
                Major Keys
                <span className="menu-nav-arrow">→</span>
              </button>
              <button 
                className="menu-nav-item"
                onClick={() => navigateToMenu('minorKeys')}
              >
                Minor Keys
                <span className="menu-nav-arrow">→</span>
              </button>
            </div>
          </div>
        );

      case 'majorKeys':
        return (
          <div>
            <button className="back-button" onClick={goBack}>
              ← Back to Keys
            </button>
            <div className="button-grid">
              {majorKeys.map(key => (
                <button
                  key={key}
                  className={`button-grid-item ${(settings.key || 'C') === key ? 'selected' : ''}`}
                  onClick={() => handleSettingChange('key', key)}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        );

      case 'minorKeys':
        return (
          <div>
            <button className="back-button" onClick={goBack}>
              ← Back to Keys
            </button>
            <div className="button-grid">
              {minorKeys.map(key => (
                <button
                  key={key}
                  className={`button-grid-item ${(settings.key || 'C') === key ? 'selected' : ''}`}
                  onClick={() => handleSettingChange('key', key)}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        );

      case 'timeSignature':
        return (
          <div>
            <button className="back-button" onClick={goBack}>
              ← Back
            </button>
            <div className="button-grid">
              {AVAILABLE_TIME_SIGNATURES.map(sig => (
                <button
                  key={sig}
                  className={`button-grid-item ${(settings.timeSignature || '4/4') === sig ? 'selected' : ''}`}
                  onClick={() => handleSettingChange('timeSignature', sig)}
                >
                  {sig}
                </button>
              ))}
            </div>
          </div>
        );

      case 'measures': {
        const measureOptions = [4, 8, 12, 16, 20, 24, 28, 32];
        return (
          <div>
            <button className="back-button" onClick={goBack}>
              ← Back
            </button>
            <div className="button-grid">
              {measureOptions.map(measures => (
                <button
                  key={measures}
                  className={`button-grid-item ${(settings.measures || 8) === measures ? 'selected' : ''}`}
                  onClick={() => handleSettingChange('measures', measures)}
                >
                  {measures}
                </button>
              ))}
            </div>
          </div>
        );
      }

      case 'intervals':
        return (
          <div>
            <button className="back-button" onClick={goBack}>
              ← Back
            </button>
            <div className="button-grid">
              {AVAILABLE_INTERVALS.map(({ value, label }) => (
                <button
                  key={value}
                  className={`button-grid-item ${(settings.intervals || [1, 2, 3, 4, 5]).includes(value) ? 'selected' : ''}`}
                  onClick={() => handleIntervalToggle(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'noteDurations':
        return (
          <div>
            <button className="back-button" onClick={goBack}>
              ← Back
            </button>
            <div className="button-grid">
              {AVAILABLE_NOTE_DURATIONS.map(({ value, label }) => (
                <button
                  key={value}
                  className={`button-grid-item ${(settings.noteDurations || ['1/8', '1/4']).includes(value) ? 'selected' : ''}`}
                  onClick={() => handleNoteDurationToggle(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'chordProgressions':
        return (
          <div>
            <button className="back-button" onClick={goBack}>
              ← Back
            </button>
            <div className="button-grid">
              {CHORD_PROGRESSIONS.map(({ id, label }) => (
                <button
                  key={id}
                  className={`button-grid-item ${(settings.chordProgressions || ['pop', '50s', 'pop-variation', 'basic-cadence', 'jazz', 'alternating', 'minor-start', 'variation']).includes(id) ? 'selected' : ''}`}
                  onClick={() => handleChordProgressionToggle(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'rightHandPatterns': {
        // Filter right hand patterns based on current time signature
        const currentTimeSignature = settings.timeSignature || '4/4';
        const availablePatterns = AVAILABLE_RIGHT_HAND_PATTERNS.filter(pattern => 
          pattern.supportedTimeSignatures.includes(currentTimeSignature)
        );
        
        return (
          <div>
            <button className="back-button" onClick={goBack}>
              ← Back
            </button>
            <div className="button-grid">
              {availablePatterns.map(({ id, label }) => {
                if (id === 'intervals') {
                  // Make intervals button navigate to submenu
                  const isSelected = (settings.rightHandPatterns || ['single-notes']).includes('intervals');
                  return (
                    <button
                      key={id}
                      className={`button-grid-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => navigateToMenu('rightHandIntervals')}
                      style={{ justifyContent: 'space-between' }}
                    >
                      <span>{label}</span>
                      <span className="menu-nav-arrow" style={isSelected ? { color: 'white' } : {}}>→</span>
                    </button>
                  );
                } else if (id === '4-note-chords') {
                  // Make 4-note chords button navigate to submenu
                  const isSelected = (settings.rightHandPatterns || ['single-notes']).includes('4-note-chords');
                  return (
                    <button
                      key={id}
                      className={`button-grid-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => navigateToMenu('rightHand4NoteChords')}
                      style={{ justifyContent: 'space-between' }}
                    >
                      <span>{label}</span>
                      <span className="menu-nav-arrow" style={isSelected ? { color: 'white' } : {}}>→</span>
                    </button>
                  );
                } else {
                  // Regular pattern selection buttons
                  return (
                    <button
                      key={id}
                      className={`button-grid-item ${(settings.rightHandPatterns || ['single-notes']).includes(id) ? 'selected' : ''}`}
                      onClick={() => handleRightHandPatternToggle(id)}
                    >
                      {label}
                    </button>
                  );
                }
              })}
            </div>
          </div>
        );
      }

      case 'leftHandPatterns': {
        // Filter left hand patterns based on current time signature
        const currentTimeSignature = settings.timeSignature || '4/4';
        const availablePatterns = AVAILABLE_LEFT_HAND_PATTERNS.filter(pattern => 
          pattern.supportedTimeSignatures.includes(currentTimeSignature)
        );
        
        return (
          <div>
            <button className="back-button" onClick={goBack}>
              ← Back
            </button>
            <div className="button-grid">
              {availablePatterns.map(({ id, label }) => {
                if (id === 'broken-chords') {
                  // Make broken chords button navigate to submenu
                  const isSelected = (settings.leftHandPatterns).includes('broken-chords');
                  return (
                    <button
                      key={id}
                      className={`button-grid-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => navigateToMenu('leftHandBrokenChords')}
                      style={{ justifyContent: 'space-between' }}
                    >
                      <span>{label}</span>
                      <span className="menu-nav-arrow" style={isSelected ? { color: 'white' } : {}}>→</span>
                    </button>
                  );
                } else {
                  // Regular pattern selection buttons
                  return (
                    <button
                      key={id}
                      className={`button-grid-item ${(settings.leftHandPatterns).includes(id) ? 'selected' : ''}`}
                      onClick={() => handleLeftHandPatternToggle(id)}
                    >
                      {label}
                    </button>
                  );
                }
              })}
            </div>
          </div>
        );
      }

      case 'rightHandIntervals': {
        const intervalOptions = [
          { id: '2nd', label: '2nd' },
          { id: '3rd', label: '3rd' },
          { id: '4th', label: '4th' },
          { id: '5th', label: '5th' },
          { id: '6th', label: '6th' },
          { id: '7th', label: '7th' }
        ];
        
        return (
          <div>
            <button className="back-button" onClick={goBack}>
              ← Back
            </button>
            <div className="button-grid">
              {intervalOptions.map(({ id, label }) => {
                const isIntervalsPatternActive = (settings.rightHandPatterns || ['single-notes']).includes('intervals');
                const isThisIntervalSelected = (settings.rightHandIntervals || ['2nd'])[0] === id;
                const shouldHighlight = isIntervalsPatternActive && isThisIntervalSelected;
                
                return (
                  <button
                    key={id}
                    className={`button-grid-item ${shouldHighlight ? 'selected' : ''}`}
                    onClick={() => handleRightHandIntervalToggle(id)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      case 'rightHand4NoteChords': {
        const chordOptions = [
          { id: 'major', label: 'Major' },
          { id: '7th', label: '7th' }
        ];
        
        return (
          <div>
            <button className="back-button" onClick={goBack}>
              ← Back
            </button>
            <div className="button-grid">
              {chordOptions.map(({ id, label }) => {
                const is4NoteChordsPatternActive = (settings.rightHandPatterns || ['single-notes']).includes('4-note-chords');
                const isThisChordSelected = (settings.rightHand4NoteChords || ['major'])[0] === id;
                const shouldHighlight = is4NoteChordsPatternActive && isThisChordSelected;
                
                return (
                  <button
                    key={id}
                    className={`button-grid-item ${shouldHighlight ? 'selected' : ''}`}
                    onClick={() => handleRightHand4NoteChordToggle(id)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      case 'leftHandBrokenChords': {
        const brokenChordOptions = [
          { id: '1-3-5-3', label: '1-3-5-3' },
          { id: '1-5-3-5', label: '1-5-3-5' }
        ];
        
        return (
          <div>
            <button className="back-button" onClick={goBack}>
              ← Back
            </button>
            <div className="button-grid">
              {brokenChordOptions.map(({ id, label }) => {
                const isBrokenChordsPatternActive = (settings.leftHandPatterns).includes('broken-chords');
                const isThisPatternSelected = (settings.leftHandBrokenChords || ['1-3-5-3'])[0] === id;
                const shouldHighlight = isBrokenChordsPatternActive && isThisPatternSelected;
                
                return (
                  <button
                    key={id}
                    className={`button-grid-item ${shouldHighlight ? 'selected' : ''}`}
                    onClick={() => handleLeftHandBrokenChordToggle(id)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        className={`hamburger-button ${isOpen ? 'open' : ''}`}
        onClick={toggleMenu}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        aria-controls="settings-menu"
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>

      <div 
        className={`hamburger-menu-overlay ${isOpen ? 'open' : ''}`}
        aria-hidden={!isOpen}
      >
        <div 
          ref={menuRef}
          id="settings-menu"
          className={`hamburger-menu-content ${isOpen ? 'open' : ''}`}
          role="dialog"
          aria-labelledby="settings-menu-title"
        >
          <div className="hamburger-menu-header">
            <h2 id="settings-menu-title">Practice Settings</h2>
            <button 
              className="close-button"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>
          
          <div className="hamburger-menu-body">
            {renderMenuContent()}
          </div>
          
          {/* Zoom Controller - Fixed at bottom */}
          <div className="zoom-controller-footer">
            <div className="zoom-controller">
              <span className="zoom-label">Zoom</span>
              <div className="zoom-controls">
                <button 
                  className="zoom-button"
                  onClick={() => handleScaleChange(-0.25)}
                  disabled={(settings.musicScale || 1.0) <= 1.0}
                  aria-label="Zoom out"
                >
                  −
                </button>
                <span className="zoom-display">
                  {Math.round((settings.musicScale || 1.0) * 100)}%
                </span>
                <button 
                  className="zoom-button"
                  onClick={() => handleScaleChange(0.25)}
                  disabled={(settings.musicScale || 1.0) >= 2.0}
                  aria-label="Zoom in"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HamburgerMenu;