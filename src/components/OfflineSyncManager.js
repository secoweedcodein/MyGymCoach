// src/components/OfflineSyncManager.js
//
// Ciclo de vida de la sincronización offline (FASE 4):
//   - Arranca el network listener + el procesador de cola cuando hay usuario.
//   - Procesa la cola al volver la conexión, al volver la app a foreground y
//     cada vez que se encola una mutación nueva.
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  startNetworkListener,
  stopNetworkListener,
} from '../../services/offline/networkListener';
import { subscribeQueue } from '../../services/offline/mutationQueueService';
import { scheduleProcess } from '../../features/workout/services/workoutQueueProcessor';

export default function OfflineSyncManager() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return undefined;

    startNetworkListener(userId, {});

    const unsubscribe = subscribeQueue(() => scheduleProcess(userId, {}, 0));

    return () => {
      unsubscribe();
      stopNetworkListener();
    };
  }, [userId]);

  return null;
}
