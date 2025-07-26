import { useContext } from 'react';
import IntervalsContext from './IntervalsContext';

export const useIntervals = () => {
  const context = useContext(IntervalsContext);
  if (!context) {
    throw new Error('useIntervals must be used within an IntervalsProvider');
  }
  return context;
};