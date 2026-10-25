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

  export async function fetchExploreScreenSections() {
    const [articles, trends, routines, recipes, challenges, userRecipes, featured] = await Promise.all([
      run(supabase.from('articles').select('id, title, category, read_time, image_id, image_url').eq('is_active', true).order('created_at', { ascending: false }).limit(3)),
      run(supabase.from('trends').select('id, title, level, rating, users, badge, image_id, image_url, route').eq('is_active', true).order('position', { ascending: true })),
      run(supabase.from('public_routines').select('id, name, level, image_id, image_url, route, badge, rating_avg, views_count').eq('is_active', true).order('created_at', { ascending: false }).limit(4)),
      run(supabase.from('recipes_ia').select('id, name, subtitle, protein, calories, time, image_url').eq('is_active', true).order('created_at', { ascending: false }).limit(4)),
      run(supabase.from('challenges').select('id, name, subtitle, duration_days, participants').eq('is_official', true).order('created_at', { ascending: false }).limit(3)),
      run(supabase.from('user_recipes').select('id, recipe_name, author_name, protein, calories, time, image_url').in('status', ['approved', 'published']).order('created_at', { ascending: false }).limit(2)),
      run(supabase.from('featured_content').select('id, title, subtitle, image_id, image_url, route, target_id, participants')),
    ]);
    const failed = [articles, trends, routines, recipes, challenges, userRecipes, featured].find((result) => result.error);
    if (failed?.error) throw failed.error;
    return {
      articles: articles.data || [],
      trends: trends.data || [],
      routines: routines.data || [],
      recipes: recipes.data || [],
      challenges: challenges.data || [],
      userRecipes: userRecipes.data || [],
      featured: featured.data || [],
    };
  }

  export async function searchExploreContent(searchTerm) {
    const term = typeof searchTerm === 'string' ? searchTerm.trim() : '';
    if (term.length < 3) return [];
    const like = `%${term}%`;
    const groups = await Promise.all([
      run(supabase.from('trends').select('id, title').ilike('title', like).limit(6)),
      run(supabase.from('public_routines').select('id, name').ilike('name', like).limit(6)),
      run(supabase.from('recipes_ia').select('id, name').ilike('name', like).limit(6)),
      run(supabase.from('user_recipes').select('id, recipe_name').in('status', ['approved', 'published']).ilike('recipe_name', like).limit(6)),
      run(supabase.from('articles').select('id, title').ilike('title', like).limit(6)),
      run(supabase.from('challenges').select('id, name').eq('is_official', true).ilike('name', like).limit(6)),
    ]);
    const types = ['trend', 'routine', 'recipe_ia', 'user_recipe', 'article', 'challenge'];
    groups.forEach((result) => {
      if (result.error) logger.warn('explore.search.partial_failure', { code: result.error.code });
    });
    return groups.flatMap((group, index) => (group.data || []).map((item) => ({
      type: types[index],
      id: item.id,
      main: item.title || item.name || item.recipe_name,
    })));
  }

  export async function getArticleDetail(id) {
    const { data, error } = await run(supabase.from('articles').select('*').eq('id', id).maybeSingle());
    if (error) throw error;
    return data;
  }

  export async function getRecipeIaDetail(id) {
    const { data, error } = await run(supabase.from('recipes_ia').select('*').eq('id', id).maybeSingle());
    if (error) throw error;
    return data;
  }

  export async function getUserRecipeDetail(id) {
    const { data, error } = await run(supabase.from('user_recipes').select('*').eq('id', id).maybeSingle());
    if (error) throw error;
    return data;
  }

  export async function getChallengeDetail(id) {
    const { data, error } = await run(supabase.from('challenges').select('*').eq('id', id).maybeSingle());
    if (error) throw error;
    return data;
  }

  export async function findFirstOfficialHypertrophyChallenge() {
    const { data, error } = await run(
      supabase.from('challenges').select('id, name').eq('is_official', true)
        .ilike('name', '%hipertrofia%').order('created_at', { ascending: true }).limit(1).maybeSingle(),
    );
    if (error) throw error;
    return data;
  }

  export async function findChallengeByName(name) {
    const { data, error } = await run(
      supabase.from('challenges').select('id').eq('name', name).maybeSingle(),
    );
    if (error) throw error;
    return data;
  }

  export async function getPublicRoutineDetail(id) {
    const { data, error } = await run(
      supabase.from('public_routines')
        .select('id, name, description, exercise_ids, level, image_id, image_url, badge, rating_avg, rating_count, views_count')
        .eq('id', id).maybeSingle(),
    );
    if (error) throw error;
    return data;
  }

  export async function findSavedRoutine(userId, name) {
    const { data, error } = await run(supabase.from('routines').select('id').eq('user_id', userId).eq('name', name).maybeSingle());
    if (error) throw error;
    return data;
  }

  export async function getSavedRecipe(userId, recipeId, recipeType) {
    const { data, error } = await run(supabase.from('saved_recipes').select('id').eq('user_id', userId).eq('recipe_id', recipeId).eq('recipe_type', recipeType).maybeSingle());
    if (error) throw error;
    return data;
  }

  export async function saveRecipe(userId, recipeId, recipeType) {
    const { error } = await run(supabase.from('saved_recipes').upsert({
      user_id: userId,
      recipe_id: recipeId,
      recipe_type: recipeType,
    }, { onConflict: 'user_id,recipe_id' }));
    if (error) throw error;
  }

  export async function removeSavedRecipe(userId, recipeId, recipeType) {
    let query = supabase.from('saved_recipes').delete().eq('user_id', userId).eq('recipe_id', recipeId);
    if (recipeType) query = query.eq('recipe_type', recipeType);
    const { error } = await run(query);
    if (error) throw error;
  }

  export async function getSavedArticle(userId, articleId) {
    const { data, error } = await run(supabase.from('content_favorites').select('content_id').eq('user_id', userId).eq('content_type', 'article').eq('content_id', articleId).maybeSingle());
    if (error) throw error;
    return data;
  }

  export async function saveArticle(userId, articleId) {
    const { error } = await run(supabase.from('content_favorites').upsert({
      user_id: userId,
      content_type: 'article',
      content_id: articleId,
    }, { onConflict: 'user_id,content_type,content_id' }));
    if (error) throw error;
  }

  export async function removeSavedArticle(userId, articleId) {
    const { error } = await run(supabase.from('content_favorites').delete().eq('user_id', userId).eq('content_type', 'article').eq('content_id', articleId));
    if (error) throw error;
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

export async function listAllArticles() {
  const { data, error } = await run(
    supabase.from('articles').select(ARTICLE_COLS).eq('is_active', true).order('created_at', { ascending: false }),
  );
  if (error) throw error;
  return data || [];
}

export async function listAllRecipesIa() {
  const { data, error } = await run(
    supabase.from('recipes_ia').select(RECIPE_IA_COLS).eq('is_active', true).order('created_at', { ascending: false }),
  );
  if (error) throw error;
  return data || [];
}

export async function listSeeAllTrends() {
  const { data, error } = await run(
    supabase.from('trends').select(TREND_COLS).eq('is_active', true)
      .eq('show_in_see_all', true).order('position', { ascending: true }),
  );
  if (error) throw error;
  return data || [];
}

export async function listApprovedUserRecipes() {
  const { data, error } = await run(
    supabase.from('user_recipes').select(USER_RECIPE_COLS).eq('status', 'approved')
      .order('created_at', { ascending: false }),
  );
  if (error) throw error;
  return data || [];
}

export async function listCommunityUserRecipes() {
  const { data, error } = await run(
    supabase.from('user_recipes').select(USER_RECIPE_COLS).in('status', ['approved', 'published'])
      .order('created_at', { ascending: false }),
  );
  if (error) throw error;
  return data || [];
}

export async function listAllOfficialChallenges() {
  const { data, error } = await run(
    supabase.from('challenges')
      .select('id, name, subtitle, description, duration_days, level, participants, image_id, image_url')
      .eq('is_official', true).order('created_at', { ascending: false }),
  );
  if (error) throw error;
  return data || [];
}

export async function getExerciseOfDay() {
  const { data, error } = await run(
    supabase.from('featured_content')
      .select('id, title, subtitle, image_id, image_url, target_id')
      .eq('id', 'ejercicio_dia').maybeSingle(),
  );
  if (error) throw error;
  return data;
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
