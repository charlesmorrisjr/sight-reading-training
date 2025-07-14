import React, { useState, useEffect, useRef } from 'react';
import SettingsPanel from './SettingsPanel';
import './HamburgerMenu.css';

const HamburgerMenu = ({ 
  settings, 
  onSettingsChange, 
  onGenerateNew 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
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
            <SettingsPanel
              settings={settings}
              onSettingsChange={onSettingsChange}
              onGenerateNew={onGenerateNew}
              isInHamburgerMenu={true}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default HamburgerMenu;