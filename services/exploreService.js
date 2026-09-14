import { supabase } from '../lib/supabase';
import { cacheGet, cacheSet, cacheClear } from '../lib/cache';
import { formatRating, clampRating } from '../lib/ratings';
import { logger } from '../lib/logger';
import { withTimeout } from '../lib/errors';

const PAGE = 20;
const HOME_LIMIT = 8;
const STABLE_TTL = 60_000;

const TREND_COLS = 'id,title,subtitle,description,image_id,image_url,level,rating,rating_avg,rating_count,views_count,badge,route,position,is_active,users';
const ROUTINE_COLS = 'id,name,description,level,image_id,image_url,badge,route,rating_avg,rating_count,views_count,is_active,created_at';
const RECIPE_IA_COLS = 'id,name,subtitle,category,calories,protein,carbs_g,fat_g,time,tags,image_url,created_at,rating_avg,rating_count,views_count,likes_count,is_active';
const USER_RECIPE_COLS = 'id,user_id,recipe_name,author_name,protein,calories,carbs_g,carbs,fat_g,fat,time,status,ingredients,instructions,steps,description,image_url,created_at,rating_avg,rating_count,views_count,likes_count';
const ARTICLE_COLS = 'id,title,category,content,read_time,image_id,image_url,is_active,created_at,rating_avg,rating_count,views_count';
const FEATURED_COLS = 'id,title,subtitle,image_id,image_url,route,target_id,participants,updated_at';
const CHALLENGE_COLS = 'id,name,title,subtitle,description,duration_days,level,image_id,image_url,status,is_official,participants,rating_avg,views_count,created_at';

function mapTrend(row) {
  if (!row) return null;
  return {
    ...row,
    rating: formatRating(row.rating_avg || row.rating),
    ratingValue: clampRating(row.rating_avg || row.rating),
    users: String(row.rating_count || row.views_count || 0),
  };
}

function mapRoutine(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.name,
    name: row.name,
    level: row.level,
    description: row.description,
    image_id: row.image_id,
    image_url: row.image_url,
    badge: row.badge,
    route: row.route || `/explore/public-routine-detail?id=${row.id}`,
    rating: formatRating(row.rating_avg),
    ratingValue: clampRating(row.rating_avg),
    users: String(row.rating_count || row.views_count || 0),
  };
}

function mapRecipeIa(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    author: 'MyGymCoach IA',
    protein: row.protein,
    calories: row.calories,
    carbs: row.carbs_g,
    fat: row.fat_g,
    time: row.time,
    category: row.category,
    image: row.image_url,
    image_url: row.image_url,
    tags: row.tags,
    rating: formatRating(row.rating_avg),
    likes: row.likes_count || 0,
  };
}

function mapUserRecipe(row) {
  if (!row) return null;
  const carbs = row.carbs_g ?? row.carbs;
  const fat = row.fat_g ?? row.fat;
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.recipe_name,
    recipe_name: row.recipe_name,
    author: row.author_name,
    author_name: row.author_name,
    protein: row.protein,
    calories: row.calories,
    carbs,
    fat,
    time: row.time,
    status: row.status,
    image: row.image_url,
    image_url: row.image_url,
    ingredients: row.ingredients,
    instructions: row.instructions || row.steps,
    description: row.description,
    rating: formatRating(row.rating_avg),
    likes: row.likes_count || 0,
  };
}

function mapArticle(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    content: row.content,
    readTime: row.read_time != null ? `${row.read_time} min` : '',
    image_id: row.image_id,
    image: row.image_url,
    image_url: row.image_url,
    rating: formatRating(row.rating_avg),
  };
}

function mapChallenge(row) {
  if (!row) return null;
  const title = row.title || row.name;
  return {
    id: row.id,
    title,
    name: title,
    subtitle: row.subtitle,
    description: row.description,
    participants: row.participants ?? 0,
    daysLeft: row.duration_days ?? 0,
    progress: 0,
    level: row.level,
    image_id: row.image_id,
    image_url: row.image_url,
    rating: formatRating(row.rating_avg),
  };
}

function mapFeatured(row) {
  if (!row) return null;
  return {
    ...row,
    participants: row.participants ?? 0,
  };
}

async function run(query) {
  return withTimeout(query);
}

export async function loadExploreHome({ force = false } = {}) {
  const cacheKey = 'explore:home';
  if (!force) {
    const cached = cacheGet(cacheKey);
    if (cached) return cached;
  }

  const [trends, routines, recipesIa, userRecipes, articles, featured, challenges] = await Promise.all([
    run(supabase.from('trends').select(TREND_COLS).eq('is_active', true).order('position', { ascending: true }).limit(HOME_LIMIT)),
    run(supabase.from('public_routines').select(ROUTINE_COLS).eq('is_active', true).order('created_at', { ascending: false }).limit(HOME_LIMIT)),
    run(supabase.from('recipes_ia').select(RECIPE_IA_COLS).eq('is_active', true).order('created_at', { ascending: false }).limit(HOME_LIMIT)),
    run(supabase.from('user_recipes').select(USER_RECIPE_COLS).in('status', ['approved', 'published']).order('created_at', { ascending: false }).limit(HOME_LIMIT)),
    run(supabase.from('articles').select(ARTICLE_COLS).eq('is_active', true).order('created_at', { ascending: false }).limit(3)),
    run(supabase.from('featured_content').select(FEATURED_COLS)),
    run(supabase.from('challenges').select(CHALLENGE_COLS).eq('is_official', true).order('created_at', { ascending: false }).limit(HOME_LIMIT)),
  ]);

  const firstError = [trends, routines, recipesIa, userRecipes, articles, featured, challenges].find((r) => r.error)?.error;
  if (firstError) {
    logger.error('explore.home.failed', { code: firstError.code });
    throw firstError;
  }

  const featuredRows = featured.data || [];
  const result = {
    trends: (trends.data || []).map(mapTrend),
    routines: (routines.data || []).map(mapRoutine),
    recipesIa: (recipesIa.data || []).map(mapRecipeIa),
    userRecipes: (userRecipes.data || []).map(mapUserRecipe),
    articles: (articles.data || []).map(mapArticle),
    challenges: (challenges.data || []).map(mapChallenge),
    featured: {
      hero: mapFeatured(featuredRows.find((d) => d.id === 'reto_mes')) || null,
      exercise: mapFeatured(featuredRows.find((d) => d.id === 'ejercicio_dia')) || null,
    },
  };

  return cacheSet(cacheKey, result, STABLE_TTL);
}

export async function listTrends({ page = 0, limit = PAGE } = {}) {
  const from = page * limit;
  const { data, error } = await run(
    supabase.from('trends').select(TREND_COLS).eq('is_active', true).order('position', { ascending: true }).range(from, from + limit - 1)
  );
  if (error) throw error;
  return (data || []).map(mapTrend);
}

export async function listPublicRoutines({ page = 0, limit = PAGE } = {}) {
  const from = page * limit;
  const { data, error } = await run(
    supabase.from('public_routines').select(ROUTINE_COLS).eq('is_active', true).order('created_at', { ascending: false }).range(from, from + limit - 1)
  );
  if (error) throw error;
  return (data || []).map(mapRoutine);
}

export async function listRecipesIa({ page = 0, limit = PAGE } = {}) {
  const from = page * limit;
  const { data, error } = await run(
    supabase.from('recipes_ia').select(RECIPE_IA_COLS).eq('is_active', true).order('created_at', { ascending: false }).range(from, from + limit - 1)
  );
  if (error) throw error;
  return (data || []).map(mapRecipeIa);
}

export async function listPublishedUserRecipes({ page = 0, limit = PAGE } = {}) {
  const from = page * limit;
  const { data, error } = await run(
    supabase.from('user_recipes').select(USER_RECIPE_COLS).in('status', ['approved', 'published']).order('created_at', { ascending: false }).range(from, from + limit - 1)
  );
  if (error) throw error;
  return (data || []).map(mapUserRecipe);
}

export async function listArticles({ page = 0, limit = PAGE } = {}) {
  const from = page * limit;
  const { data, error } = await run(
    supabase.from('articles').select(ARTICLE_COLS).eq('is_active', true).order('created_at', { ascending: false }).range(from, from + limit - 1)
  );
  if (error) throw error;
  return (data || []).map(mapArticle);
}

export async function listOfficialChallenges({ page = 0, limit = PAGE } = {}) {
  const from = page * limit;
  const { data, error } = await run(
    supabase.from('challenges').select(CHALLENGE_COLS).eq('is_official', true).order('created_at', { ascending: false }).range(from, from + limit - 1)
  );
  if (error) throw error;
  return (data || []).map(mapChallenge);
}

export async function getTrend(id) {
  const { data, error } = await run(supabase.from('trends').select(TREND_COLS).eq('id', id).maybeSingle());
  if (error) throw error;
  return mapTrend(data);
}

export async function getPublicRoutine(id) {
  const { data, error } = await run(supabase.from('public_routines').select(ROUTINE_COLS).eq('id', id).maybeSingle());
  if (error) throw error;
  return mapRoutine(data);
}

export async function getArticle(id) {
  const { data, error } = await run(supabase.from('articles').select(ARTICLE_COLS).eq('id', id).maybeSingle());
  if (error) throw error;
  return mapArticle(data);
}

export async function getRecipeIa(id) {
  const { data, error } = await run(supabase.from('recipes_ia').select(`${RECIPE_IA_COLS},ingredients,instructions`).eq('id', id).maybeSingle());
  if (error) throw error;
  return mapRecipeIa(data) ? { ...mapRecipeIa(data), ingredients: data.ingredients, instructions: data.instructions } : null;
}

export async function getUserRecipe(id) {
  const { data, error } = await run(supabase.from('user_recipes').select(USER_RECIPE_COLS).eq('id', id).maybeSingle());
  if (error) throw error;
  return mapUserRecipe(data);
}

export async function getChallenge(id) {
  const { data, error } = await run(supabase.from('challenges').select(CHALLENGE_COLS).eq('id', id).maybeSingle());
  if (error) throw error;
  return mapChallenge(data);
}

export function invalidateExploreCache() {
  cacheClear('explore:');
}

export const EXPLORE_PAGE_SIZE = PAGE;
