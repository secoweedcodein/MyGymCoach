const TREND_IMAGES = {
  abs: require('../assets/wmremove-transformed.png'),
  hipertrofia: require('../assets/hiperftrofia.png'),
  funcional: require('../assets/funcional.png'),
  upper: require('../assets/upper.png'),
  ppl: require('../assets/PPL.png'),
  fullbody: require('../assets/fullbody.png'),
  '5x5': require('../assets/5x5.png'),
  '30dias': require('../assets/30diashipertrofia.png'),
};

const FEATURED_IMAGES = {
  ...TREND_IMAGES,
  dominadas: require('../assets/dominadas.png'),
};

const ARTICLE_IMAGES = {
  suplementos: require('../assets/suples.png'),
  sentadilla: require('../assets/SENTADILLA.png'),
  estancamiento: require('../assets/estancamiento.png'),
};

const RECIPE_IMAGES = {
  bowl: require('../assets/bowlpollo.png'),
  pancakes: require('../assets/pancakes.png'),
  wrap: require('../assets/wrap.png'),
};

export { TREND_IMAGES, FEATURED_IMAGES, ARTICLE_IMAGES, RECIPE_IMAGES };

export function resolveExploreImage(imageUrl, imageId, fallbackMap = TREND_IMAGES, fallbackKey = 'abs') {
  if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) return { uri: imageUrl };
  if (typeof imageId === 'string' && imageId.startsWith('http')) return { uri: imageId };
  if (imageId && fallbackMap[imageId]) return fallbackMap[imageId];
  return fallbackMap[fallbackKey] || TREND_IMAGES.abs;
}
