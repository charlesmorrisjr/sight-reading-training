import React, { useState } from 'react';
import ChordsContext from './ChordsContext';

export const ChordsProvider = ({ children }) => {
  // Initialize with some default chord selections
  const [selectedChordTypes, setSelectedChordTypes] = useState(['major', 'minor']);
  const [selectedChordInversions, setSelectedChordInversions] = useState(['root']);
  const [selectedChordVoicings, setSelectedChordVoicings] = useState(['closed']);
  const [selectedChordRhythms, setSelectedChordRhythms] = useState(['straight']);

  const toggleChordType = (chordTypeId) => {
    setSelectedChordTypes(prev => {
      const newTypes = prev.includes(chordTypeId)
        ? prev.filter(id => id !== chordTypeId)
        : [...prev, chordTypeId];
      
      // Ensure at least one chord type is selected
      return newTypes.length > 0 ? newTypes : prev;
    });
  };

  const toggleChordInversion = (inversionId) => {
    setSelectedChordInversions(prev => {
      const newInversions = prev.includes(inversionId)
        ? prev.filter(id => id !== inversionId)
        : [...prev, inversionId];
      
      // Ensure at least one inversion is selected
      return newInversions.length > 0 ? newInversions : prev;
    });
  };

  const toggleChordVoicing = (voicingId) => {
    setSelectedChordVoicings(prev => {
      const newVoicings = prev.includes(voicingId)
        ? prev.filter(id => id !== voicingId)
        : [...prev, voicingId];
      
      // Ensure at least one voicing is selected
      return newVoicings.length > 0 ? newVoicings : prev;
    });
  };

  const toggleChordRhythm = (rhythmId) => {
    setSelectedChordRhythms(prev => {
      const newRhythms = prev.includes(rhythmId)
        ? prev.filter(id => id !== rhythmId)
        : [...prev, rhythmId];
      
      // Ensure at least one rhythm is selected
      return newRhythms.length > 0 ? newRhythms : prev;
    });
  };

  const value = {
    selectedChordTypes,
    setSelectedChordTypes,
    toggleChordType,
    selectedChordInversions,
    setSelectedChordInversions,
    toggleChordInversion,
    selectedChordVoicings,
    setSelectedChordVoicings,
    toggleChordVoicing,
    selectedChordRhythms,
    setSelectedChordRhythms,
    toggleChordRhythm
  };

  return (
    <ChordsContext.Provider value={value}>
      {children}
    </ChordsContext.Provider>
  );
};