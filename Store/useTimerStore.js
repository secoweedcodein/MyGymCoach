import { create } from 'zustand';
import * as Haptics from 'expo-haptics';

export const useTimerStore = create((set, get) => ({
  isActive: false,
  timeLeft: 0,
  defaultDuration: 90, // 90 segundos por defecto
  
  startTimer: (duration = 90) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Vibración al iniciar
    set({ isActive: true, timeLeft: duration, defaultDuration: duration });
    get().tick();
  },
  
  tick: () => {
    const { timeLeft, isActive } = get();
    if (!isActive || timeLeft <= 0) {
      if (timeLeft <= 0 && isActive) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // Vibración fuerte al terminar
        set({ isActive: false });
      }
      return;
    }
    
    setTimeout(() => {
      set((state) => ({ timeLeft: state.timeLeft - 1 }));
      get().tick();
    }, 1000);
  },

  stopTimer: () => set({ isActive: false, timeLeft: 0 }),
  setDuration: (duration) => set({ defaultDuration: duration }),
}));