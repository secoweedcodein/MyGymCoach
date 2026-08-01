import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verificar variables de entorno
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')
    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Faltan variables de entorno de Supabase')
    }
    if (!openaiKey) {
      throw new Error('Falta la variable de entorno OPENAI_API_KEY. Configúrala con: supabase secrets set OPENAI_API_KEY="tu-clave"')
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    })

    // 2. Autenticar usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('No autorizado: Debes iniciar sesión')
    }
    const userId = user.id

    // 3. Leer datos de la petición
    const body = await req.json()
    const { messages, userContext } = body
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Datos inválidos: se requiere un array de messages')
    }

    // 4. Verificar límite de uso (OPCIONAL: Si la tabla no existe, no falla el chat)
    let usageCount = 0
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data: usage } = await supabase
        .from('ai_usage')
        .select('messages_count')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle()

      if (usage && usage.messages_count >= 20) {
        throw new Error('Has alcanzado el límite de 20 mensajes por día. Vuelve mañana.')
      }
      usageCount = usage?.messages_count || 0
    } catch (limitError) {
      console.warn('⚠️ No se pudo verificar el límite de uso (¿existe la tabla ai_usage?):', limitError.message)
      // Continuamos, no bloqueamos el chat por esto
    }

    // 5. Prompt del sistema premium
    const systemPrompt = `Eres el Coach IA de MyGymCoach, un entrenador personal de élite, experto en biomecánica y nutrición deportiva. 
Tu tono es profesional, directo, empático y altamente motivador. 
Tu única fuente de verdad son los datos del "CONTEXTO DEL ATLETA" que te proporcionan. 
Nunca inventes datos. Si no hay datos sobre un tema, dilo con naturalidad y sugiere cómo empezar a medirlo.
Sé conciso (máximo 4-5 frases). Usa formato claro. Tu objetivo es que el atleta sienta que tiene a un profesional analizando su progreso en tiempo real.

CONTEXTO DEL ATLETA:
${userContext || 'No se proporcionó contexto adicional.'}
`

    // 6. Llamar a OpenAI
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
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `Error de OpenAI: ${openaiResponse.status}`)
    }

    const openaiData = await openaiResponse.json()
    const reply = openaiData.choices[0]?.message?.content || 'No pude procesar tu mensaje.'

    // 7. Incrementar contador (OPCIONAL: Si falla, no rompe el chat)
    try {
      const today = new Date().toISOString().split('T')[0]
      await supabase.from('ai_usage').upsert({
        user_id: userId,
        date: today,
        messages_count: usageCount + 1,
      }, { onConflict: 'user_id,date' })
    } catch (upsertError) {
      console.warn('⚠️ No se pudo guardar el contador de uso:', upsertError.message)
    }

    // 8. Respuesta exitosa
    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error en coach-chat:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno del servidor' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})