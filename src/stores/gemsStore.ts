import { create } from 'zustand';

interface GemsStore {
  balance: number;
  // Increments on every addGems call so subscribers can fire animations / haptics
  // without re-running on unrelated state changes.
  addEventNonce: number;
  lastAddedAmount: number;
  addGems: (n: number) => void;
}

export const useGemsStore = create<GemsStore>()((set) => ({
  balance: 0,
  addEventNonce: 0,
  lastAddedAmount: 0,
  addGems: (n) =>
    set((s) => ({
      balance: s.balance + n,
      addEventNonce: s.addEventNonce + 1,
      lastAddedAmount: n,
    })),
}));
