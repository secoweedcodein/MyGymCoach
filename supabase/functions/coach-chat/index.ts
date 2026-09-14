import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DAILY_LIMIT = 20
const MAX_MESSAGES = 12       // última ventana de contexto enviada a OpenAI
const MAX_CONTENT = 2000      // caracteres por mensaje
const ALLOWED_ROLES = new Set(['user', 'assistant'])

// ─── Saneado del array de mensajes ────────────────────────────────────────────
// Defensa en profundidad: el cliente nunca manda el rol system (lo establece el
// servidor), se truncan longitudes y se eliminan mensajes vacíos.
function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(m => m && typeof m === 'object')
    .map(m => ({
      role: ALLOWED_ROLES.has(m.role) ? m.role : 'user',
      content: typeof m.content === 'string' ? m.content.trim().slice(0, MAX_CONTENT) : '',
    }))
    .filter(m => m.content.length > 0)
    .slice(-MAX_MESSAGES)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const client = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_ANON_KEY') || '',
    { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } },
  )

  try {
    // 1. Autenticación (JWT): el userId se deriva del token, nunca del cuerpo.
    const { data: { user }, error: authError } = await client.auth.getUser()
    if (authError || !user) {
      throw new HttpError('No autorizado: debes iniciar sesión.', 401, 'unauthorized')
    }
    const userId = user.id

    // 2. Leer y sanear la petición.
    const body = await req.json().catch(() => ({}))
    const messages = sanitizeMessages(body.messages)
    if (messages.length === 0) {
      throw new HttpError('Datos inválidos: no se recibieron mensajes.', 400, 'bad_request')
    }
    const userContext = typeof body.userContext === 'string'
      ? body.userContext.trim().slice(0, 4000)
      : ''

    // 3. Límite diario ATÓMICO y no fail-open: se reserva el turno antes de
    //    gastar recursos. increment_ai_usage lanza excepción si se supera el
    //    límite (SECURITY DEFINER; única vía de escritura de ai_usage).
    const usageResult = await client.rpc('increment_ai_usage', { p_limit: DAILY_LIMIT })
    if (usageResult.error) {
      const msg = String(usageResult.error.message || usageResult.error)
      if (msg.includes('límite')) {
        throw new HttpError(msg, 429, 'quota')
      }
      throw new HttpError('No se pudo validar el uso de IA. Intenta de nuevo.', 500, 'usage_failed')
    }
    const usageCount = usageResult.data

    // 4. Prompt del sistema (content-based guidance; los datos duros vienen en
    //    el contexto construido en el cliente desde fuentes reales).
    const systemPrompt = `Eres el Coach IA de MyGymCoach, un entrenador personal de élite, experto en biomecánica y nutrición deportiva.
Tu tono es profesional, directo, empático y altamente motivador.
Tu única fuente de verdad son los datos del "CONTEXTO DEL ATLETA" que te proporcionan.
Nunca inventes datos. Si no hay datos sobre un tema, dilo con naturalidad y sugiere cómo empezar a medirlo.
Sé conciso (máximo 4-5 frases). Usa 1 o 2 emojis como máximo.
Nunca des consejos médicos ("consulta médico" si el tema pide evaluación clínica).
No proporciones recetas de preparación ni suplementos dudosos; apóyate en alimentación y entrenamiento comprobados.

CONTEXTO DEL ATLETA:
${userContext || 'No se proporcionó contexto adicional.'}`

    // 5. Llamada a OpenAI (clave solo en el servidor).
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) {
      throw new HttpError('Coach IA sin configurar en el servidor.', 503, 'server_config')
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 300,
        user: userId,
      }),
    })

    if (!openaiResponse.ok) {
      // Reembolsar el turno consumido: falló el proveedor, no el usuario.
      await client.rpc('decrement_ai_usage').catch(() => {})
      const errorData = await openaiResponse.json().catch(() => ({}))
      throw new HttpError(
        errorData.error?.message || `Error de OpenAI: ${openaiResponse.status}`,
        openaiResponse.status === 429 ? 429 : 502,
        'openai',
      )
    }

    const openaiData = await openaiResponse.json()
    const reply = openaiData.choices?.[0]?.message?.content?.trim() || 'No pude procesar tu mensaje.'

    // 6. Respuesta exitosa (incluye uso restante para la UI).
    return new Response(
      JSON.stringify({ reply, usage: { used: usageCount ?? 0, dailyLimit: DAILY_LIMIT } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('❌ Error en coach-chat:', error)
    if (error instanceof HttpError) {
      return new Response(
        JSON.stringify({ error: error.message, code: error.code }),
        { status: error.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor', code: 'internal' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})

class HttpError extends Error {
  constructor(message, status = 400, code = 'error') {
    super(message)
    this.status = status
    this.code = code
  }
}