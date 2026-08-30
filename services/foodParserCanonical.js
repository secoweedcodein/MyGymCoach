/**
 * foodParserCanonical.js
 * Parseador unificado para productos alimenticios (ej. Open Food Facts).
 */

/**
 * Normaliza un nombre para búsqueda (minúsculas, sin acentos).
 * @param {string} name - Nombre a normalizar.
 * @returns {string} Nombre normalizado.
 */
export const normalizeSearchName = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

/**
 * Valida los datos de un alimento.
 * @param {Object} foodObject - Objeto de alimento a validar.
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export const validateFoodData = (foodObject) => {
  const errors = [];
  if (!foodObject.name || foodObject.name.trim() === '') {
    errors.push('El nombre del alimento es obligatorio.');
  }
  
  if (foodObject.calories < 0) errors.push('Las calorías no pueden ser negativas.');
  if (foodObject.protein < 0) errors.push('Las proteínas no pueden ser negativas.');
  if (foodObject.carbs < 0) errors.push('Los carbohidratos no pueden ser negativos.');
  if (foodObject.fat < 0) errors.push('Las grasas no pueden ser negativas.');

  // Sanity check de macros (1g prot = 4kcal, 1g carb = 4kcal, 1g fat = 9kcal)
  const estimatedKcal = (foodObject.protein * 4) + (foodObject.carbs * 4) + (foodObject.fat * 9);
  // Permitimos cierto margen de error (ej. alcohol, fibra, redondeo)
  if (foodObject.calories > 0 && estimatedKcal > foodObject.calories * 1.5) {
    errors.push('La suma de los macronutrientes supera ampliamente las calorías reportadas.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Función auxiliar para extraer gramos de un string de porción (ej. '1 slice (28g)' -> 28).
 */
const parseServingSizeGrams = (servingSizeStr) => {
  if (!servingSizeStr) return null;
  const match = servingSizeStr.match(/(\d+(?:\.\d+)?)\s*g/i);
  return match ? parseFloat(match[1]) : null;
};

/**
 * Main parser that handles ALL Open Food Facts edge cases.
 * @param {Object} offProduct - Producto crudo de Open Food Facts.
 * @param {number} quantityGrams - Cantidad en gramos a calcular (por defecto 100).
 * @returns {Object} Objeto normalizado.
 */
export const parseOpenFoodFactsProduct = (offProduct, quantityGrams = 100) => {
  const nutriments = offProduct.nutriments || {};
  
  // Extraer calorías (preferir kcal, fallback a kJ / 4.184)
  let calories100g = nutriments['energy-kcal_100g'];
  if (calories100g == null || isNaN(calories100g)) {
    const energyKj = nutriments['energy_100g'];
    calories100g = (energyKj != null && !isNaN(energyKj)) ? energyKj / 4.184 : 0;
  }
  
  const getNutrient = (key) => {
    const val = nutriments[key];
    return (val != null && !isNaN(val)) ? parseFloat(val) : 0;
  };

  const protein100g = getNutrient('proteins_100g');
  const carbs100g = getNutrient('carbohydrates_100g');
  const fat100g = getNutrient('fat_100g');
  const fiber100g = getNutrient('fiber_100g');
  const sugars100g = getNutrient('sugars_100g');
  const saturatedFat100g = getNutrient('saturated-fat_100g');
  const sodium100g = getNutrient('sodium_100g');

  // Calcular el multiplicador
  const multiplier = quantityGrams / 100;
  
  const round1 = (num) => Math.round(num * 10) / 10;

  return {
    name: offProduct.product_name || 'Desconocido',
    brand: offProduct.brands || '',
    barcode: offProduct.code || '',
    calories: round1(calories100g * multiplier),
    protein: round1(protein100g * multiplier),
    carbs: round1(carbs100g * multiplier),
    fat: round1(fat100g * multiplier),
    fiber: round1(fiber100g * multiplier),
    sugars: round1(sugars100g * multiplier),
    saturatedFat: round1(saturatedFat100g * multiplier),
    sodium: round1(sodium100g * multiplier),
    servingSize: offProduct.serving_size || '',
    parsedServingGrams: parseServingSizeGrams(offProduct.serving_size),
    per100g: {
      calories: round1(calories100g),
      protein: round1(protein100g),
      carbs: round1(carbs100g),
      fat: round1(fat100g)
    }
  };
};

/**
 * Maps the parsed product to the Supabase 'foods' table schema.
 * @param {Object} parsedProduct - Producto previamente parseado.
 * @returns {Object} Objeto mapeado para la base de datos Supabase.
 */
export const mapToSupabaseFood = (parsedProduct) => {
  return {
    name: parsedProduct.name,
    brand: parsedProduct.brand,
    barcode: parsedProduct.barcode,
    calories_per_100g: parsedProduct.per100g.calories,
    protein_per_100g: parsedProduct.per100g.protein,
    carbs_per_100g: parsedProduct.per100g.carbs,
    fat_per_100g: parsedProduct.per100g.fat,
    fiber_per_100g: parsedProduct.fiber, // Asumiendo per 100g (ajustar si fuera necesario)
    serving_size: parsedProduct.servingSize,
    source: 'openfoodfacts',
    search_name: normalizeSearchName(parsedProduct.name)
  };
};
