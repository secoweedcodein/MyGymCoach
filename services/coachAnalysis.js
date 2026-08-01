// src/services/coachAnalysis.js
import { supabase } from '../lib/supabase';

const logger = {
  debug: (...args) => console.log('[coachAnalysis]', ...args),
  warn: (...args) => console.warn('[coachAnalysis]', ...args),
};

// ─── Utilidades de fecha ──────────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().split('T')[0]; }
function daysAgoISO(n) {
  const d = new Date(); d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}
function startOfWeekISO() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff); d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}
function startOfLastWeekISO() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day - 6;
  d.setDate(diff); d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

// ─── Carga maestra de datos ───────────────────────────────────────────────────
/**
 * Carga todos los datos necesarios para el análisis en paralelo.
 * Una sola llamada, múltiples queries.
 */
// ─── Carga maestra de datos con DIAGNÓSTICO ───────────────────────────────────
export async function loadAllCoachData(userId) {
  if (!userId) {
    console.log('[coach] ❌ No hay userId');
    return null;
  }

  console.log('[coach] 🔍 Usuario:', userId);
  
  const today = todayISO();
  const weekStart = startOfWeekISO();
  const lastWeekStart = startOfLastWeekISO();

  console.log('[coach] 📅 Fechas calculadas:', { today, weekStart, lastWeekStart });

  const [
    goalsRes,
    todayNutritionRes,
    weekNutritionRes,
    todayWorkoutRes,
    thisWeekWorkoutsRes,
    lastWeekWorkoutsRes,
    recentSetsRes,
    recordsRes,
    weightRes,
    goalsCalRes,
  ] = await Promise.all([
    supabase.from('nutrition_goals').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('nutrition_logs').select('*').eq('user_id', userId).eq('logged_date', today),
    supabase.from('nutrition_logs').select('*').eq('user_id', userId).gte('logged_date', daysAgoISO(7)),
    supabase.from('workout_sessions').select('*').eq('user_id', userId).gte('finished_at', `${today}T00:00:00`).lte('finished_at', `${today}T23:59:59`),
    supabase.from('workout_sessions').select('*').eq('user_id', userId).gte('finished_at', `${weekStart}T00:00:00`),
    supabase.from('workout_sessions').select('*').eq('user_id', userId).gte('finished_at', `${lastWeekStart}T00:00:00`).lt('finished_at', `${weekStart}T00:00:00`),
    supabase.from('workout_sets').select('*, workout_sessions!inner(finished_at, user_id)').eq('workout_sessions.user_id', userId).gte('workout_sessions.finished_at', daysAgoISO(14)).order('finished_at', { ascending: false }).limit(200),
    supabase.from('personal_records').select('*').eq('user_id', userId).order('achieved_at', { ascending: false }).limit(10),
    supabase.from('weight_logs').select('*').eq('user_id', userId).order('logged_date', { ascending: false }).limit(60),
    supabase.from('user_profiles').select('calorie_goal, protein_goal, weight_kg, height_cm').eq('id', userId).maybeSingle(),
  ]);

  // 🔍 LOGS DETALLADOS PARA DIAGNÓSTICO
  console.log('[coach] 📊 RESULTADOS:');
  console.log('  - nutrition_goals:', goalsRes.data ? '✅' : '❌', goalsRes.error?.message);
  console.log('  - todayNutrition:', todayNutritionRes.data?.length || 0, 'registros');
  console.log('    → Datos:', todayNutritionRes.data);
  console.log('    → Error:', todayNutritionRes.error?.message);
  console.log('  - weekNutrition:', weekNutritionRes.data?.length || 0, 'registros');
  console.log('    → Datos:', weekNutritionRes.data?.slice(0, 3));
  console.log('  - todayWorkout:', todayWorkoutRes.data?.length || 0, 'registros');
  console.log('  - thisWeekWorkouts:', thisWeekWorkoutsRes.data?.length || 0, 'registros');
  console.log('  - lastWeekWorkouts:', lastWeekWorkoutsRes.data?.length || 0, 'registros');
  console.log('  - recentSets:', recentSetsRes.data?.length || 0, 'registros');
  console.log('  - personal_records:', recordsRes.data?.length || 0, 'registros');
  console.log('  - weight_logs:', weightRes.data?.length || 0, 'registros');
  console.log('  - user_profiles:', goalsCalRes.data ? '✅' : '❌');

  return {
    goals: goalsRes.data || { calories: 2000, protein_g: 150, carbs_g: 250, fat_g: 70 },
    todayNutrition: todayNutritionRes.data || [],
    weekNutrition: weekNutritionRes.data || [],
    todayWorkout: todayWorkoutRes.data || [],
    thisWeekWorkouts: thisWeekWorkoutsRes.data || [],
    lastWeekWorkouts: lastWeekWorkoutsRes.data || [],
    recentSets: recentSetsRes.data || [],
    records: recordsRes.data || [],
    weightHistory: weightRes.data || [],
    profile: goalsCalRes.data || {},
  };
}

// ─── SECCIÓN 1: Resumen del día ───────────────────────────────────────────────
// ─── SECCIÓN 1: Resumen del día ───────────────────────────────────────────────
export function analyzeDailySummary(data) {
  const { goals, todayNutrition, todayWorkout } = data;
  
  console.log('[analyzeDailySummary] 🔍 INPUT:', {
    goalsCalories: goals?.calories,
    goalsProtein: goals?.protein_g,
    todayNutritionCount: todayNutrition?.length,
    todayNutritionData: todayNutrition,
  });
  
  const caloriesConsumed = todayNutrition.reduce((a, l) => a + (l.calories || 0), 0);
  const proteinConsumed = todayNutrition.reduce((a, l) => a + (l.protein_g || 0), 0);
  const caloriesRemaining = Math.max((goals.calories || 2000) - caloriesConsumed, 0);
  
  const workoutDone = todayWorkout.length > 0;
  const workoutTime = todayWorkout.reduce((a, s) => a + (s.duration_minutes || 0), 0);

  let recommendation = null;
  const proteinGoal = goals.protein_g || 150;
  const proteinRemaining = proteinGoal - proteinConsumed;
  
  if (!workoutDone && new Date().getHours() >= 18) {
    recommendation = 'Aún no entrenas hoy. Una sesión de 30 min marcaría la diferencia.';
  } else if (proteinRemaining > 20) {
    recommendation = `Te faltan aproximadamente ${Math.round(proteinRemaining)} g de proteína para alcanzar tu objetivo.`;
  } else if (caloriesRemaining > 500 && new Date().getHours() >= 14) {
    recommendation = `Aún te quedan ${Math.round(caloriesRemaining)} kcal. Asegúrate de comer suficiente.`;
  }

  const result = {
    caloriesConsumed,
    caloriesRemaining,
    proteinConsumed,
    proteinGoal,
    workoutDone,
    workoutTime,
    goalCalories: goals.calories || 2000,
    recommendation,
  };

  console.log('[analyzeDailySummary] ✅ OUTPUT:', result);
  
  return result;
}

// ─── SECCIÓN 2: Análisis del entrenamiento ────────────────────────────────────
export function analyzeTraining(data) {
  const { thisWeekWorkouts, lastWeekWorkouts, recentSets } = data;

  const thisWeekVolume = thisWeekWorkouts.reduce((a, s) => a + (s.total_volume_kg || 0), 0);
  const lastWeekVolume = lastWeekWorkouts.reduce((a, s) => a + (s.total_volume_kg || 0), 0);
  const volumeChange = lastWeekVolume > 0
    ? Math.round(((thisWeekVolume - lastWeekVolume) / lastWeekVolume) * 100)
    : 0;

  const thisWeekSessions = thisWeekWorkouts.length;
  const lastWeekSessions = lastWeekWorkouts.length;

  // Análisis de frecuencia por grupo muscular (basado en nombre de ejercicio)
  const muscleGroups = { pecho: 0, espalda: 0, piernas: 0, hombros: 0, brazos: 0 };
  recentSets.forEach(s => {
    const name = (s.exercise_name || '').toLowerCase();
    if (/press|pec|fly|apertur/.test(name)) muscleGroups.pecho++;
    else if (/remo|jalón|pull|row|deadlift|peso muerto/.test(name)) muscleGroups.espalda++;
    else if (/squat|sentad|prensa|leg|zancad|lunge/.test(name)) muscleGroups.piernas++;
    else if (/hombro|press militar|lateral|rear delt/.test(name)) muscleGroups.hombros++;
    else if (/bicep|tricep|curl|extension/.test(name)) muscleGroups.brazos++;
  });

  const insights = [];
  if (volumeChange > 5) insights.push(`Has aumentado tu volumen de entrenamiento un ${volumeChange}% respecto a la semana pasada.`);
  else if (volumeChange < -10) insights.push(`Tu volumen bajó un ${Math.abs(volumeChange)}% esta semana. ¿Necesitas descansar o estás falto de motivación?`);
  
  if (thisWeekSessions > lastWeekSessions) insights.push(`Mayor frecuencia esta semana: ${thisWeekSessions} sesiones vs ${lastWeekSessions} la anterior.`);
  
  if (muscleGroups.piernas === 0 && thisWeekSessions > 0) {
    insights.push('No has entrenado piernas esta semana. ¡No te las saltes!');
  }
  if (muscleGroups.pecho > muscleGroups.espalda * 1.5) {
    insights.push('Estás entrenando más pecho que espalda. Equilibra para evitar lesiones.');
  }

  return {
    thisWeekSessions,
    lastWeekSessions,
    thisWeekVolume: Math.round(thisWeekVolume),
    lastWeekVolume: Math.round(lastWeekVolume),
    volumeChange,
    muscleGroups,
    insights: insights.slice(0, 3),
  };
}

// ─── SECCIÓN 3: Análisis nutricional ──────────────────────────────────────────
// ─── Calcular racha de días consecutivos cumpliendo objetivos ─────────────────
function calculateStreak(weekNutrition, goals) {
  if (!weekNutrition || weekNutrition.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }

  // Agrupar logs por día
  const byDay = {};
  weekNutrition.forEach(l => {
    if (!byDay[l.logged_date]) byDay[l.logged_date] = { calories: 0, protein: 0 };
    byDay[l.logged_date].calories += l.calories || 0;
    byDay[l.logged_date].protein += l.protein_g || 0;
  });

  // Ordenar días de más reciente a más antiguo
  const sortedDays = Object.entries(byDay)
    .sort((a, b) => new Date(b[0]) - new Date(a[0]));

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  let lastDate = null;

  for (const [date, totals] of sortedDays) {
    const calOk = totals.calories >= goals.calories * 0.9 && totals.calories <= goals.calories * 1.1;
    const protOk = totals.protein >= goals.protein_g * 0.9;
    const dayOk = calOk && protOk;

    if (dayOk) {
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
      
      if (lastDate) {
        const daysDiff = Math.round((new Date(lastDate) - new Date(date)) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 1) {
          currentStreak = tempStreak;
        } else {
          tempStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      lastDate = date;
    } else {
      tempStreak = 0;
    }
  }

  return { currentStreak, bestStreak };
}

// ─── SECCIÓN 3: Análisis nutricional ──────────────────────────────────────────
export function analyzeNutrition(data) {
  const { weekNutrition, goals } = data;
  
  const byDay = {};
  weekNutrition.forEach(l => {
    if (!byDay[l.logged_date]) byDay[l.logged_date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    byDay[l.logged_date].calories += l.calories || 0;
    byDay[l.logged_date].protein += l.protein_g || 0;
    byDay[l.logged_date].carbs += l.carbs_g || 0;
    byDay[l.logged_date].fat += l.fat_g || 0;
  });

  const days = Object.values(byDay);
  const daysCount = days.length || 1;
  
  const avgCalories = Math.round(days.reduce((a, d) => a + d.calories, 0) / daysCount);
  const avgProtein = Math.round(days.reduce((a, d) => a + d.protein, 0) / daysCount);
  
  const calGoal = goals.calories || 2000;
  const protGoal = goals.protein_g || 150;
  
  const daysCaloriesOk = days.filter(d => d.calories >= calGoal * 0.9 && d.calories <= calGoal * 1.1).length;
  const daysProteinOk = days.filter(d => d.protein >= protGoal * 0.9).length;

  const insights = [];
  if (daysProteinOk >= 6) insights.push(`Cumpliste tu objetivo de proteínas en ${daysProteinOk} de los últimos 7 días. Excelente constancia.`);
  else if (daysProteinOk < 4) insights.push(`Solo ${daysProteinOk} días cumpliendo proteína. Intenta priorizar fuentes proteicas.`);
  
  const calDiff = avgCalories - calGoal;
  if (Math.abs(calDiff) > 150) {
    insights.push(`Tu promedio calórico está ${Math.abs(calDiff)} kcal ${calDiff > 0 ? 'por encima' : 'por debajo'} del objetivo.`);
  } else {
    insights.push('Tu ingesta calórica está muy bien ajustada al objetivo.');
  }

  //  Calcular rachas
  const { currentStreak, bestStreak } = calculateStreak(weekNutrition, goals);

  return {
    avgCalories,
    avgProtein,
    daysCaloriesOk,
    daysProteinOk,
    totalDays: daysCount,
    calGoal,
    protGoal,
    insights: insights.slice(0, 3),
    currentStreak,
    bestStreak,
  };
}

// ─── SECCIÓN 4: Progreso físico ───────────────────────────────────────────────
export function analyzePhysicalProgress(data) {
  const { weightHistory } = data;
  if (weightHistory.length < 2) {
    return { hasData: false, insight: 'Registra tu peso regularmente para ver tu progreso.' };
  }

  const sorted = [...weightHistory].sort((a, b) => new Date(a.logged_date) - new Date(b.logged_date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const changeKg = (last.weight_kg || 0) - (first.weight_kg || 0);
  const daysDiff = Math.round((new Date(last.logged_date) - new Date(first.logged_date)) / (1000 * 60 * 60 * 24));

  let insight;
  if (Math.abs(changeKg) < 0.3) {
    insight = `Tu peso se ha mantenido estable en los últimos ${daysDiff} días.`;
  } else if (changeKg < 0) {
    insight = `Has perdido ${Math.abs(changeKg).toFixed(1)} kg durante los últimos ${daysDiff} días.`;
  } else {
    insight = `Has ganado ${changeKg.toFixed(1)} kg durante los últimos ${daysDiff} días.`;
  }

  return {
    hasData: true,
    currentWeight: last.weight_kg,
    startWeight: first.weight_kg,
    changeKg: changeKg.toFixed(1),
    daysDiff,
    insight,
  };
}

// ─── SECCIÓN 5: Récords ───────────────────────────────────────────────────────
// ─── SECCIÓN 5: Récords ───────────────────────────────────────────────────────
export function analyzeRecords(data) {
  const { records } = data || {};
  
  if (!records || records.length === 0) {
    return { 
      hasRecords: false, 
      recent: [], // <-- Agregado para evitar el error
      insights: ['Aún no tienes récords registrados. ¡Sigue entrenando!'] 
    };
  }

  const recent = records.slice(0, 3);
  const insights = recent.map(r => {
    const date = new Date(r.achieved_at).toLocaleDateString('es', { day: 'numeric', month: 'short' });
    return `Nuevo récord en ${r.exercise_name || 'ejercicio'}: ${r.weight_kg || 0} kg × ${r.reps || 0} reps (${date}).`;
  });

  // Mayor progreso (comparando PRs antiguos vs recientes)
  const byExercise = {};
  records.forEach(r => {
    if (!byExercise[r.exercise_name]) byExercise[r.exercise_name] = [];
    byExercise[r.exercise_name].push(r);
  });

  let bestProgress = null;
  Object.entries(byExercise).forEach(([name, recs]) => {
    if (recs.length >= 2) {
      const sorted = recs.sort((a, b) => new Date(a.achieved_at) - new Date(b.achieved_at));
      const progress = (sorted[sorted.length - 1].weight_kg || 0) - (sorted[0].weight_kg || 0);
      if (!bestProgress || progress > bestProgress.progress) {
        bestProgress = { name, progress };
      }
    }
  });

  return {
    hasRecords: true,
    recent: recent.map(r => ({
      exercise: r.exercise_name || 'Ejercicio',
      weight: r.weight_kg || 0,
      reps: r.reps || 0,
      date: new Date(r.achieved_at).toLocaleDateString('es', { day: 'numeric', month: 'short' }),
    })),
    bestProgress,
    insights,
  };
}

// ─── SECCIÓN 6: Recomendaciones inteligentes ──────────────────────────────────
export function generateRecommendations(data, analysis) {
  const recs = [];
  const { daily, training, nutrition, physical } = analysis;

  // Alta prioridad
  if (nutrition.avgProtein < (data.goals.protein_g || 150) * 0.8) {
    recs.push({
      priority: 'high',
      icon: '💪',
      text: 'Incrementa tu consumo de proteína. Apunta a 1.6-2.2 g por kg de peso corporal.',
    });
  }
  if (training.thisWeekSessions < 3) {
    recs.push({
      priority: 'high',
      icon: '🏋️',
      text: 'Entrena al menos 3 veces por semana para ver progreso consistente.',
    });
  }
  if (training.muscleGroups.piernas === 0 && training.thisWeekSessions > 0) {
    recs.push({
      priority: 'high',
      icon: '🦵',
      text: 'No olvides entrenar piernas. Son clave para fuerza y metabolismo.',
    });
  }

  // Media prioridad
  if (daily.proteinConsumed < daily.proteinGoal * 0.7 && new Date().getHours() < 18) {
    recs.push({
      priority: 'medium',
      icon: '🍳',
      text: 'Añade una fuente de proteína en tu próxima comida (huevo, pollo, yogur griego).',
    });
  }
  if (training.volumeChange > 20) {
    recs.push({
      priority: 'medium',
      icon: '⚠️',
      text: 'Aumentaste mucho el volumen. Considera una semana de descarga pronto.',
    });
  }
  if (training.muscleGroups.pecho > training.muscleGroups.espalda * 1.5) {
    recs.push({
      priority: 'medium',
      icon: '⚖️',
      text: 'Añade una serie extra de espalda para equilibrar con el pecho.',
    });
  }

  // Baja prioridad (bienestar)
  if (recs.length < 5) {
    recs.push({
      priority: 'low',
      icon: '😴',
      text: 'Duerme al menos 7-8 horas. El músculo crece mientras descansas.',
    });
  }
  if (recs.length < 5 && physical.hasData && physical.changeKg < 0) {
    recs.push({
      priority: 'low',
      icon: '✓',
      text: 'Vas bien con el déficit. Mantén la constancia, los resultados llegan.',
    });
  }
  if (recs.length < 5) {
    recs.push({
      priority: 'low',
      icon: '💧',
      text: 'Hidrátate: 35 ml de agua por cada kg de peso corporal.',
    });
  }

  return recs.slice(0, 5);
}

// ─── SECCIÓN 7: Frases motivacionales ─────────────────────────────────────────
const MOTIVATIONAL_QUOTES = [
  "Los resultados vienen de la constancia, no de la perfección.",
  "El dolor que sientes hoy será la fuerza que sentirás mañana.",
  "No cuentes los días, haz que los días cuenten.",
  "Tu único límite eres tú mismo.",
  "Cada repetición te acerca a tu mejor versión.",
  "La disciplina es el puente entre metas y logros.",
  "El éxito no es definitivo, el fracaso no es fatal: lo que cuenta es el coraje para continuar.",
  "Los ganadores no nacen, se hacen.",
  "Sé más fuerte que tus excusas.",
  "El cuerpo logra lo que la mente cree.",
  "Hoy es un buen día para tener un gran entrenamiento.",
  "No hay atajos, solo trabajo duro.",
  "La diferencia entre lo imposible y lo posible está en la determinación.",
  "Cada experto fue una vez un principiante.",
  "Tu competencia más difícil es la persona que eras ayer.",
  "El sudor de hoy es la victoria de mañana.",
  "No te detengas cuando estés cansado, detente cuando hayas terminado.",
  "La fuerza no viene de lo que puedes hacer, viene de superar lo que creías que no podías.",
  "Un entrenamiento más, una excusa menos.",
  "Los resultados toman tiempo, pero llegan.",
  "Convierte tu 'no puedo' en 'todavía no puedo'.",
  "La motivación te pone en marcha, el hábito te mantiene.",
  "No hay días malos, solo días de entrenamiento.",
  "Cree en ti mismo y en todo lo que eres.",
  "La única mala sesión es la que no se hizo.",
  "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
  "Sé la versión más fuerte de ti mismo.",
  "El dolor es temporal, el orgullo es para siempre.",
  "Hoy es el día para construir el mañana.",
  "La constancia vence al talento cuando el talento no es constante.",
  "Cada día es una nueva oportunidad para superarte.",
];

export function getDailyQuote() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}

// ─── Análisis completo ────────────────────────────────────────────────────────
export async function runFullAnalysis(userId) {
  const data = await loadAllCoachData(userId);
  if (!data) return null;

  const daily = analyzeDailySummary(data);
  const training = analyzeTraining(data);
  const nutrition = analyzeNutrition(data);
  const physical = analyzePhysicalProgress(data);
  const records = analyzeRecords(data);
  const recommendations = generateRecommendations(data, { daily, training, nutrition, physical });
  const quote = getDailyQuote();

  return { data, daily, training, nutrition, physical, records, recommendations, quote };
}

// ─── Contexto para el chat IA ─────────────────────────────────────────────────
// ─── Contexto para el chat IA ─────────────────────────────────────────────────
// ─── Contexto para el chat IA (Versión Premium) ───────────────────────────────
export function buildUserContextForChat(analysis) {
  if (!analysis) return "No hay datos de análisis disponibles.";
  
  const { data, daily, training, nutrition, physical, records } = analysis;
  const profile = data.profile || {};
  
  const recentRecords = records?.recent || [];
  const recordsText = recentRecords.length > 0 
    ? recentRecords.slice(0, 3).map(r => `${r.exercise} (${r.weight}kg x ${r.reps})`).join(', ') 
    : 'Aún no tienes récords registrados.';

  return `
CONTEXTO DEL ATLETA:
- Nombre: ${profile.full_name || 'Atleta'}
- Objetivo principal: ${profile.goal || 'Mejorar condición física'}
- Peso actual: ${physical?.currentWeight ? physical.currentWeight + ' kg' : 'No registrado'}
- Meta calórica: ${data?.goals?.calories || 2000} kcal | Meta de proteína: ${data?.goals?.protein_g || 150} g
- Consumo HOY: ${daily?.caloriesConsumed || 0} kcal, ${daily?.proteinConsumed || 0} g proteína
- Entrenamientos esta semana: ${training?.thisWeekSessions || 0}
- Cambio de volumen vs semana pasada: ${training?.volumeChange || 0}%
- Promedio últimos 7 días: ${nutrition?.avgCalories || 0} kcal, ${nutrition?.avgProtein || 0} g proteína
- Días cumpliendo proteína: ${nutrition?.daysProteinOk || 0} de 7
- Récords recientes: ${recordsText}

INSTRUCCIONES DE RESPUESTA:
1. Habla en primera persona, como su entrenador personal de confianza. Usa su nombre.
2. Sé directo, motivador y basate 100% en los datos de arriba. NUNCA des consejos genéricos.
3. Si pregunta sobre peso/rutina, menciona sus números reales (ej: "Vi que tu volumen subió un 12%...").
4. Mantén las respuestas entre 3 y 5 frases. Usa 1 o 2 emojis máximo para dar energía, no satures.
5. Si el usuario tiene un objetivo de "Perder grasa", enfócate en el déficit y la proteína. Si es "Ganar masa", enfócate en el superávit y la sobrecarga progresiva.
`.trim();
}