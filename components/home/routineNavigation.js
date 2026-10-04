// components/home/routineNavigation.js
// Lógica extraída del HomeScreen original (RoutineCard.handlePress / nombres de preview).
// Se conservan las mismas rutas y el mismo orden de detección.
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase.js';
import { getExercise } from '../../src/screens/data/exercises.js';
import { COLORS, ROUTINE_ACCENTS } from './theme';

const DAY_MS = 1000 * 60 * 60 * 24;

function classify(routine) {
  const name = (routine.name || '').toLowerCase();
  const isChallenge = !!routine.is_challenge;

  return {
    isChallenge,
    isAbs: isChallenge && (routine.challenge_type === 'abs' || name.includes('abs')),
    isHipertrofiaAvanzada:
      isChallenge && (routine.challenge_type === 'hipertrofia_avanzada' || name.includes('avanzada')),
    isHipertrofia30Dias: isChallenge && name.includes('hipertrofia') && name.includes('30'),
    isPPL: name.includes('ppl') || name.includes('push pull legs'),
    isUpper: name.includes('upper') || name.includes('hipertrofia upper'),
    isFullBody: name.includes('full body') || name.includes('fullbody'),
    is5x5: name.includes('5x5') || name.includes('fuerza 5x5'),
    isFuncional: name.includes('funcional') || name.includes('fuerza funcional'),
    isPowerbuilding: name.includes('powerbuilding'),
  };
}

function previewNames(routine, kind) {
  const ids = routine.exercise_ids || [];
  if (kind.isAbs) return ['Plancha frontal', 'Crunch inverso', 'Russian twist'];
  if (kind.isHipertrofiaAvanzada || kind.isHipertrofia30Dias) return ['Press banca', 'Sentadilla', 'Peso muerto'];
  if (kind.isPPL) return ['Press banca', 'Sentadilla', 'Dominadas'];
  if (kind.isUpper) return ['Press banca', 'Remo con barra', 'Press militar'];
  if (kind.isFullBody || kind.is5x5) return ['Sentadilla', 'Press banca', 'Remo'];
  return ids.slice(0, 3).map((id) => getExercise(id)?.name || '?');
}

/** Datos de presentación de una rutina o reto. */
export function getRoutineMeta(routine, index = 0) {
  const ids = routine.exercise_ids || [];
  const kind = classify(routine);

  let daysRemaining = null;
  if (kind.isChallenge && routine.challenge_start_date) {
    const start = new Date(routine.challenge_start_date);
    const diffDays = Math.ceil(Math.abs(new Date() - start) / DAY_MS);
    daysRemaining = Math.max(0, 30 - diffDays);
  }

  return {
    isChallenge: kind.isChallenge,
    exerciseCount: ids.length,
    daysRemaining,
    chips: previewNames(routine, kind),
    extra: kind.isChallenge ? 3 : Math.max(0, ids.length - 3),
    accent: kind.isChallenge ? COLORS.challenge : ROUTINE_ACCENTS[index % ROUTINE_ACCENTS.length],
  };
}

async function findChallengeId(routineName) {
  const challengeName = (routineName || '').replace(/^Reto:\s*/i, '').trim();
  try {
    const { data } = await supabase
      .from('challenges')
      .select('id')
      .eq('name', challengeName)
      .maybeSingle();
    return data?.id ?? null;
  } catch {
    return null;
  }
}

/** Navega al destino correcto (misma lógica del Home original). */
export async function openRoutine(routine) {
  const kind = classify(routine);

  if (kind.isAbs) return router.push('/explore/abs-challenge');
  if (kind.isHipertrofiaAvanzada) return router.push('/explore/hipertrofia-challenge');

  if (kind.isHipertrofia30Dias) {
    const id = await findChallengeId(routine.name);
    return router.push(id ? `/explore/challenge-detail?id=${id}` : '/explore/challenge-detail');
  }

  if (kind.isPPL) return router.push('/explore/routine-detail?id=ppl');
  if (kind.isUpper) return router.push('/explore/routine-detail?id=upper');
  if (kind.isFullBody) return router.push('/explore/routine-detail?id=fullbody');
  if (kind.is5x5) return router.push('/explore/routine-detail?id=5x5');
  if (kind.isFuncional) return router.push('/explore/routine-detail?id=funcional');
  if (kind.isPowerbuilding) return router.push('/explore/routine-detail?id=powerbuilding');

  if (kind.isChallenge) {
    const id = await findChallengeId(routine.name);
    return router.push(`/explore/challenge-dynamic?id=${id ?? routine.id}`);
  }

  const routineObj = {
    id: routine.id,
    name: routine.name,
    exercise_ids: routine.exercise_ids || [],
  };
  return router.push(`/workout?routine=${encodeURIComponent(JSON.stringify(routineObj))}`);
}