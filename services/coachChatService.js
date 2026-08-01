// src/services/coachChatService.js
/**
 * Servicio de chat con IA.
 * Preparado para OpenAI. Reemplaza la URL y API key según tu proveedor.
 * 
 * OPCIÓN RECOMENDADA: Crear un Edge Function en Supabase que haga de proxy
 * para no exponer la API key en el cliente.
 */
import { supabase } from '../lib/supabase';



const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
// ⚠️ En producción, usa un Edge Function de Supabase como proxy
// En desarrollo puedes poner la key aquí temporalmente
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
const MODEL = 'gpt-4o-mini'; // Más barato y rápido, suficiente para coaching

export async function sendMessageToCoach(messages, userContext) {
  try {
    // Llamar al Edge Function (Supabase agrega el auth token automáticamente)
    const { data, error } = await supabase.functions.invoke('coach-chat', {
      body: {
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        userContext: userContext || '',
      },
    });

    if (error) {
      console.error('[coachChat] Error de Supabase:', error);
      throw new Error(error.message || 'Error del servidor');
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data?.reply || 'No pude procesar tu mensaje.';
  } catch (err) {
    console.error('[coachChat] Error:', err);
    // Fallback inteligente sin IA
    return generateRuleBasedResponse(
      messages[messages.length - 1].content, 
      userContext
    );
  }
}

// ─── Fallback basado en reglas (funciona sin API key) ─────────────────────────
function generateRuleBasedResponse(question, context) {
  const q = question.toLowerCase();
  
  const proteinMatch = context.match(/Promedio proteína.*?(\d+) g/);
  const avgProtein = proteinMatch ? parseInt(proteinMatch[1]) : 0;
  const calMatch = context.match(/Promedio calórico.*?(\d+) kcal/);
  const avgCal = calMatch ? parseInt(calMatch[1]) : 0;
  const goalCalMatch = context.match(/Objetivo calórico.*?(\d+) kcal/);
  const goalCal = goalCalMatch ? parseInt(goalCalMatch[1]) : 2000;

  if (/prote[ií]na|prote/.test(q)) {
    if (avgProtein < 120) {
      return `💪 Tus números muestran que promedias ${avgProtein}g de proteína. Está por debajo del óptimo. Añade una fuente proteica en cada comida: huevos en el desayuno, pollo/pescado en almuerzo y cena, yogur griego como snack.`;
    }
    return `✅ Vas bien con la proteína (${avgProtein}g promedio). Mantén ese nivel para maximizar la síntesis muscular.`;
  }

  if (/peso|bajar|perder|adelgazar/.test(q)) {
    const diff = avgCal - goalCal;
    if (Math.abs(diff) < 100) {
      return `⚖️ Tu promedio calórico está muy cerca del objetivo (${avgCal} vs ${goalCal}). Si el peso no baja, revisa: 1) ¿Estás contando todo lo que comes? 2) ¿Descansas bien? 3) ¿Tu gasto calórico real es el esperado?`;
    }
    if (diff > 200) {
      return `📊 Estás comiendo ${diff} kcal sobre tu objetivo. Eso explica que el peso no baje. Reduce porciones o aumenta actividad.`;
    }
    return `🔥 Estás en déficit de ${Math.abs(diff)} kcal. Si el peso no baja en 2 semanas, podrías necesitar ajustar el cálculo del gasto.`;
  }

  if (/rutina|entrenamiento|entreno/.test(q)) {
    const sessionsMatch = context.match(/Entrenamientos esta semana: (\d+)/);
    const sessions = sessionsMatch ? parseInt(sessionsMatch[1]) : 0;
    if (sessions < 3) {
      return `🏋️ Solo entrenaste ${sessions} veces esta semana. Para progreso óptimo apunta a 3-4 sesiones. Prioriza ejercicios compuestos: sentadilla, peso muerto, press, dominadas, remo.`;
    }
    return `💪 Llevas ${sessions} entrenamientos esta semana, buen ritmo. Enfócate en sobrecarga progresiva: más peso, más reps o mejor técnica cada semana.`;
  }

  if (/motivaci|ánimo|animo|no puedo|difícil/.test(q)) {
    return `🔥 Recuerda: los resultados vienen de la constancia, no de la perfección. Cada sesión que completas te acerca a tu mejor versión. Hoy es un buen día para dar un paso más.`;
  }

  return `🤔 Basándome en tus datos, te recomiendo enfocarte en lo básico: entrenar 3-4 veces por semana, comer suficiente proteína (1.6-2.2 g/kg), dormir 7-8 horas y ser constante. ¿Quieres que profundice en algún aspecto específico?`;
}