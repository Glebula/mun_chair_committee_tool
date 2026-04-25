import { useEffect } from 'react';
import type { AppStore } from '../store/useAppStore';

export function useKeyboardShortcuts(store: AppStore) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Don't fire when typing in an input/textarea/select
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const { state } = store;

      switch (e.key) {
        case ' ':
        case 'Space': {
          e.preventDefault();
          // Play/pause the relevant timer based on current state
          if (state.sessionState === 'GSL') {
            store.gslSetTimerRunning(!state.gsl.timerRunning);
          } else if (state.sessionState === 'ModeratedCaucus') {
            store.modSetRunning(!state.modCaucus.speakerRunning);
          } else if (state.sessionState === 'UnmoderatedCaucus' || state.sessionState === 'GentlemansUnmod') {
            store.unmodSetRunning(!state.unmod.running);
          } else if (state.sessionState === 'RoundRobin') {
            store.rrSetRunning(!state.roundRobin.timerRunning);
          }
          break;
        }
        case 'n':
        case 'N': {
          if (state.sessionState === 'GSL') {
            const { gsl } = state;
            if (gsl.currentIndex < gsl.speakers.length - 1) {
              const current = gsl.speakers[gsl.currentIndex];
              if (current) store.incrementSpeechCount(current.delegateId);
              store.gslNextSpeaker();
            }
          } else if (state.sessionState === 'RoundRobin') {
            const current = state.roundRobin.participants[state.roundRobin.currentIndex];
            if (current) store.incrementSpeechCount(current.delegateId);
            store.rrNext();
          }
          break;
        }
        case 'r':
        case 'R': {
          if (state.sessionState === 'GSL') {
            store.gslResetTimer();
          } else if (state.sessionState === 'ModeratedCaucus') {
            store.modResetSpeaker();
          }
          break;
        }
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [store]);
}
