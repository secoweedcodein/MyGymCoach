import { supabase } from '../lib/supabase';

// ═══════════════════════════════════════════════════════════════
// RUTINAS PÚBLICAS
// ═══════════════════════════════════════════════════════════════

export const getAllPublicRoutines = async () => {
  const { data, error } = await supabase
    .from('public_routines')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

export const createPublicRoutine = async (routineData) => {
  const { data, error } = await supabase
    .from('public_routines')
    .insert(routineData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updatePublicRoutine = async (id, updates) => {
  const { data, error } = await supabase
    .from('public_routines')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deletePublicRoutine = async (id) => {
  const { error } = await supabase
    .from('public_routines')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

// ═══════════════════════════════════════════════════════════════
// RETOS (Challenges)
// ═══════════════════════════════════════════════════════════════

export const listChallenges = async ({ officialOnly = true } = {}) => {
  let query = supabase.from('challenges').select('*').order('created_at', { ascending: false });
  if (officialOnly) query = query.eq('is_official', true);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const getChallenge = async (id) => {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

export const createChallenge = async (payload) => {
  const { data, error } = await supabase
    .from('challenges')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateChallenge = async (id, updates) => {
  const { data, error } = await supabase
    .from('challenges')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteChallenge = async (id) => {
  const { error } = await supabase
    .from('challenges')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
};

export const deleteFeaturedByTarget = async (targetId) => {
  const { error } = await supabase
    .from('featured_content')
    .delete()
    .eq('target_id', targetId);
  if (error) throw error;
  return true;
};

// ═══════════════════════════════════════════════════════════════
// CONTENIDO DESTACADO (Featured Content)
// ═══════════════════════════════════════════════════════════════

export const getFeaturedContent = async () => {
  const { data, error } = await supabase
    .from('featured_content')
    .select('*')
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
};

async function fetchAdminRecord(table, id) {
  const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

async function listAdminRecords(table, orderColumn, ascending = false) {
  const { data, error } = await supabase.from(table).select('*').order(orderColumn, { ascending });
  if (error) throw error;
  return data || [];
}

async function deleteAdminRecord(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

async function saveAdminRecord(table, id, payload) {
  const result = id
    ? await supabase.from(table).update(payload).eq('id', id)
    : await supabase.from(table).insert(payload);
  if (result.error) throw result.error;
}

export const listAdminArticles = () => listAdminRecords('articles', 'created_at');
export const deleteAdminArticle = (id) => deleteAdminRecord('articles', id);
export const listAdminRecipes = () => listAdminRecords('recipes_ia', 'created_at');
export const deleteAdminRecipe = (id) => deleteAdminRecord('recipes_ia', id);
export const listAdminTrends = () => listAdminRecords('trends', 'position', true);
export const deleteAdminTrend = (id) => deleteAdminRecord('trends', id);
export const updateAdminTrend = (id, updates) => saveAdminRecord('trends', id, updates);

export const getAdminArticle = (id) => fetchAdminRecord('articles', id);
export const saveAdminArticle = (id, payload) => saveAdminRecord('articles', id, payload);
export const getAdminRecipe = (id) => fetchAdminRecord('recipes_ia', id);
export const saveAdminRecipe = (id, payload) => saveAdminRecord('recipes_ia', id, payload);
export const getAdminTrend = (id) => fetchAdminRecord('trends', id);
export const saveAdminTrend = (id, payload) => saveAdminRecord('trends', id, payload);
export const createAdminArticle = (payload) => createAdminRecord('articles', payload);
export const createAdminRecipe = (payload) => createAdminRecord('recipes_ia', payload);

async function createAdminRecord(table, payload) {
  const { data, error } = await supabase.from(table).insert(payload).select('id').single();
  if (error) throw error;
  return data;
}

export const upsertFeaturedContent = async (contentData) => {
  const { data, error } = await supabase
    .from('featured_content')
    .upsert(contentData, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const createFeaturedContent = async (contentData) => {
  const { error } = await supabase
    .from('featured_content')
    .insert(contentData);
  if (error) throw error;
  return contentData;
};

export const updateFeaturedContent = async (id, updates) => {
  const { data, error } = await supabase
    .from('featured_content')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteFeaturedContent = async (id) => {
  const { error } = await supabase
    .from('featured_content')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

// ═══════════════════════════════════════════════════════════════
// SUBIDA DE IMÁGENES (Storage)
// ═══════════════════════════════════════════════════════════════

export const uploadImage = async (uri, folder = 'public') => {
  try {
    // Convertir URI a blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Nombre único
    const ext = uri.split('.').pop() || 'jpg';
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    
    const { data, error } = await supabase.storage
      .from('mygymcoach-images')
      .upload(fileName, blob, {
        contentType: blob.type,
        upsert: false,
      });
    
    if (error) throw error;
    
    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('mygymcoach-images')
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};