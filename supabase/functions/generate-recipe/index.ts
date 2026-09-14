import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DAILY_LIMIT = 10    // generaciones de receta por día
const MAX_PROMPT = 1000

class HttpError extends Error {
  constructor(message, status = 400, code = 'error') {
    super(message)
    this.status = status
    this.code = code
  }
}

// Coerción defensiva del JSON que devuelve el modelo.
function normalizeRecipe(raw, categoryHint) {
  const r = raw && typeof raw === 'object' ? raw : {}
  const toNum = v => {
    const n = Number(v)
    return Number.isFinite(n) ? Math.round(n) : 0
  }

  const ingredients = Array.isArray(r.ingredients)
    ? r.ingredients
        .map(i => (typeof i === 'string' ? { name: i, amount: '' } : i))
        .filter(i => i && typeof i.name === 'string' && i.name.trim())
        .slice(0, 20)
        .map(i => ({ name: String(i.name).trim().slice(0, 100), amount: String(i.amount ?? '').trim().slice(0, 50) }))
    : []

  const instructions = Array.isArray(r.instructions)
    ? r.instructions.map(s => String(s ?? '').trim()).filter(Boolean).slice(0, 12)
    : []

  const tags = Array.isArray(r.tags)
    ? r.tags.map(t => String(t ?? '').trim()).filter(Boolean).slice(0, 8)
    : []

  return {
    name: String(r.name ?? '').trim().slice(0, 120),
    subtitle: String(r.subtitle ?? '').trim().slice(0, 200),
    category: String(r.category || categoryHint || 'Almuerzo').trim().slice(0, 40),
    time: String(r.time ?? '').trim().slice(0, 20),
    calories: toNum(r.calories),
    protein: toNum(r.protein),
    carbs: toNum(r.carbs),
    fat: toNum(r.fat),
    tags,
    ingredients,
    instructions,
  }
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
    // 1. Autenticación JWT (userId desde el token).
    const { data: { user }, error: authError } = await client.auth.getUser()
    if (authError || !user) {
      throw new HttpError('No autorizado: debes iniciar sesión.', 401, 'unauthorized')
    }
    const userId = user.id

    // 2. Entrada validada.
    const body = await req.json().catch(() => ({}))
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, MAX_PROMPT) : ''
    if (!prompt) {
      throw new HttpError('Datos inválidos: se requiere un prompt.', 400, 'bad_request')
    }
    const categoryHint = typeof body.category === 'string' ? body.category.trim() : ''

    let dieticianContext = ''
    try {
      // Contexto opcional del usuario (macros objetivo) para que las recetas
      // de coach-chat/recetas encajen con sus metas. Nunca datos sensibles.
      const goalsRes = await client.from('nutrition_goals').select('calories, protein_g, carbs_g, fat_g').eq('user_id', userId).maybeSingle()
      const profileRes = await client.from('user_profiles').select('goal, weight_kg').eq('id', userId).maybeSingle()
      const g = goalsRes.data || {}
      const p = profileRes.data || {}
      if (g.calories || g.protein_g) {
        dieticianContext = `Objetivo diario del usuario: ${g.calories || '?'} kcal, ${g.protein_g || '?'}g proteína, ${g.carbs_g || '?'}g carbos, ${g.fat_g || '?'}g grasas. Objetivo de composición: ${p.goal || 'No especificado'}, peso ${p.weight_kg || '?'} kg.`
      }
    } catch {
      dieticianContext = ''
    }

    // 3. Límite atómico no fail-open (comparte el contador diario de IA).
    const usageResult = await client.rpc('increment_ai_usage', { p_limit: DAILY_LIMIT })
    if (usageResult.error) {
      const msg = String(usageResult.error.message || usageResult.error)
      if (msg.includes('límite')) {
        throw new HttpError(msg, 429, 'quota')
      }
      throw new HttpError('No se pudo validar el uso de IA. Intenta de nuevo.', 500, 'usage_failed')
    }

    // 4. Prompt del sistema: exige JSON estructurado.
    const systemPrompt = `Eres un chef deportivo del equipo MyGymCoach. Creas recetas saludables, asequibles y con macros controlados.
${dieticianContext}
Genera UNA receta completa en formato JSON estricto (sin markdown, sin texto fuera del JSON) con este esquema:
{
  "name": "Nombre atractivo",
  "subtitle": "Frase de 1 línea",
  "category": "${categoryHint || 'Almuerzo'}",
  "time": "25 min",
  "calories": 480,
  "protein": 42,
  "carbs": 55,
  "fat": 12,
  "tags": ["alto en proteína"],
  "ingredients": [{"name": "Ingrediente", "amount": "200 g"}],
  "instructions": ["Paso 1...", "Paso 2..."]
}
Reglas: kcal/macros por porción; proteína coherente con el objetivo del usuario si existe; 3-8 pasos; ingredientes reales con cantidades; en español; no uses imágenes ni urls.`

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
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 800,
        user: userId,
      }),
    })

    if (!openaiResponse.ok) {
      await client.rpc('decrement_ai_usage').catch(() => {})
      const errorData = await openaiResponse.json().catch(() => ({}))
      throw new HttpError(
        errorData.error?.message || `Error de OpenAI: ${openaiResponse.status}`,
        openaiResponse.status === 429 ? 429 : 502,
        'openai',
      )
    }

    const openaiData = await openaiResponse.json()
    const content = openaiData.choices?.[0]?.message?.content || '{}'
    let parsed
    try {
      const match = content.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(match ? match[0] : content)
    } catch {
      // Si el modelo no devuelve JSON limpio, reembolsamos el turno consumido.
      await client.rpc('decrement_ai_usage').catch(() => {})
      throw new HttpError('La IA no devolvió un formato válido. Inténtalo de nuevo.', 502, 'parse')
    }

    const recipe = normalizeRecipe(parsed, categoryHint)
    if (!recipe.name || recipe.ingredients.length === 0 || recipe.instructions.length === 0) {
      await client.rpc('decrement_ai_usage').catch(() => {})
      throw new HttpError('La IA devolvió una receta incompleta. Inténtalo de nuevo.', 502, 'incomplete')
    }

    // 5. Respuesta.
    return new Response(
      JSON.stringify({ recipe, usage: { used: usageResult.data ?? 0, dailyLimit: DAILY_LIMIT } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('❌ Error en generate-recipe:', error)
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