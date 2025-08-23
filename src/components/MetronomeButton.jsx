import React, { useState, useEffect, useRef, useCallback } from 'react';
import MetronomeIcon from '../assets/metronome-svgrepo-com.svg?react';

const MetronomeButton = ({ 
  tempo = 120, 
  isActive = false, 
  onToggle, 
  disabled = false,
  useExternalTiming = false,
  onExternalBeatTrigger
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

  // External beat trigger function - exposed to parent
  const triggerBeat = useCallback(async () => {
    if (!isActive) return;
    
    if (!audioContextRef.current) {
      await initializeAudio();
    }
    
    createClickSound();
  }, [isActive, createClickSound, initializeAudio]);

  // Expose triggerBeat function to parent via callback
  useEffect(() => {
    if (onExternalBeatTrigger) {
      onExternalBeatTrigger(triggerBeat);
    }
  }, [triggerBeat, onExternalBeatTrigger]);


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
    } else if (!useExternalTiming) {
      // Only start internal timing if not using external timing
      await startMetronome();
    } else {
      // For external timing, just initialize audio context
      if (!audioContextRef.current) {
        await initializeAudio();
      }
    }
    
    onToggle();
  }, [isActive, onToggle, startMetronome, stopMetronome, useExternalTiming, initializeAudio]);

  // Stop internal timing when switching to external timing
  useEffect(() => {
    if (isActive && useExternalTiming) {
      // Switch from internal to external timing - stop internal metronome
      stopMetronome();
    }
  }, [useExternalTiming, isActive, stopMetronome]);

  // Update metronome when tempo changes (only for internal timing)
  useEffect(() => {
    if (isActive && !useExternalTiming) {
      stopMetronome();
      startMetronome();
    }
  }, [tempo, isActive, startMetronome, stopMetronome, useExternalTiming]);

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
          ? `${isBeating ? 'bg-green-500' : 'bg-white'} text-white border-green-600` 
          : 'btn-outline text-gray-700 hover:bg-gray-100'
      } ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } transition-all duration-150`}
      onClick={handleToggle}
      disabled={disabled}
      title={isActive ? 'Stop Metronome' : 'Start Metronome'}
    >
      <MetronomeIcon className={`w-7 h-7 ${isBeating && isActive ? 'scale-110' : ''} transition-all duration-100`} />
    </button>
  );
};

export default MetronomeButton;