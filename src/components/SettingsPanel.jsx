import React from 'react';
import { 
  AVAILABLE_KEYS, 
  AVAILABLE_TIME_SIGNATURES, 
  AVAILABLE_NOTE_DURATIONS, 
  AVAILABLE_INTERVALS 
} from '../utils/musicGenerator';
import './SettingsPanel.css';

const SettingsPanel = ({ 
  settings, 
  onSettingsChange, 
  onGenerateNew,
  isInHamburgerMenu = false
}) => {
  const handleInputChange = (field, value) => {
    onSettingsChange({ ...settings, [field]: value });
  };

  const handleIntervalToggle = (interval) => {
    const currentIntervals = settings.intervals || [1, 2, 3, 4, 5];
    const newIntervals = currentIntervals.includes(interval)
      ? currentIntervals.filter(i => i !== interval)
      : [...currentIntervals, interval].sort((a, b) => a - b);
    
    // Ensure at least one interval is selected
    if (newIntervals.length > 0) {
      handleInputChange('intervals', newIntervals);
    }
  };

  const handleNoteDurationToggle = (duration) => {
    const currentDurations = settings.noteDurations || ['1/8', '1/4'];
    const newDurations = currentDurations.includes(duration)
      ? currentDurations.filter(d => d !== duration)
      : [...currentDurations, duration];
    
    // Ensure at least one duration is selected
    if (newDurations.length > 0) {
      handleInputChange('noteDurations', newDurations);
    }
  };

  return (
    <div className={`settings-panel ${isInHamburgerMenu ? 'in-hamburger-menu' : ''}`}>
      {!isInHamburgerMenu && (
        <div className="settings-header">
          <h2>Practice Settings</h2>
          <button 
            className="generate-btn"
            onClick={onGenerateNew}
          >
            Generate New Exercise
          </button>
        </div>
      )}

      <div className="settings-grid">
        {/* Key Selection */}
        <div className="setting-group">
          <label htmlFor="key-select">Key</label>
          <select
            id="key-select"
            value={settings.key || 'C'}
            onChange={(e) => handleInputChange('key', e.target.value)}
          >
            {AVAILABLE_KEYS.map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </div>

        {/* Time Signature */}
        <div className="setting-group">
          <label htmlFor="time-signature-select">Time Signature</label>
          <select
            id="time-signature-select"
            value={settings.timeSignature || '4/4'}
            onChange={(e) => handleInputChange('timeSignature', e.target.value)}
          >
            {AVAILABLE_TIME_SIGNATURES.map(sig => (
              <option key={sig} value={sig}>{sig}</option>
            ))}
          </select>
        </div>

        {/* Number of Measures */}
        <div className="setting-group">
          <label htmlFor="measures-input">Measures</label>
          <input
            id="measures-input"
            type="number"
            min="1"
            max="32"
            value={settings.measures || 8}
            onChange={(e) => handleInputChange('measures', parseInt(e.target.value) || 8)}
          />
        </div>
      </div>

      {/* Intervals Selection */}
      <div className="setting-group">
        <h3>Practice Intervals</h3>
        <div className="button-grid">
          {AVAILABLE_INTERVALS.map(({ value, label }) => (
            <button
              key={value}
              className={`toggle-button ${(settings.intervals || [1, 2, 3, 4, 5]).includes(value) ? 'active' : ''}`}
              onClick={() => handleIntervalToggle(value)}
              aria-pressed={(settings.intervals || [1, 2, 3, 4, 5]).includes(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Note Durations Selection */}
      <div className="setting-group">
        <h3>Note Durations</h3>
        <div className="button-grid">
          {AVAILABLE_NOTE_DURATIONS.map(({ value, label }) => (
            <button
              key={value}
              className={`toggle-button ${(settings.noteDurations || ['1/8', '1/4']).includes(value) ? 'active' : ''}`}
              onClick={() => handleNoteDurationToggle(value)}
              aria-pressed={(settings.noteDurations || ['1/8', '1/4']).includes(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;