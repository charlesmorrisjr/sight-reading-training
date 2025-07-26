import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = ({ settings, onSettingsChange }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // State for intervals selection page
  const [showIntervalsPage, setShowIntervalsPage] = useState(false);
  
  // TODO: settings and onSettingsChange will be used for future database integration
  // Currently these props are prepared for future database integration
  console.debug('Dashboard props:', { settings, onSettingsChange });
  const handleCategoryClick = (categoryId) => {
    if (categoryId === 'intervals') {
      setShowIntervalsPage(true);
    } else {
      console.log(`Category clicked: ${categoryId}`);
    }
  };

  const handleDrillPlay = () => {
    console.log('Playing suggested drill');
  };

  const handleAddCustomDrill = () => {
    console.log('Adding custom drill');
  };

  const handleCustomDrillClick = (drillId) => {
    console.log(`Custom drill clicked: ${drillId}`);
  };

  const handleNavClick = (navItem) => {
    if (navItem === 'practice') {
      navigate('/practice');
    } else {
      console.log(`Navigation clicked: ${navItem}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Intervals page handlers
  const handleBackToMain = () => {
    setShowIntervalsPage(false);
  };

  const handleIntervalToggle = (interval) => {
    const currentIntervals = settings.intervals || [1, 2, 3, 4, 5];
    const newIntervals = currentIntervals.includes(interval)
      ? currentIntervals.filter(i => i !== interval)
      : [...currentIntervals, interval].sort((a, b) => a - b);
    
    if (newIntervals.length > 0) {
      onSettingsChange({ ...settings, intervals: newIntervals });
    }
  };

  const handleIntervalsPractice = () => {
    navigate('/practice', { state: { intervals: settings.intervals } });
  };

  // Interval labels mapping
  const intervalLabels = {
    2: '2nd',
    3: '3rd', 
    4: '4th',
    5: '5th',
    6: '6th',
    7: '7th',
    8: '8th'
  };

  // Render intervals selection page
  if (showIntervalsPage) {
    return (
      <div className="dashboard">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-content">
            <div className="app-title">
              <h1>🎹 Sight Reading Trainer</h1>
            </div>
            <button className="hamburger-button" title="Settings">
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
          </div>
        </header>

        {/* Intervals Selection Content */}
        <main className="dashboard-main">
          <section className="intervals-page card">
            <div className="intervals-header">
              <button className="back-btn" onClick={handleBackToMain}>
                ← Back
              </button>
            </div>
            
            <h2>Select Intervals</h2>
            
            <div className="intervals-description">
              <p>Choose which intervals you'd like to practice:</p>
            </div>

            <div className="intervals-grid">
              {[2, 3, 4, 5, 6, 7, 8].map(interval => (
                <button
                  key={interval}
                  className={`interval-btn ${(settings.intervals || []).includes(interval) ? 'selected' : ''}`}
                  onClick={() => handleIntervalToggle(interval)}
                >
                  {intervalLabels[interval]}
                </button>
              ))}
            </div>

            <div className="intervals-actions">
              <button 
                className="practice-btn primary"
                onClick={handleIntervalsPractice}
                disabled={(settings.intervals || []).length === 0}
              >
                Practice Selected Intervals
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="app-title">
            <h1>🎹 Sight Reading Trainer</h1>
          </div>
          <button className="hamburger-button" title="Settings">
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
      </header>

      {/* Top Navigation Bar */}
      <nav className="top-nav">
        <div className="nav-buttons">
          <button 
            className="nav-btn active"
            onClick={() => handleNavClick('home')}
          >
            🏠 Home
          </button>
          <button 
            className="nav-btn"
            onClick={() => handleNavClick('practice')}
          >
            🎹 Practice
          </button>
          <button 
            className="nav-btn"
            onClick={() => handleNavClick('stats')}
          >
            📊 Stats
          </button>
          <button 
            className="nav-btn"
            onClick={() => handleNavClick('profile')}
          >
            👤 Profile
          </button>
          <div className="nav-user-section">
            <span className="nav-user-greeting">
              Hi, {user?.name}!
            </span>
            <button 
              className="nav-btn logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Dashboard Content */}
      <main className="dashboard-main">
        {/* Progress Summary */}
        <section className="progress-summary card">
          <h2>🎯 Progress Summary</h2>
          <div className="progress-content">
            <div className="progress-stat">
              <span className="progress-label">Pattern Mastery:</span>
              <span className="progress-value">68%</span>
            </div>
            <div className="progress-stat">
              <span className="progress-label">Last practiced:</span>
              <span className="progress-value">Aug 20</span>
            </div>
          </div>
        </section>

        {/* Exercise Categories */}
        <section className="exercise-categories card">
          <h2>🎼 Exercise Categories</h2>
          <div className="categories-grid">
            <button 
              className="category-item"
              onClick={() => handleCategoryClick('intervals')}
            >
              🔁 Intervals (Steps, Skips, Leaps)
            </button>
            <button 
              className="category-item"
              onClick={() => handleCategoryClick('chords')}
            >
              🔣 Chord Shapes & Arpeggios
            </button>
            <button 
              className="category-item"
              onClick={() => handleCategoryClick('melodic')}
            >
              🧩 Melodic Patterns (Scales, Sequences)
            </button>
            <button 
              className="category-item"
              onClick={() => handleCategoryClick('clefs')}
            >
              🎼 Bass vs Treble clef challenges
            </button>
          </div>
        </section>

        {/* Suggested Drill */}
        <section className="suggested-drill card">
          <h2>🔥 Suggested Drill</h2>
          <div className="drill-content">
            <div className="drill-info">
              <h3>Interval Drill #7: 3rds and 4ths</h3>
              <div className="drill-meta">
                <span className="drill-time">[ Time: 3 min ]</span>
                <span className="drill-difficulty">[ Difficulty: ★★☆☆☆ ]</span>
              </div>
            </div>
            <button className="drill-play-btn" onClick={handleDrillPlay}>
              ▶
            </button>
          </div>
        </section>

        {/* My Exercises */}
        <section className="my-exercises card">
          <h2>📚 My Exercises</h2>
          <div className="exercises-content">
            <button 
              className="add-drill-btn"
              onClick={handleAddCustomDrill}
            >
              [ + Add Custom Drill ]
            </button>
            <div className="exercises-list">
              <button 
                className="exercise-item"
                onClick={() => handleCustomDrillClick('arpeggios')}
              >
                • 5-note Arpeggios in C Major
              </button>
              <button 
                className="exercise-item"
                onClick={() => handleCustomDrillClick('step-skip')}
              >
                • Step-Skip Mix in Treble Clef
              </button>
              <button 
                className="exercise-item"
                onClick={() => handleCustomDrillClick('grand-staff')}
              >
                • Grand Staff Leap Challenge
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;