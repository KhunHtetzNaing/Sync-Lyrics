import { useState, useCallback } from 'react';
import { Subtitle, HistoryState } from '../types';

export const useHistory = (initialSubtitles: Subtitle[]) => {
  const [history, setHistory] = useState<HistoryState[]>([{ subtitles: initialSubtitles, activeIndex: -1 }]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentState = history[currentIndex];

  const pushState = useCallback((subtitles: Subtitle[], activeIndex: number) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      // Limit history stack size to prevent memory issues
      if (newHistory.length > 50) newHistory.shift(); 
      return [...newHistory, { subtitles: JSON.parse(JSON.stringify(subtitles)), activeIndex }];
    });
    setCurrentIndex(prev => Math.min(prev + 1, 50));
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    currentState,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory: (initial: Subtitle[]) => {
        setHistory([{ subtitles: initial, activeIndex: -1 }]);
        setCurrentIndex(0);
    }
  };
};