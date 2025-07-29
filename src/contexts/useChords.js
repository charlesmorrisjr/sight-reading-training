import { useContext } from 'react';
import ChordsContext from './ChordsContext';

export const useChords = () => {
  const context = useContext(ChordsContext);
  if (!context) {
    throw new Error('useChords must be used within a ChordsProvider');
  }
  return context;
};