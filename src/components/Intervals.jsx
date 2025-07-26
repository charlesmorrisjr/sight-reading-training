import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntervals } from '../contexts/useIntervals';
import { AVAILABLE_INTERVALS } from '../utils/musicGenerator';
import './Intervals.css';

const Intervals = () => {
  const navigate = useNavigate();
  const { selectedIntervals, toggleInterval } = useIntervals();

  // Filter intervals to show only 2nd through 8th (excluding Unison)
  const displayIntervals = AVAILABLE_INTERVALS.filter(interval => interval.value >= 2 && interval.value <= 8);

  const handleBackClick = () => {
    navigate('/dashboard');
  };

  return (
    <div className="intervals-page">
      {/* Header */}
      <header className="intervals-header">
        <div className="header-content">
          <button 
            className="back-button"
            onClick={handleBackClick}
            aria-label="Back to Dashboard"
          >
            ← Back
          </button>
          <div className="app-title">
            <h1>Intervals</h1>
          </div>
          <div className="header-spacer"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="intervals-main">
        <section className="intervals-section">
          <h2>Select Practice Intervals</h2>
          <p className="intervals-description">
            Choose which intervals you'd like to practice. Selected intervals will be used in your sight reading exercises.
          </p>
          
          <div className="intervals-grid">
            {displayIntervals.map(({ value, label }) => (
              <button
                key={value}
                className={`interval-toggle-button ${selectedIntervals.includes(value) ? 'active' : ''}`}
                onClick={() => toggleInterval(value)}
                aria-pressed={selectedIntervals.includes(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Practice Button at Bottom */}
        <section className="intervals-footer">
          <button 
            className="practice-button"
            onClick={() => navigate('/practice')}
          >
            Practice
          </button>
        </section>
      </main>
    </div>
  );
};

export default Intervals;