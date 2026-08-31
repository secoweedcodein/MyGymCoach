import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// FIX SEGURIDAD (IDOR): el userId se deriva del JWT del llamador y se consulta
// con un cliente enmarcado en ese token (RLS restringe a sus propios datos).
// Antes se aceptaba un userId del body y se consultaba con SERVICE_ROLE_KEY,
// permitiendo a cualquier usuario leer los entrenamientos de cualquier otro.
serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    // Obtener últimas 3 semanas de entrenamientos
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);

    const { data: sessions, error: sessionsError } = await supabase
      .from('workout_sessions')
      .select(`
        *,
        workout_sets (*)
      `)
      .eq('user_id', userId)
      .gte('started_at', threeWeeksAgo.toISOString())
      .order('started_at', { ascending: false });

    if (sessionsError) {
      return new Response(
        JSON.stringify({ error: sessionsError.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!sessions || sessions.length === 0) {
      return new Response(
        JSON.stringify({ 
          suggestions: ['¡Empieza tu primera sesión esta semana! 💪'] 
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Analizar estancamiento por ejercicio
    const exerciseProgress = {};
    sessions.forEach(session => {
      (session.workout_sets || []).forEach(set => {
        if (!exerciseProgress[set.exercise_name]) {
          exerciseProgress[set.exercise_name] = [];
        }
        exerciseProgress[set.exercise_name].push({
          weight: set.weight_kg,
          reps: set.reps,
          date: session.started_at
        });
      });
    });

    const suggestions = [];

    // Detectar estancamiento
    Object.entries(exerciseProgress).forEach(([exercise, sets]) => {
      if (sets.length < 3) return;
      
      const sorted = sets.sort((a, b) => new Date(a.date) - new Date(b.date));
      const recent = sorted.slice(-3);
      const older = sorted.slice(0, 3);
      
      const recentAvg = recent.reduce((sum, s) => sum + (s.weight * s.reps), 0) / recent.length;
      const olderAvg = older.reduce((sum, s) => sum + (s.weight * s.reps), 0) / older.length;

      if (Math.abs(recentAvg - olderAvg) < olderAvg * 0.05) {
        suggestions.push(`🔄 Estancamiento detectado en ${exercise}. Considera reducir 10% la carga o cambiar el rango de repeticiones.`);
      }
    });

    // Sugerencia de volumen
    const totalVolume = sessions.reduce((sum, s) => 
      sum + (s.workout_sets || []).reduce((v, set) => v + (set.weight_kg * set.reps), 0), 0
    );
    
    if (totalVolume < 10000) {
      suggestions.push(`📈 Tu volumen total es de ${Math.round(totalVolume)}kg. Intenta llegar a 15,000kg esta semana para mejores resultados.`);
    }

    if (suggestions.length === 0) {
      suggestions.push('✅ ¡Excelente progreso! Mantén esta consistencia.');
    }

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});