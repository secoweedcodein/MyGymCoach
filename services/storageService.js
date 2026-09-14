import { supabase } from '../lib/supabase';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
export const BUCKET = 'mygymcoach-images';

function extFromMime(mime) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

function uniqueName(folder, mime) {
  const rand = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  return `${folder}/${rand}.${extFromMime(mime)}`;
}

export function validateImageMeta({ mime, size }) {
  if (!ALLOWED_MIME.includes(mime)) {
    const err = new Error('Formato no permitido. Usa JPG, PNG o WebP.');
    err.code = 'storage';
    throw err;
  }
  if (size > MAX_IMAGE_BYTES) {
    const err = new Error('La imagen supera el límite de 5 MB.');
    err.code = 'storage';
    throw err;
  }
}

export async function uploadExploreImage(uri, { folder } = {}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const err = new Error('Debes iniciar sesión');
    err.code = '401';
    throw err;
  }

  const response = await fetch(uri);
  const blob = await response.blob();
  const mime = blob.type || 'image/jpeg';
  validateImageMeta({ mime, size: blob.size });

  const path = uniqueName(folder || `users/${user.id}`, mime);
  const { data, error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: mime,
    upsert: false,
  });
  if (error) throw error;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}
