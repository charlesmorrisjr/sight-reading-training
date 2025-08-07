import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaClock } from 'react-icons/fa';

const MetronomeButton = ({ 
  tempo = 120, 
  isActive = false, 
  onToggle, 
  disabled = false 
}) => {
  // Audio context and timing refs
  const audioContextRef = useRef(null);
  const intervalRef = useRef(null);
  const nextBeatRef = useRef(0);
  
  // Visual feedback state
  const [isBeating, setIsBeating] = useState(false);
  
  // Calculate interval in milliseconds from BPM
  const getBeatInterval = useCallback((bpm) => {
    return (60 / bpm) * 1000; // Convert BPM to milliseconds per beat
  }, []);

  // Create metronome click sound using Web Audio API
  const createClickSound = useCallback(() => {
    if (!audioContextRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    
    // Configure oscillator for a sharp click sound
    oscillator.frequency.setValueAtTime(800, audioContextRef.current.currentTime); // High pitched click
    oscillator.type = 'sine';
    
    // Configure gain envelope for a sharp attack and quick decay
    gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContextRef.current.currentTime + 0.01); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.1); // Quick decay
    
    // Connect audio nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    
    // Play the sound
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 0.1);
    
    // Visual feedback - briefly flash the button
    setIsBeating(true);
    setTimeout(() => setIsBeating(false), 100);
  }, []);

  // Initialize audio context
  const initializeAudio = useCallback(async () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // Handle browser autoplay policies
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
    } catch (error) {
      console.error('Error initializing metronome audio:', error);
    }
  }, []);

  // Start metronome with precise timing
  const startMetronome = useCallback(async () => {
    if (!audioContextRef.current) {
      await initializeAudio();
    }
    
    if (!audioContextRef.current) return;

    const beatInterval = getBeatInterval(tempo);
    
    // Use more precise timing with Web Audio API currentTime
    const scheduleNextBeat = () => {
      const now = performance.now();
      
      if (nextBeatRef.current <= now) {
        createClickSound();
        nextBeatRef.current = now + beatInterval;
      }
      
      // Schedule next check slightly before the next beat
      const timeout = Math.max(1, nextBeatRef.current - now - 10);
      intervalRef.current = setTimeout(scheduleNextBeat, timeout);
    };
    
    // Start immediately
    nextBeatRef.current = performance.now();
    createClickSound();
    nextBeatRef.current += beatInterval;
    
    // Schedule subsequent beats
    intervalRef.current = setTimeout(scheduleNextBeat, beatInterval - 10);
  }, [tempo, createClickSound, getBeatInterval, initializeAudio]);

  // Stop metronome
  const stopMetronome = useCallback(() => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    setIsBeating(false);
  }, []);

  // Handle metronome toggle
  const handleToggle = useCallback(async () => {
    if (!onToggle) return;
    
    if (isActive) {
      stopMetronome();
    } else {
      await startMetronome();
    }
    
    onToggle();
  }, [isActive, onToggle, startMetronome, stopMetronome]);

  // Update metronome when tempo changes
  useEffect(() => {
    if (isActive) {
      stopMetronome();
      startMetronome();
    }
  }, [tempo, isActive, startMetronome, stopMetronome]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMetronome();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopMetronome]);

  return (
    <button 
      className={`btn btn-lg ${
        isActive 
          ? `btn-success ${isBeating ? 'animate-pulse' : ''}` 
          : 'btn-outline text-gray-700 hover:bg-gray-100'
      } ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } transition-all duration-150`}
      onClick={handleToggle}
      disabled={disabled}
      title={isActive ? 'Stop Metronome' : 'Start Metronome'}
    >
      <FaClock className={`w-5 h-5 ${isBeating && isActive ? 'text-white scale-110' : ''} transition-all duration-100`} />
      <span className="hidden sm:inline">
        {isActive ? 'Stop' : 'Metronome'}
      </span>
    </button>
  );
};

export default MetronomeButton;