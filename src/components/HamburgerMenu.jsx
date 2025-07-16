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
      const currentLeftHandPattern = settings.leftHandPatterns?.[0] || 'block-chords';
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
              {availablePatterns.map(({ id, label }) => (
                <button
                  key={id}
                  className={`button-grid-item ${(settings.rightHandPatterns || ['single-notes']).includes(id) ? 'selected' : ''}`}
                  onClick={() => handleRightHandPatternToggle(id)}
                >
                  {label}
                </button>
              ))}
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
              {availablePatterns.map(({ id, label }) => (
                <button
                  key={id}
                  className={`button-grid-item ${(settings.leftHandPatterns || ['block-chords']).includes(id) ? 'selected' : ''}`}
                  onClick={() => handleLeftHandPatternToggle(id)}
                >
                  {label}
                </button>
              ))}
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
        </div>
      </div>
    </>
  );
};

export default HamburgerMenu;