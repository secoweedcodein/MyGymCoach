// src/data/exploreData.js
export const TRENDING = [
  {
    id: 't1',
    type: 'routine',
    image: require('../../../assets/wmremove-transformed.png'),
    title: 'Reto 30 días Abs',
    level: 'Intermedio',
    rating: 4.8,
    users: '12.3k',
    badge: 'popular',
    duration: '30 días',
    calories: 350,
    description: 'Transforma tu core en 30 días con este programa progresivo.',
  },
  {
    id: 't2',
    type: 'routine',
    image: require('../../../assets/hiperftrofia.png'),
    title: 'Hipertrofia Avanzada',
    level: 'Avanzado',
    rating: 8.1,
    users: '12.3k',
    duration: '8 semanas',
    calories: 450,
    description: 'Programa de hipertrofia para atletas experimentados.',
  },
  {
    id: 't3',
    type: 'routine',
    image: require('../../../assets/funcional.png'),
    title: 'Fuerza Funcional',
    level: 'Principiante',
    rating: 4.6,
    users: '5.4k',
    badge: 'nuevo',
    duration: '6 semanas',
    calories: 300,
    description: 'Mejora tu fuerza funcional con ejercicios compuestos.',
  },
  {
    id: 't4',
    type: 'routine',
    image: require('../../../assets/upper.png'),
    title: 'Powerbuilding',
    level: 'Avanzado',
    rating: 4.9,
    users: '8.7k',
    duration: '12 semanas',
    calories: 500,
    description: 'Combina powerlifting e hipertrofia para máxima fuerza.',
  },
];

export const ROUTINES = [
  { id: 'r1', image: require('../../../assets/upper.png'), title: 'Hipertrofia Upper', level: 'Intermedio', rating: 4.7, users: '12.3k', badge: 'popular', category: 'Hipertrofia', duration: '45 min' },
  { id: 'r2', image: require('../../../assets/PPL.png'), title: 'Push Pull Legs', level: 'Intermedio', rating: 4.8, users: '9.7k', badge: 'verificado', category: 'Hipertrofia', duration: '60 min' },
  { id: 'r3', image: require('../../../assets/fullbody.png'), title: 'Full Body 3 Días', level: 'Principiante', rating: 4.5, users: '6.2k', category: 'Principiante', duration: '40 min' },
  { id: 'r4', image: require('../../../assets/5x5.png'), title: 'Fuerza 5x5', level: 'Avanzado', rating: 4.9, users: '4.8k', badge: 'ia', category: 'Powerlifting', duration: '50 min' },
  { id: 'r5', image: require('../../../assets/funcional.png'), title: 'Crossfit WOD', level: 'Intermedio', rating: 4.6, users: '7.1k', category: 'Crossfit', duration: '30 min' },
];

export const RECIPES_IA = [
  { id: 'ri1', image: require('../../../assets/pancakes.png'), name: 'Bowl proteico de pollo', protein: 42, calories: 480, carbs: 35, fat: 18, time: '15 min', author: 'MyGymCoach IA', ingredients: ['200g pechuga de pollo', '100g arroz integral', '50g brócoli', '10ml aceite de oliva'], preparation: '1. Cocina el pollo a la plancha.\n2. Hierve el arroz.\n3. Saltea el brócoli.\n4. Mezcla todo y añade el aceite.' },
  { id: 'ri2', image: require('../../../assets/pancakes.png'), name: 'Pancakes de avena fit', protein: 28, calories: 350, carbs: 45, fat: 8, time: '10 min', author: 'MyGymCoach IA', ingredients: ['80g avena', '2 huevos', '1 plátano', '100ml leche desnatada'], preparation: '1. Tritura la avena.\n2. Mezcla con huevos y plátano.\n3. Cocina en sartén antiadherente.\n4. Sirve con frutas.' },
  { id: 'ri3', image: require('../../../assets/wrap.png'), name: 'Wrap de atún y aguacate', protein: 35, calories: 410, carbs: 30, fat: 15, time: '8 min', author: 'MyGymCoach IA', ingredients: ['1 tortilla integral', '100g atún', '1/2 aguacate', 'Tomate cherry'], preparation: '1. Calienta la tortilla.\n2. Mezcla atún con aguacate.\n3. Añade tomate.\n4. Enrolla y disfruta.' },
];

export const RECIPES_USERS = [
  { id: 'ru1', image: 'https://picsum.photos/seed/urecipe1/400/300', name: 'Ensalada de quinoa', protein: 22, calories: 320, carbs: 40, fat: 10, time: '12 min', author: '@lucia.fit', likes: 234, comments: 18 },
  { id: 'ru2', image: 'https://picsum.photos/seed/urecipe2/400/300', name: 'Tacos de carne magra', protein: 38, calories: 460, carbs: 35, fat: 18, time: '20 min', author: '@carlos_gym', likes: 189, comments: 12 },
];

export const ARTICLES = [
  { id: 'a1', image: require('../../../assets/suples.png'), title: 'Guía completa de suplementos', category: 'Nutrición', readTime: '6 min', level: 'Principiante' },
  { id: 'a2', image: require('../../../assets/SENTADILLA.png'), title: 'Técnica correcta de sentadilla', category: 'Técnica', readTime: '4 min', level: 'Intermedio' },
  { id: 'a3', image: require('../../../assets/estancamiento.png'), title: 'Cómo romper un estancamiento', category: 'Entrenamiento', readTime: '8 min', level: 'Avanzado' },
  { id: 'a4', image: require('../../../assets/suples.png'), title: 'Creatina: todo lo que necesitas saber', category: 'Suplementación', readTime: '5 min', level: 'Principiante' },
  { id: 'a5', image: require('../../../assets/SENTADILLA.png'), title: 'Recuperación muscular efectiva', category: 'Recuperación', readTime: '7 min', level: 'Intermedio' },
];

export const CHALLENGES = [
  { id: 'c1', title: '10.000 pasos al día', participants: '4.2k', daysLeft: 12, progress: 0.4, description: 'Camina 10.000 pasos diarios durante 30 días.', reward: 'Insignia Caminante Élite' },
  { id: 'c2', title: 'Sin azúcar 7 días', participants: '2.8k', daysLeft: 3, progress: 0.7, description: 'Elimina el azúcar añadido de tu dieta.', reward: 'Insignia Disciplina' },
  { id: 'c3', title: '100 flexiones diarias', participants: '6.1k', daysLeft: 20, progress: 0.15, description: 'Haz 100 flexiones cada día.', reward: 'Insignia Fuerza' },
];

export const EXERCISE_OF_DAY = {
  image: require('../../../assets/dominadas.png'),
  name: 'Dominadas lastradas',
  muscle: 'Espalda y bíceps',
  difficulty: 'Avanzado',
  sets: '4 series',
  reps: '8-12 reps',
  rest: '90 segundos',
  execution: '1. Cuelga de la barra con agarre prono.\n2. Tira del cuerpo hacia arriba hasta que la barbilla supere la barra.\n3. Baja de forma controlada.\n4. Repite.',
  mistakes: '• No usar impulso\n• No arquear la espalda\n• Controlar la bajada',
  variants: '• Dominadas neutras\n• Dominadas supinas\n• Dominadas amplias',
};