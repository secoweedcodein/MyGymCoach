// services/recipeGenerator.js
// Generación de recetas por IA a través de la Edge Function "generate-recipe".
// La clave de OpenAI nunca está en el cliente; el userId sale del JWT en el servidor.
import { supabase } from '../lib/supabase';

export async function generateRecipe({ prompt, category }) {
  if (!prompt || !prompt.trim()) {
    throw new Error('Escribe qué tipo de receta quieres generar.');
  }

  const { data, error } = await supabase.functions.invoke('generate-recipe', {
    body: { prompt: prompt.trim(), category: category || undefined },
  });

  if (error) {
    // Quota / server_config llegan como FunctionInvokeError con .context.
    const serverCode = error.context?.code || (data?.code);
    const message = data?.error || error.message || 'Error del servidor';
    const thrown = new Error(message);
    thrown.code = serverCode;
    if (serverCode === 'quota') thrown.quota = true;
    throw thrown;
  }

  if (data?.error) {
    const thrown = new Error(data.error);
    thrown.code = data.code;
    if (data.code === 'quota') thrown.quota = true;
    throw thrown;
  }

  if (!data?.recipe) {
    throw new Error('El servidor no devolvió una receta.');
  }

  return {
    recipe: data.recipe,
    usage: data.usage || null,
  };
}