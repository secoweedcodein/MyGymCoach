import { supabase } from '../lib/supabase';
import { isValidScore } from '../lib/ratings';
import { logger } from '../lib/logger';

export async function rateContent(contentType, contentId, score) {
  if (!isValidScore(score)) {
    throw new Error('La valoración debe estar entre 1 y 5');
  }
  const { data, error } = await supabase.rpc('rate_content', {
    p_type: contentType,
    p_id: contentId,
    p_score: score,
  });
  if (error) {
    logger.warn('rating.failed', { contentType, code: error.code });
    throw error;
  }
  const row = Array.isArray(data) ? data[0] : data;
  return row || { rating_avg: score, rating_count: 1 };
}

export async function recordView(contentType, contentId) {
  const { data, error } = await supabase.rpc('record_content_view', {
    p_type: contentType,
    p_id: contentId,
  });
  if (error) {
    logger.warn('view.failed', { contentType, code: error.code });
    return 0;
  }
  return data || 0;
}

export async function toggleLike(contentType, contentId) {
  const { data, error } = await supabase.rpc('toggle_content_like', {
    p_type: contentType,
    p_id: contentId,
  });
  if (error) throw error;
  return data === true;
}

export async function toggleFavorite(contentType, contentId) {
  const { data, error } = await supabase.rpc('toggle_content_favorite', {
    p_type: contentType,
    p_id: contentId,
  });
  if (error) throw error;
  return data === true;
}

export async function joinChallenge(challengeId) {
  const { data, error } = await supabase.rpc('join_challenge', {
    p_challenge_id: challengeId,
  });
  if (error) throw error;
  return data || 0;
}

export async function getMyRating(contentType, contentId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('content_ratings')
    .select('score')
    .eq('user_id', user.id)
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .maybeSingle();
  if (error) return null;
  return data?.score ?? null;
}
