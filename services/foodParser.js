export const normalizeFoodData = (offProduct, quantityGrams = 100) => {
  if (!offProduct || !offProduct.product) return null;

  const nutriments = offProduct.product.nutriments || {};
  
  // OFF a veces usa 'energy-kcal_100g' o 'energy-kcal_serving'. Forzamos a 100g como base.
  const calories100g = nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0;
  const protein100g = nutriments.proteins_100g || nutriments.proteins || 0;
  const carbs100g = nutriments.carbohydrates_100g || nutriments.carbohydrates || 0;
  const fat100g = nutriments.fat_100g || nutriments.fat || 0;

  // Factor de escala si el usuario registra una cantidad distinta a 100g
  const factor = quantityGrams / 100;

  return {
    food_id: offProduct.product.code || `custom_${Date.now()}`,
    name: offProduct.product.product_name || 'Alimento desconocido',
    brand: offProduct.product.brands || 'Desconocida',
    calories: Math.round(calories100g * factor) || 0,
    protein_g: Math.round(protein100g * factor * 10) / 10 || 0, // 1 decimal
    carbs_g: Math.round(carbs100g * factor * 10) / 10 || 0,
    fat_g: Math.round(fat100g * factor * 10) / 10 || 0,
    quantity_g: quantityGrams,
    barcode: offProduct.product.code || null,
  };
};