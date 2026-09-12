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