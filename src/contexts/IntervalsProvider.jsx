import React, { useState } from 'react';
import IntervalsContext from './IntervalsContext';

export const IntervalsProvider = ({ children }) => {
  // Initialize with intervals 2nd through 8th (values 2-8, excluding Unison which is value 1)
  const [selectedIntervals, setSelectedIntervals] = useState([2, 3, 4, 5]);

  const toggleInterval = (intervalValue) => {
    setSelectedIntervals(prev => {
      const newIntervals = prev.includes(intervalValue)
        ? prev.filter(i => i !== intervalValue)
        : [...prev, intervalValue].sort((a, b) => a - b);
      
      // Ensure at least one interval is selected
      return newIntervals.length > 0 ? newIntervals : prev;
    });
  };

  const value = {
    selectedIntervals,
    setSelectedIntervals,
    toggleInterval
  };

  return (
    <IntervalsContext.Provider value={value}>
      {children}
    </IntervalsContext.Provider>
  );
};