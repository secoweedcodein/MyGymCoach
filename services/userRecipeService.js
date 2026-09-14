import { supabase } from '../lib/supabase';
import { invalidateExploreCache } from './exploreService';
import { uploadExploreImage } from './storageService';

function splitLines(value) {
  if (Array.isArray(value)) return value;
  return String(value || '')
    .split(/\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function toPayload(form, user) {
  const author = (form.author_name || '').trim() || user.email?.split('@')[0] || 'Usuario';
  return {
    user_id: user.id,
    author_name: author,
    recipe_name: form.recipe_name.trim(),
    description: form.description?.trim() || null,
    calories: parseInt(form.calories, 10),
    protein: Number(form.protein),
    carbs: Number(form.carbs),
    fat: Number(form.fat),
    carbs_g: Number(form.carbs),
    fat_g: Number(form.fat),
    time: form.time.trim(),
    ingredients: splitLines(form.ingredients),
    instructions: splitLines(form.steps),
    steps: form.steps?.trim() || null,
    image_url: form.image_url || null,
    status: 'pending',
  };
}

export async function submitUserRecipe(form) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes iniciar sesión');
  const { data, error } = await supabase
    .from('user_recipes')
    .insert(toPayload(form, user))
    .select('id,status')
    .single();
  if (error) throw error;
  invalidateExploreCache();
  return data;
}

export async function updateOwnUserRecipe(id, form) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes iniciar sesión');
  const payload = toPayload(form, user);
  delete payload.user_id;
  const { data, error } = await supabase
    .from('user_recipes')
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id,status')
    .single();
  if (error) throw error;
  invalidateExploreCache();
  return data;
}

export async function deleteOwnUserRecipe(id) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes iniciar sesión');
  const { error } = await supabase
    .from('user_recipes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
  if (error) throw error;
  invalidateExploreCache();
  return true;
}

export async function listMyUserRecipes() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('user_recipes')
    .select('id,recipe_name,status,calories,protein,time,created_at,image_url')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function moderateUserRecipe(id, status) {
  const { data, error } = await supabase.rpc('moderate_user_recipe', {
    p_id: id,
    p_status: status,
  });
  if (error) throw error;
  invalidateExploreCache();
  return data;
}

export async function attachRecipeImage(uri) {
  return uploadExploreImage(uri);
}
