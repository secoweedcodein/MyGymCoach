const BASE = 'https://world.openfoodfacts.org';

export async function searchFoods(query, page = 1) {
  const url = `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page=${page}&page_size=20&fields=product_name,nutriments,serving_size,brands,image_small_url`;
  
  const res  = await fetch(url);
  const data = await res.json();

  return (data.products || [])
    .filter(p => p.product_name && p.nutriments?.['energy-kcal_100g'])
    .map(parseProduct);
}

export async function getFoodById(id) {
  const res  = await fetch(`${BASE}/api/v0/product/${id}.json?fields=product_name,nutriments,serving_size,brands`);
  const data = await res.json();
  if (data.status !== 1) return null;
  return parseProduct(data.product);
}

function parseProduct(p) {
  const n = p.nutriments || {};
  return {
    id:         p.code || p._id,
    name:       p.product_name,
    brand:      p.brands || '',
    per100g: {
      calories: Math.round(n['energy-kcal_100g'] || 0),
      protein:  Math.round((n['proteins_100g']       || 0) * 10) / 10,
      carbs:    Math.round((n['carbohydrates_100g']  || 0) * 10) / 10,
      fat:      Math.round((n['fat_100g']             || 0) * 10) / 10,
    },
  };
}

// Escala los nutrientes según gramos consumidos
export function scaleNutrients(food, grams) {
  const factor = grams / 100;
  return {
    calories: Math.round(food.per100g.calories * factor),
    protein:  Math.round(food.per100g.protein  * factor * 10) / 10,
    carbs:    Math.round(food.per100g.carbs    * factor * 10) / 10,
    fat:      Math.round(food.per100g.fat      * factor * 10) / 10,
  };
}