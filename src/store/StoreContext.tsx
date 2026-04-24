import { createContext, useContext } from 'react';
import type { AppStore } from './useAppStore';

export const StoreContext = createContext<AppStore | null>(null);

export function useStore(): AppStore {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreContext.Provider');
  return ctx;
}
