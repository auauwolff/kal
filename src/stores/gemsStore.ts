import { create } from 'zustand';

interface AddGemsOptions {
  stagger?: boolean;
}

interface GemsStore {
  balance: number;
  // Increments on every addGems call so subscribers can fire animations / haptics
  // without re-running on unrelated state changes. The visible balance is synced
  // from Convex so refreshes and multiple devices stay consistent.
  addEventNonce: number;
  lastAddedAmount: number;
  setBalance: (balance: number) => void;
  addGems: (n: number, opts?: AddGemsOptions) => void;
}

const STAGGER_INTERVAL_MS = 180;

export const useGemsStore = create<GemsStore>()((set) => ({
  balance: 0,
  addEventNonce: 0,
  lastAddedAmount: 0,
  setBalance: (balance) =>
    set((s) => {
      const nextBalance = Math.max(0, Math.floor(balance));
      return s.balance === nextBalance ? s : { balance: nextBalance };
    }),
  addGems: (n, opts) => {
    if (n <= 0) return;
    if (!opts?.stagger || n <= 1) {
      set((s) => ({
        addEventNonce: s.addEventNonce + 1,
        lastAddedAmount: n,
      }));
      return;
    }
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        set((s) => ({
          addEventNonce: s.addEventNonce + 1,
          lastAddedAmount: 1,
        }));
      }, i * STAGGER_INTERVAL_MS);
    }
  },
}));
