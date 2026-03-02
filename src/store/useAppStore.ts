import { create } from 'zustand';

interface AppStore {
  triggerConfetti: boolean;
  setTriggerConfetti: (trigger: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  triggerConfetti: false,
  setTriggerConfetti: (trigger) => set({ triggerConfetti: trigger }),
}));
