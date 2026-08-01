import { supabase } from '../lib/supabase'; //

// ─── Configuración ────────────────────────────────────────────────────────────
const CONFIG = Object.freeze({
  MIN_LOCAL_RESULTS: 5,
  OFF_TIMEOUT_MS: 10000,
  OFF_MAX_RETRIES: 2,
  OFF_RETRY_DELAY_MS: 1000,
  LOCAL_SEARCH_LIMIT: 25,
  OFF_PAGE_SIZE: 20,
  CACHE_MAX_SIZE: 50,
  CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutos
  MIN_QUERY_LENGTH: 2,
}); //

// ─── Caché en memoria con TTL ─────────────────────────────────────────────────
const searchCache = new Map(); //

function getCachedResults(query) {
  const entry = searchCache.get(query); //
  if (!entry) return null; //
  if (Date.now() - entry.timestamp > CONFIG.CACHE_TTL_MS) {
    searchCache.delete(query);
    return null; //
  } //
  return entry.results; //
}

function setCachedResults(query, results) {
  if (searchCache.size >= CONFIG.CACHE_MAX_SIZE) {
    const oldestKey = searchCache.keys().next().value; //
    searchCache.delete(oldestKey); //
  }
  searchCache.set(query, { results, timestamp: Date.now() });
}

export function clearFoodSearchCache() {
  searchCache.clear(); //
} //

// ─── AbortController global para cancelar búsquedas previas ───────────────────
let currentSearchController = null; //
function cancelPreviousSearch() {
  if (currentSearchController) {
    currentSearchController.abort();
  }
  currentSearchController = new AbortController();
  return currentSearchController; //
} //

// ─── Helpers de normalización ─────────────────────────────────────────────────
function normalizeQuery(query) {
  return (query ?? '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // elimina acentos
    .trim(); //
} //

function roundTo(num, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(Number(num) * factor) / factor; //
} //

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback; //
} //

// ─── Logger estructurado ──────────────────────────────────────────────────────
const logger = {
  debug: (msg, data) => console.debug(`[foodService] ${msg}`, data ?? ''),
  info:  (msg, data) => console.log(`[foodService] ${msg}`, data ?? ''),
  warn:  (msg, err)  => console.warn(`[foodService] ${msg}`, err?.message ?? err ?? ''),
  error: (msg, err)  => console.error(`[foodService] ${msg}`, err),
}; //

// ─── Mapeo DB → Food ──────────────────────────────────────────────────────────
/**
 * @typedef {Object} Food
 * @property {string|null} id
 * @property {string|null} barcode
 * @property {string} name
 * @property {string} brand
 * @property {'database'|'openfoodfacts'} source
 * @property {{ calories:number, protein:number, carbs:number, fat:number }} per100g
 */

/** @param {Object} row */
function mapDbRowToFood(row) {
  return {
    id:      row.food_id, //
    barcode: row.barcode ?? null, //
    name:    row.name,
    brand:   row.brand ?? '', //
    source:  'database',
    per100g: {
      calories: Math.round(safeNumber(row.calories)),
      protein:  roundTo(safeNumber(row.protein_g)),
      carbs:    roundTo(safeNumber(row.carbs_g)),
      fat:      roundTo(safeNumber(row.fat_g)),
    },
  }; //
} //

/** @param {Object} product — producto crudo de Open Food Facts */
function mapOffProductToFood(product) {
  const n = product.nutriments ?? {}; //
  const energyKcal = n['energy-kcal_100g'] ?? n['energy_100g'] ?? 0; //

  return {
    id:       null,
    barcode:  product.code ?? null, //
    name:     product.product_name.trim(),
    brand:    product.brands ?? '', //
    source:   'openfoodfacts',
    per100g: {
      calories: Math.round(safeNumber(energyKcal)),
      protein:  roundTo(safeNumber(n['proteins_100g'])),
      carbs:    roundTo(safeNumber(n['carbohydrates_100g'])),
      fat:      roundTo(safeNumber(n['fat_100g'])),
    },
  }; //
} //

// ─── Búsqueda local ───────────────────────────────────────────────────────────
/**
 * Busca alimentos en la base de datos local por coincidencia parcial.
 * @param {string} query
 * @param {AbortSignal} [signal]
 * @returns {Promise<Food[]>}
 */
export async function searchLocalFoods(query, signal) {
  const text = normalizeQuery(query); //
  if (!text) return []; //

  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .ilike('search_name', `%${text}%`)
    .order('usage_count', { ascending: false })
    .order('name', { ascending: true })
    .limit(CONFIG.LOCAL_SEARCH_LIMIT)
    .abortSignal(signal); //
  if (error) { //
    logger.warn(`searchLocalFoods error para "${text}"`, error);
    return []; //
  } //

  logger.debug(`búsqueda local "${text}" → ${data?.length ?? 0} resultados`); //
  return (data ?? []).map(mapDbRowToFood); //
} //

// ─── Búsqueda en Open Food Facts con retry ────────────────────────────────────
/**
 * Consulta la API pública de Open Food Facts.
 * @param {string} query
 * @param {AbortSignal} signal
 * @returns {Promise<Food[]>}
 */
// ─── Guardar alimento escaneado directamente en nutrition_logs ─────────────────
/**
 * Guarda un alimento directamente en el diario de comidas.
 * @param {Object} params
 * @param {string} params.userId - ID del usuario
 * @param {Food} params.food - Alimento escaneado
 * @param {'breakfast'|'lunch'|'dinner'|'snack'} params.mealType - Tipo de comida
 * @param {number} params.quantityG - Cantidad en gramos
 * @returns {Promise<{ success: boolean, error: string|null }>}
 */
export async function addScannedFoodToLog({ userId, food, mealType, quantityG }) {
  if (!userId || !food || !mealType) {
    logger.warn('Faltan parámetros para agregar al diario');
    return { success: false, error: 'Faltan datos' };
  }

  try {
    // Escalar nutrientes según la cantidad
    const factor = quantityG / 100;
    const scaledNutrients = {
      calories: Math.round((food.per100g?.calories ?? 0) * factor),
      protein_g: roundTo((food.per100g?.protein ?? 0) * factor),
      carbs_g: roundTo((food.per100g?.carbs ?? 0) * factor),
      fat_g: roundTo((food.per100g?.fat ?? 0) * factor),
    };

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('nutrition_logs')
      .insert({
        user_id: userId,
        meal_type: mealType,
        logged_date: today,
        food_name: food.name,
        calories: scaledNutrients.calories,
        protein_g: scaledNutrients.protein_g,
        carbs_g: scaledNutrients.carbs_g,
        fat_g: scaledNutrients.fat_g,
        quantity_g: quantityG,
      })
      .select()
      .single();

    if (error) {
      logger.warn('Error agregando al diario', error);
      return { success: false, error: error.message };
    }

    logger.debug(`Alimento agregado al diario: ${data?.id}`);
    return { success: true, error: null };
  } catch (err) {
    logger.error('Error crítico agregando al diario', err);
    return { success: false, error: err.message };
  }
}
// ─── Búsqueda en Open Food Facts con retry ────────────────────────────────────
async function searchOpenFoodFacts(query, signal) {
  const text = query.trim();
  if (text.length < CONFIG.MIN_QUERY_LENGTH) return [];

  const url = new URL('https://world.openfoodfacts.org/cgi/search.pl');
  url.searchParams.set('search_terms', text);
  url.searchParams.set('search_simple', '1');
  url.searchParams.set('action', 'process');
  url.searchParams.set('json', '1');
  url.searchParams.set('page_size', String(CONFIG.OFF_PAGE_SIZE));
  url.searchParams.set('fields', 'code,product_name,brands,nutriments');

  logger.debug('consultando OFF', url.toString());

  let lastError = null;

  for (let attempt = 0; attempt <= CONFIG.OFF_MAX_RETRIES; attempt++) {
    if (signal?.aborted) throw new DOMException('Búsqueda cancelada', 'AbortError');

    try {
      // Usar Promise.race para manejar timeout en lugar de AbortSignal.any
      const fetchPromise = fetch(url, { signal });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), CONFIG.OFF_TIMEOUT_MS)
      );

      const res = await Promise.race([fetchPromise, timeoutPromise]);

      if (!res.ok) {
        throw new Error(`Servidor respondió ${res.status}`);
      }

      const data = await res.json();
      const products = data.products ?? [];
      logger.debug(`OFF devolvió ${products.length} productos crudos`);

      return dedupeAndMapOffProducts(products);
    } catch (err) {
      lastError = err;

      if (err.name === 'AbortError') {
        logger.warn(`OFF cancelado en intento ${attempt + 1}`);
        throw err; // Propagar cancelación externa
      }

      logger.warn(`OFF error en intento ${attempt + 1}: ${err.message}`);

      if (attempt < CONFIG.OFF_MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.OFF_RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }

  logger.error(`OFF agotó ${CONFIG.OFF_MAX_RETRIES + 1} intentos`, lastError);
  return [];
}

// ─── Función para deduplicar productos de OFF ─────────────────────────────────
function dedupeAndMapOffProducts(products) {
  const seen = new Set();
  return products
    .filter(p => p?.product_name?.trim())
    .map(mapOffProductToFood)
    .filter(food => {
      const key = food.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .filter(food => food.per100g.calories > 0);
}

// ─── Guardado en lote (Bulk Save) ─────────────────────────────────────────────
export async function saveFoodsInBulk(foods) {
  if (!foods?.length) return { saved: 0, errors: 0 };

  const withBarcode = [];
  const withoutBarcode = [];

  for (const food of foods) {
    const payload = buildFoodPayload(food);
    if (food.barcode) {
      withBarcode.push(payload);
    } else {
      withoutBarcode.push(payload);
    }
  }

  const promises = [];
  if (withBarcode.length > 0) {
    promises.push(
      supabase.from('foods').upsert(withBarcode, { onConflict: 'barcode' })
    );
  }
  if (withoutBarcode.length > 0) {
    promises.push(
      supabase.from('foods').insert(withoutBarcode)
    );
  }

  const results = await Promise.allSettled(promises);
  let errors = 0;
  results.forEach((res, idx) => {
    const err = res.status === 'rejected' ? res.reason : res.value?.error;
    if (err) {
      errors++;
      logger.warn(`Error en guardado por lote [grupo ${idx}]`, err);
    }
  });

  const saved = foods.length - errors;
  logger.debug(`guardado en lote: ${saved}/${foods.length} alimentos`);
  return { saved, errors };
}

function buildFoodPayload(food) {
  return {
    barcode:      food.barcode ?? null,
    name:         food.name,
    brand:        food.brand ?? '',
    calories:     food.per100g.calories,
    protein_g:    food.per100g.protein,
    carbs_g:      food.per100g.carbs,
    fat_g:        food.per100g.fat,
    serving_size: '100 g',
    source:       'openfoodfacts',
    search_name:  normalizeQuery(food.name),
  };
}

// ─── Búsqueda híbrida (función principal) ─────────────────────────────────────
export async function searchFoods(query) {
  const text = normalizeQuery(query);
  if (text.length < CONFIG.MIN_QUERY_LENGTH) return [];

  // Verificar caché
  const cached = getCachedResults(text);
  if (cached) {
    logger.debug(`caché hit para "${text}"`);
    return cached;
  }

  // Cancelar búsqueda previa para evitar race conditions
  const controller = cancelPreviousSearch();
  const { signal } = controller;

  try {
    const localResults = await searchLocalFoods(text, signal);

    if (localResults.length >= CONFIG.MIN_LOCAL_RESULTS) {
      logger.debug('suficientes resultados locales, no se consulta OFF');
      setCachedResults(text, localResults);
      return localResults;
    }

    let apiResults = [];
    try {
      apiResults = await searchOpenFoodFacts(text, signal);
    } catch (e) {
      logger.warn('OFF falló, devolviendo solo locales', e);
      setCachedResults(text, localResults);
      return localResults;
    }

    // Deduplicar contra resultados locales
    const localNames = new Set(localResults.map(f => f.name.toLowerCase()));
    const newFromApi = apiResults.filter(f => !localNames.has(f.name.toLowerCase()));

    logger.debug(`resultado final: ${localResults.length} locales + ${newFromApi.length} nuevos de OFF`);

    // Guardado en segundo plano (no bloquea la respuesta)
    if (newFromApi.length > 0) {
      saveFoodsInBulk(newFromApi).catch(err =>
        logger.warn('Error crítico guardando lote en background', err)
      );
    }

    const finalResults = [...localResults, ...newFromApi];
    setCachedResults(text, finalResults);
    return finalResults;
  } catch (err) {
    if (err.name === 'AbortError') {
      logger.debug('búsqueda cancelada por una nueva');
      return [];
    }
    throw err;
  }
}

// ─── Utilidades exportadas ────────────────────────────────────────────────────
export async function getFoodById(foodId) {
  if (!foodId) return null;

  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .eq('food_id', foodId)
    .maybeSingle();

  if (error) {
    logger.warn('getFoodById error', error);
    return null;
  }

  return data ? mapDbRowToFood(data) : null;
}

export async function getFoodByBarcode(barcode) {
  if (!barcode) return null;

  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .eq('barcode', barcode)
    .maybeSingle();

  if (error) {
    logger.warn('getFoodByBarcode error', error);
    return null;
  }

  return data ? mapDbRowToFood(data) : null;
}

export async function increaseFoodUsage(foodId) {
  if (!foodId) return;

  try {
    const { error } = await supabase.rpc('increment_food_usage', { p_food_id: foodId });
    if (!error) return;
    if (error.code !== 'PGRST202' && !error.message.includes('Could not find')) {
      logger.warn('increaseFoodUsage RPC error', error);
    }
  } catch {
    // RPC no disponible, continuar con fallback
  }

  // Fallback: read-then-update con reintento
  await atomicIncrementUsageFallback(foodId);
}

async function atomicIncrementUsageFallback(foodId, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { data, error: fetchError } = await supabase
      .from('foods')
      .select('usage_count')
      .eq('food_id', foodId)
      .maybeSingle();

    if (fetchError) {
      logger.warn('increaseFoodUsage error de lectura', fetchError);
      return;
    }
    if (!data) return;

    const { error: updateError } = await supabase
      .from('foods')
      .update({
        usage_count: (data.usage_count ?? 0) + 1,
        last_used:   new Date().toISOString(),
      })
      .eq('food_id', foodId)
      .eq('usage_count', data.usage_count ?? 0);

    if (!updateError) return;

    logger.warn(`increaseFoodUsage intento ${attempt + 1} fallido`, updateError);
    await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
  }
}

export function scaleNutrients(food, grams) {
  const factor = safeNumber(grams, 0) / 100;
  const { calories, protein, carbs, fat } = food.per100g;

  return {
    calories: Math.round(calories * factor),
    protein:  roundTo(protein * factor),
    carbs:    roundTo(carbs * factor),
    fat:      roundTo(fat * factor),
  };
}

// ─── Categorías de alimentos ──────────────────────────────────────────────────
export const FOOD_CATEGORIES = [
  { value: 'carnes', label: 'Carnes y Aves', icon: '🥩' },
  { value: 'pescados', label: 'Pescados y Mariscos', icon: '🐟' },
  { value: 'lacteos', label: 'Lácteos y Huevos', icon: '🥛' },
  { value: 'frutas', label: 'Frutas', icon: '🍎' },
  { value: 'verduras', label: 'Verduras', icon: '🥦' },
  { value: 'cereales', label: 'Cereales y Panes', icon: '🍞' },
  { value: 'legumbres', label: 'Legumbres', icon: '🫘' },
  { value: 'bebidas', label: 'Bebidas', icon: '🥤' },
  { value: 'snacks', label: 'Snacks y Dulces', icon: '🍪' },
  { value: 'grasas', label: 'Grasas y Aceites', icon: '🫒' },
  { value: 'suplementos', label: 'Suplementos', icon: '💊' },
  { value: 'comidas_preparadas', label: 'Comidas Preparadas', icon: '🍱' },
  { value: 'otros', label: 'Otros', icon: '🍽️' },
];

// ─── Buscar posibles duplicados ───────────────────────────────────────────────
/**
 * Busca alimentos similares para evitar duplicados.
 * @param {string} name - Nombre del alimento
 * @param {string} [brand] - Marca del alimento
 * @returns {Promise<Food[]>}
 */
export async function findSimilarFoods(name, brand) {
  if (!name || name.length < 3) return [];

  const text = normalizeQuery(name);
  
  // Buscar por nombre similar
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .ilike('search_name', `%${text}%`)
    .limit(5);

  if (error) {
    logger.warn('Error buscando duplicados', error);
    return [];
  }

  // Si hay marca, filtrar también por marca similar
  let results = data ?? [];
  if (brand) {
    const brandText = normalizeQuery(brand);
    const withBrand = results.filter(f => 
      f.brand && normalizeQuery(f.brand).includes(brandText)
    );
    if (withBrand.length > 0) {
      results = withBrand;
    }
  }

  return results.map(mapDbRowToFood);
}

// ─── Crear nuevo alimento ─────────────────────────────────────────────────────
/**
 * Crea un nuevo alimento en la base de datos.
 * @param {Object} foodData
 * @param {string} foodData.name - Nombre del alimento
 * @param {string} [foodData.brand] - Marca
 * @param {string} [foodData.barcode] - Código de barras
 * @param {string} [foodData.category] - Categoría
 * @param {number} foodData.calories - Calorías por 100g
 * @param {number} foodData.protein_g - Proteínas por 100g
 * @param {number} foodData.carbs_g - Carbohidratos por 100g
 * @param {number} foodData.fat_g - Grasas por 100g
 * @returns {Promise<{ success: boolean, food: Food|null, error: string|null }>}
 */
export async function createFood(foodData) {
  if (!foodData.name) {
    return { success: false, food: null, error: 'El nombre es requerido' };
  }

  try {
    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, food: null, error: 'Debes iniciar sesión' };
    }

    // Verificar si ya existe un alimento con el mismo código de barras
    if (foodData.barcode) {
      const existing = await getFoodByBarcode(foodData.barcode);
      if (existing) {
        return { 
          success: false, 
          food: existing, 
          error: 'Ya existe un alimento con ese código de barras' 
        };
      }
    }

    // Preparar payload
    const payload = {
      name: foodData.name.trim(),
      brand: foodData.brand?.trim() ?? '',
      barcode: foodData.barcode?.trim() ?? null,
      category: foodData.category ?? 'otros',
      calories: Math.round(Number(foodData.calories) || 0),
      protein_g: roundTo(Number(foodData.protein_g) || 0),
      carbs_g: roundTo(Number(foodData.carbs_g) || 0),
      fat_g: roundTo(Number(foodData.fat_g) || 0),
      serving_size: '100 g',
      source: 'user',
      search_name: normalizeQuery(foodData.name),
      created_by: user.id,
      is_verified: true,
      usage_count: 0,
    };

    // Insertar en la base de datos
    const { data, error } = await supabase
      .from('foods')
      .insert(payload)
      .select()
      .single();

    if (error) {
      // Si es error de código de barras duplicado
      if (error.code === '23505' && foodData.barcode) {
        return { 
          success: false, 
          food: null, 
          error: 'Ya existe un alimento con ese código de barras' 
        };
      }
      logger.warn('Error creando alimento', error);
      return { success: false, food: null, error: error.message };
    }

    logger.debug(`Alimento creado: ${data?.name}`);
    return { success: true, food: mapDbRowToFood(data), error: null };
  } catch (err) {
    logger.error('Error crítico creando alimento', err);
    return { success: false, food: null, error: err.message };
  }
}

// ─── Obtener alimento por código de barras (híbrido) ──────────────────────────
/**
 * Busca un alimento por código de barras en BD local y OFF.
 * @param {string} barcode
 * @returns {Promise<Food|null>}
 */
export async function getFoodByBarcodeHybrid(barcode) {
  if (!barcode) return null;

  // 1. Buscar en BD local
  const local = await getFoodByBarcode(barcode);
  if (local) {
    // Incrementar uso en background
    increaseFoodUsage(local.id).catch(() => {});
    return local;
  }

  // 2. Buscar en Open Food Facts
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}`;
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) return null;
    
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;

    const food = mapOffProductToFood(data.product);

    // 3. Guardar en BD local para futuras búsquedas
    const payload = buildFoodPayload(food);
    payload.source = 'openfoodfacts';
    
    const { data: saved } = await supabase
      .from('foods')
      .upsert(payload, { onConflict: 'barcode' })
      .select()
      .maybeSingle();

    return saved ? mapDbRowToFood(saved) : food;
  } catch (err) {
    logger.warn('Error buscando barcode en OFF', err);
    return null;
  }
}
// end of getFoodByBarcodeHybrid
