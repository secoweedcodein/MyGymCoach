import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useWorkoutStore = create(
  persist(
    (set, get) => ({
      // Estado del entrenamiento activo
      activeWorkout: null,
      currentSets: [], // Aquí se guardan las series temporalmente sin internet
      pendingSyncQueue: [], // array de operaciones para sincronizar
      isOnline: true,

      setOnlineStatus: (status) => set({ isOnline: status }),
      
      addToPendingSync: (operation) => {
        const queue = get().pendingSyncQueue;
        set({ pendingSyncQueue: [...queue, operation] });
      },

      syncPendingOperations: async (supabase) => {
        const queue = get().pendingSyncQueue;
        if (queue.length === 0 || !get().isOnline) return;
        
        try {
          // Implementación básica de procesamiento de cola
          for (const op of queue) {
            if (op.type === 'INSERT_SET') {
              await supabase.from('workout_sets').insert(op.data);
            }
            // Add other operations as needed
          }
          set({ pendingSyncQueue: [] });
        } catch (error) {
          console.error("Error syncing queue", error);
        }
      },

      clearSyncedOperations: () => set({ pendingSyncQueue: [] }),

      // Acción: Iniciar un entrenamiento
      startWorkout: (workoutData) => {
        set({ activeWorkout: workoutData, currentSets: [] });
      },

      // Acción: Agregar una serie (se guarda localmente al instante, aunque no haya internet)
      addSet: (setData) => {
        const currentSets = get().currentSets;
        set({ currentSets: [...currentSets, { ...setData, id: Date.now().toString(), synced: false }] });
      },

      // Acción: Marcar serie como sincronizada (cuando el sistema detecte que volvió el internet)
      markSetAsSynced: (setId) => {
        const currentSets = get().currentSets.map(set => 
          set.id === setId ? { ...set, synced: true } : set
        );
        set({ currentSets });
      },

      // Acción: Finalizar y limpiar
      finishWorkout: () => {
        set({ activeWorkout: null, currentSets: [] });
      },
    }),
    {
      name: 'mygymcoach-active-workout-storage', // Nombre único para el almacenamiento local
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
