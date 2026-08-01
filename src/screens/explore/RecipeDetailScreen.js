// src/screens/explore/RecipeDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Dimensions, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import BottomTabBar from '../../../components/BottomTabBar';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const SURFACE2 = '#1E1E1E';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';
const PURPLE = '#8B7CFF';
const ORANGE = '#FF6B3E';
const CYAN = '#3EE5FF';
const PINK = '#FF3EAA';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// BASE DE DATOS DE RECETAS IA (100% reales, basadas en nutrición deportiva)
// ─────────────────────────────────────────────────────────────────────────────
const RECIPES_DATA = {
  'bowl-pollo': {
    name: 'Bowl Proteico de Pollo',
    subtitle: 'Alto en proteína · Post-entreno',
    category: 'Almuerzo',
    difficulty: 'Fácil',
    time: '20 min',
    servings: 1,
    description: 'Bowl completo con pollo a la plancha, quinoa, aguacate y vegetales. Ideal para después del entrenamiento gracias a su alto contenido proteico y carbohidratos complejos.',
    image: require('../../../assets/pancakes.png'),
    macros: { calories: 520, protein: 48, carbs: 52, fat: 14 },
    tags: ['Alto en proteína', 'Post-entreno', 'Sin gluten'],
    ingredients: [
      { name: 'Pechuga de pollo', amount: '150g' },
      { name: 'Quinoa cocida', amount: '100g' },
      { name: 'Aguacate', amount: '1/2 unidad' },
      { name: 'Espinacas frescas', amount: '50g' },
      { name: 'Tomate cherry', amount: '6 unidades' },
      { name: 'Aceite de oliva', amount: '1 cdta' },
      { name: 'Limón', amount: '1/2 unidad' },
      { name: 'Sal y pimienta', amount: 'al gusto' },
    ],
    steps: [
      'Sazona la pechuga con sal, pimienta y limón. Cocina a la plancha 6-7 min por lado.',
      'Cocina la quinoa según instrucciones del paquete (generalmente 15 min).',
      'Corta el aguacate en láminas y los tomates cherry por la mitad.',
      'En un bowl, coloca la quinoa como base y añade las espinacas.',
      'Agrega el pollo cortado en tiras, el aguacate y los tomates.',
      'Rocía con aceite de oliva y un chorrito de limón. ¡Listo!',
    ],
    tips: 'Puedes preparar la quinoa en batch el domingo y guardarla en la nevera para toda la semana.',
  },
  'pancakes-avena': {
    name: 'Pancakes de Avena Fit',
    subtitle: 'Desayuno energético',
    category: 'Desayuno',
    difficulty: 'Fácil',
    time: '15 min',
    servings: 2,
    description: 'Pancakes esponjosos hechos con avena, claras de huevo y plátano. Sin azúcar añadida, perfectos para empezar el día con energía sostenida.',
    image: require('../../../assets/pancakes.png'),
    macros: { calories: 380, protein: 28, carbs: 54, fat: 6 },
    tags: ['Desayuno', 'Alto en fibra', 'Sin azúcar'],
    ingredients: [
      { name: 'Avena en hojuelas', amount: '80g' },
      { name: 'Claras de huevo', amount: '150ml' },
      { name: 'Plátano maduro', amount: '1 unidad' },
      { name: 'Canela en polvo', amount: '1 cdta' },
      { name: 'Yogur griego 0%', amount: '100g' },
      { name: 'Arándanos frescos', amount: '30g' },
      { name: 'Miel (opcional)', amount: '1 cdta' },
    ],
    steps: [
      'Licúa la avena hasta convertirla en harina.',
      'En un bowl, mezcla la harina de avena con las claras, el plátano machacado y la canela.',
      'Deja reposar la mezcla 5 minutos.',
      'Calienta una sartén antiadherente a fuego medio.',
      'Vierte porciones de masa y cocina 2 min por cada lado.',
      'Sirve con yogur griego, arándanos y un toque de miel.',
    ],
    tips: 'Puedes congelar los pancakes y tostarlos cuando los quieras comer.',
  },
  'wrap-atun': {
    name: 'Wrap de Atún y Aguacate',
    subtitle: 'Rápido y nutritivo',
    category: 'Almuerzo',
    difficulty: 'Fácil',
    time: '10 min',
    servings: 1,
    description: 'Wrap integral relleno de atún, aguacate cremoso y vegetales frescos. Perfecto para llevar al trabajo o comer rápido sin sacrificar nutrición.',
    image: require('../../../assets/wrap.png'),
    macros: { calories: 420, protein: 35, carbs: 38, fat: 16 },
    tags: ['Alto en proteína', 'Omega-3', 'Rápido'],
    ingredients: [
      { name: 'Tortilla integral', amount: '1 unidad grande' },
      { name: 'Atún en agua', amount: '1 lata (120g)' },
      { name: 'Aguacate', amount: '1/2 unidad' },
      { name: 'Lechuga', amount: '3 hojas' },
      { name: 'Tomate', amount: '1/2 unidad' },
      { name: 'Yogur griego', amount: '2 cdas' },
      { name: 'Mostaza', amount: '1 cdta' },
      { name: 'Sal y pimienta', amount: 'al gusto' },
    ],
    steps: [
      'Escurre bien el atún y colócalo en un bowl.',
      'Machaca el aguacate y mézclalo con el atún, yogur griego y mostaza.',
      'Sazona con sal y pimienta al gusto.',
      'Extiende la tortilla y coloca las hojas de lechuga.',
      'Agrega la mezcla de atún y el tomate en rodajas.',
      'Enrolla firmemente y corta por la mitad.',
    ],
    tips: 'El yogur griego reemplaza la mayonesa con mucha menos grasa y más proteína.',
  },
  'batido-post-entreno': {
    name: 'Batido Post-Entreno',
    subtitle: 'Recuperación muscular',
    category: 'Post-entreno',
    difficulty: 'Muy fácil',
    time: '5 min',
    servings: 1,
    description: 'Batido con whey protein, plátano y avena. La combinación perfecta de proteína rápida y carbohidratos para recuperar glucógeno muscular después de entrenar.',
    image: require('../../../assets/pancakes.png'),
    macros: { calories: 420, protein: 38, carbs: 52, fat: 8 },
    tags: ['Post-entreno', 'Recuperación', 'Alto en proteína'],
    ingredients: [
      { name: 'Whey protein sabor vainilla', amount: '30g (1 scoop)' },
      { name: 'Plátano', amount: '1 unidad' },
      { name: 'Avena', amount: '40g' },
      { name: 'Leche de almendras', amount: '250ml' },
      { name: 'Mantequilla de maní', amount: '1 cda' },
      { name: 'Canela', amount: '1 pizca' },
      { name: 'Hielo', amount: '4 cubos' },
    ],
    steps: [
      'Agrega la leche de almendras a la licuadora.',
      'Añade el plátano cortado en trozos.',
      'Incorpora la avena, el whey protein y la mantequilla de maní.',
      'Agrega la canela y el hielo.',
      'Licúa a velocidad alta por 45 segundos.',
      'Sirve inmediatamente para máxima absorción.',
    ],
    tips: 'Consume este batido dentro de los 30 minutos posteriores al entrenamiento para óptima recuperación.',
  },
  'salmon-quinoa': {
    name: 'Salmón con Quinoa',
    subtitle: 'Omega-3 + Proteína completa',
    category: 'Cena',
    difficulty: 'Media',
    time: '25 min',
    servings: 1,
    description: 'Salmón al horno con costra de hierbas, acompañado de quinoa y espárragos. Rico en omega-3, ideal para la salud cardiovascular y la recuperación muscular.',
    image: require('../../../assets/pancakes.png'),
    macros: { calories: 580, protein: 42, carbs: 40, fat: 24 },
    tags: ['Omega-3', 'Alto en proteína', 'Cena'],
    ingredients: [
      { name: 'Filete de salmón', amount: '180g' },
      { name: 'Quinoa', amount: '80g (cruda)' },
      { name: 'Espárragos', amount: '100g' },
      { name: 'Aceite de oliva', amount: '1 cda' },
      { name: 'Ajo', amount: '2 dientes' },
      { name: 'Eneldo fresco', amount: '1 cda' },
      { name: 'Limón', amount: '1/2 unidad' },
      { name: 'Sal y pimienta', amount: 'al gusto' },
    ],
    steps: [
      'Precalienta el horno a 200°C.',
      'Cocina la quinoa en agua con sal por 15 minutos.',
      'Sazona el salmón con sal, pimienta, ajo picado y eneldo.',
      'Coloca el salmón en una bandeja con papel de horno.',
      'Acompaña con los espárragos y rocía con aceite de oliva.',
      'Hornea 12-15 minutos hasta que esté dorado.',
      'Sirve con la quinoa y un chorrito de limón.',
    ],
    tips: 'El salmón salvaje tiene más omega-3 que el de criadero.',
  },
  'tacos-fit': {
    name: 'Tacos de Pollo Fit',
    subtitle: 'Sabor mexicano saludable',
    category: 'Almuerzo',
    difficulty: 'Media',
    time: '25 min',
    servings: 2,
    description: 'Tacos con tortilla de maíz, pollo especiado, pico de gallo y aguacate. Toda la esencia mexicana con macros optimizados para tus objetivos.',
    image: require('../../../assets/wrap.png'),
    macros: { calories: 480, protein: 40, carbs: 42, fat: 16 },
    tags: ['Alto en proteína', 'Sin gluten', 'Mexicano'],
    ingredients: [
      { name: 'Pechuga de pollo', amount: '200g' },
      { name: 'Tortillas de maíz', amount: '4 unidades' },
      { name: 'Tomate', amount: '2 unidades' },
      { name: 'Cebolla morada', amount: '1/2 unidad' },
      { name: 'Cilantro fresco', amount: '1 puñado' },
      { name: 'Aguacate', amount: '1/2 unidad' },
      { name: 'Limón', amount: '1 unidad' },
      { name: 'Comino, paprika, ajo', amount: 'al gusto' },
    ],
    steps: [
      'Corta el pollo en tiras y sazónalo con comino, paprika, ajo, sal y pimienta.',
      'Cocina el pollo a la plancha 6-8 minutos hasta dorar.',
      'Para el pico de gallo: pica tomate, cebolla y cilantro. Agrega limón y sal.',
      'Calienta las tortillas en una sartén seca.',
      'Rellena cada tortilla con pollo, pico de gallo y aguacate.',
      'Acompaña con limón y salsa picante al gusto.',
    ],
    tips: 'Las tortillas de maíz tienen menos calorías y más fibra que las de harina.',
  },
  'pasta-proteica': {
    name: 'Pasta Proteica con Pavo',
    subtitle: 'Carbohidratos + Proteína',
    category: 'Almuerzo',
    difficulty: 'Fácil',
    time: '20 min',
    servings: 1,
    description: 'Pasta integral con pavo molido magro, salsa de tomate casera y vegetales. La combinación ideal para días de entrenamiento intenso.',
    image: require('../../../assets/pancakes.png'),
    macros: { calories: 560, protein: 45, carbs: 62, fat: 12 },
    tags: ['Alto en proteína', 'Carbohidratos complejos', 'Pre-entreno'],
    ingredients: [
      { name: 'Pasta integral', amount: '100g (cruda)' },
      { name: 'Pavo molido magro', amount: '150g' },
      { name: 'Salsa de tomate', amount: '150ml' },
      { name: 'Champiñones', amount: '80g' },
      { name: 'Ajo', amount: '2 dientes' },
      { name: 'Orégano', amount: '1 cdta' },
      { name: 'Queso parmesano', amount: '15g' },
      { name: 'Aceite de oliva', amount: '1 cdta' },
    ],
    steps: [
      'Cocina la pasta según instrucciones del paquete.',
      'En una sartén, sofríe el ajo con aceite de oliva.',
      'Agrega el pavo molido y cocina hasta dorar (5-6 min).',
      'Incorpora los champiñones laminados y cocina 3 min más.',
      'Añade la salsa de tomate, orégano, sal y pimienta.',
      'Mezcla la pasta con la salsa y sirve con parmesano rallado.',
    ],
    tips: 'Ideal 2-3 horas antes de entrenar por su combinación de carbohidratos y proteína.',
  },
  'ensalada-cesar-fit': {
    name: 'Ensalada César Fit',
    subtitle: 'Clásica reinventada',
    category: 'Almuerzo',
    difficulty: 'Fácil',
    time: '15 min',
    servings: 1,
    description: 'Versión saludable de la clásica ensalada César con pollo a la plancha, aderezo de yogur griego y crutones integrales. Ligera pero saciante.',
    image: require('../../../assets/wrap.png'),
    macros: { calories: 420, protein: 38, carbs: 22, fat: 20 },
    tags: ['Bajo en carbohidratos', 'Alto en proteína', 'Ligera'],
    ingredients: [
      { name: 'Pechuga de pollo', amount: '150g' },
      { name: 'Lechuga romana', amount: '150g' },
      { name: 'Yogur griego natural', amount: '80g' },
      { name: 'Queso parmesano', amount: '20g' },
      { name: 'Pan integral', amount: '30g' },
      { name: 'Ajo', amount: '1 diente' },
      { name: 'Limón', amount: '1/2 unidad' },
      { name: 'Anchoas (opcional)', amount: '2 filetes' },
    ],
    steps: [
      'Cocina el pollo a la plancha con sal y pimienta.',
      'Corta el pan en cubos y tuéstalos en el horno con ajo.',
      'Para el aderezo: mezcla yogur griego, limón, ajo picado y parmesano.',
      'Lava y corta la lechuga en trozos.',
      'Corta el pollo en tiras.',
      'Monta la ensalada con lechuga, pollo, crutones y aderezo.',
    ],
    tips: 'El yogur griego reemplaza la mayonesa con 80% menos grasa.',
  },
  'arroz-pollo-curry': {
    name: 'Arroz con Pollo al Curry',
    subtitle: 'Sabor asiático proteico',
    category: 'Almuerzo',
    difficulty: 'Media',
    time: '30 min',
    servings: 2,
    description: 'Arroz basmati con pollo al curry suave, leche de coco light y vegetales. Rico en especias antiinflamatorias como la cúrcuma.',
    image: require('../../../assets/pancakes.png'),
    macros: { calories: 540, protein: 42, carbs: 58, fat: 14 },
    tags: ['Alto en proteína', 'Antiinflamatorio', 'Especiado'],
    ingredients: [
      { name: 'Pechuga de pollo', amount: '250g' },
      { name: 'Arroz basmati', amount: '150g (crudo)' },
      { name: 'Leche de coco light', amount: '100ml' },
      { name: 'Pasta de curry', amount: '2 cdas' },
      { name: 'Pimiento', amount: '1 unidad' },
      { name: 'Cebolla', amount: '1 unidad' },
      { name: 'Jengibre fresco', amount: '1 cda' },
      { name: 'Cilantro fresco', amount: 'al gusto' },
    ],
    steps: [
      'Cocina el arroz basmati según instrucciones.',
      'Corta el pollo en cubos y saltéalo en una sartén.',
      'Sofríe cebolla, pimiento y jengibre rallado.',
      'Agrega la pasta de curry y cocina 1 minuto.',
      'Incorpora el pollo y la leche de coco. Cocina 10 min.',
      'Sirve sobre el arroz con cilantro fresco.',
    ],
    tips: 'La cúrcuma del curry tiene propiedades antiinflamatorias potentes.',
  },
  'overnight-oats': {
    name: 'Overnight Oats Proteicos',
    subtitle: 'Desayuno sin cocinar',
    category: 'Desayuno',
    difficulty: 'Muy fácil',
    time: '5 min (+ reposo)',
    servings: 1,
    description: 'Avena remojada toda la noche con yogur griego, semillas de chía y whey protein. Desayuno listo en la mañana, alto en proteína y fibra.',
    image: require('../../../assets/pancakes.png'),
    macros: { calories: 450, protein: 35, carbs: 58, fat: 10 },
    tags: ['Desayuno', 'Meal prep', 'Alto en fibra'],
    ingredients: [
      { name: 'Avena en hojuelas', amount: '60g' },
      { name: 'Yogur griego 0%', amount: '150g' },
      { name: 'Leche de almendras', amount: '100ml' },
      { name: 'Whey protein', amount: '1 scoop (30g)' },
      { name: 'Semillas de chía', amount: '1 cda' },
      { name: 'Frutos rojos', amount: '80g' },
      { name: 'Mantequilla de almendras', amount: '1 cda' },
    ],
    steps: [
      'En un frasco, mezcla la avena, yogur, leche y semillas de chía.',
      'Agrega el whey protein y mezcla bien.',
      'Refrigera toda la noche (mínimo 4 horas).',
      'En la mañana, agrega los frutos rojos por encima.',
      'Corona con mantequilla de almendras.',
      '¡Listo para comer frío!',
    ],
    tips: 'Puedes preparar 3-4 frascos el domingo para toda la semana.',
  },
  'revuelto-claras': {
    name: 'Revuelto de Claras con Espinacas',
    subtitle: 'Desayuno proteico clásico',
    category: 'Desayuno',
    difficulty: 'Fácil',
    time: '10 min',
    servings: 1,
    description: 'Claras de huevo revueltas con espinacas, champiñones y queso feta. Desayuno alto en proteína y bajo en calorías para empezar el día.',
    image: require('../../../assets/pancakes.png'),
    macros: { calories: 280, protein: 32, carbs: 8, fat: 14 },
    tags: ['Desayuno', 'Bajo en carbohidratos', 'Alto en proteína'],
    ingredients: [
      { name: 'Claras de huevo', amount: '200ml' },
      { name: 'Huevo entero', amount: '1 unidad' },
      { name: 'Espinacas frescas', amount: '60g' },
      { name: 'Champiñones', amount: '60g' },
      { name: 'Queso feta', amount: '30g' },
      { name: 'Tomate', amount: '1/2 unidad' },
      { name: 'Aceite de oliva', amount: '1 cdta' },
    ],
    steps: [
      'Calienta el aceite en una sartén antiadherente.',
      'Sofríe los champiñones laminados 2 minutos.',
      'Agrega las espinacas y cocina hasta que se marchiten.',
      'Vierte las claras y el huevo entero batidos.',
      'Cocina a fuego medio removiendo constantemente.',
      'Sirve con queso feta desmenuzado y tomate.',
    ],
    tips: 'Las claras tienen 11g de proteína por cada 100ml con casi 0 grasa.',
  },
  'yogur-proteico': {
    name: 'Yogur Proteico con Granola',
    subtitle: 'Snack rápido',
    category: 'Snack',
    difficulty: 'Muy fácil',
    time: '5 min',
    servings: 1,
    description: 'Yogur griego con granola casera, frutas frescas y semillas. Snack perfecto entre comidas o post-entreno ligero.',
    image: require('../../../assets/pancakes.png'),
    macros: { calories: 320, protein: 24, carbs: 38, fat: 10 },
    tags: ['Snack', 'Alto en proteína', 'Rápido'],
    ingredients: [
      { name: 'Yogur griego 0%', amount: '200g' },
      { name: 'Granola sin azúcar', amount: '30g' },
      { name: 'Plátano', amount: '1/2 unidad' },
      { name: 'Arándanos', amount: '30g' },
      { name: 'Semillas de calabaza', amount: '1 cda' },
      { name: 'Miel', amount: '1 cdta (opcional)' },
    ],
    steps: [
      'Sirve el yogur griego en un bowl.',
      'Corta el plátano en rodajas.',
      'Agrega la granola, plátano y arándanos.',
      'Espolvorea las semillas de calabaza.',
      'Añade un toque de miel si deseas.',
      '¡Disfruta inmediatamente!',
    ],
    tips: 'El yogur griego tiene el doble de proteína que el yogur normal.',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams();
  const recipe = RECIPES_DATA[id] || RECIPES_DATA['bowl-pollo'];
  
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [saved, setSaved] = useState(false);
  useEffect(() => {
  async function checkIfSaved() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('saved_recipes')
      .select('id')
      .eq('user_id', user.id)
      .eq('recipe_id', id)
      .maybeSingle();

    if (data) setSaved(true);
  }
  checkIfSaved();
}, [id]);

  const toggleIngredient = (idx) => {
    setCheckedIngredients(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Calcular porcentaje de macros
  const totalMacroCals = (recipe.macros.protein * 4) + (recipe.macros.carbs * 4) + (recipe.macros.fat * 9);
  const proteinPct = Math.round(((recipe.macros.protein * 4) / totalMacroCals) * 100);
  const carbsPct = Math.round(((recipe.macros.carbs * 4) / totalMacroCals) * 100);
  const fatPct = Math.round(((recipe.macros.fat * 9) / totalMacroCals) * 100);

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View style={s.heroSection}>
          <Image source={recipe.image} style={s.heroImage} />
          <View style={s.heroGradient} />
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={T1} />
          </TouchableOpacity>
          <View style={s.heroBottom}>
            <View style={s.categoryBadge}>
              <Ionicons name="sparkles" size={12} color={BG} />
              <Text style={s.categoryBadgeText}>{recipe.category}</Text>
            </View>
            <Text style={s.heroTitle}>{recipe.name}</Text>
            <Text style={s.heroSubtitle}>{recipe.subtitle}</Text>
          </View>
        </View>

        {/* MACROS CARD */}
        <View style={s.macrosCard}>
          <View style={s.macroItem}>
            <Text style={[s.macroValue, { color: ACCENT }]}>{recipe.macros.calories}</Text>
            <Text style={s.macroLabel}>Calorías</Text>
          </View>
          <View style={s.macroDivider} />
          <View style={s.macroItem}>
            <Text style={[s.macroValue, { color: ORANGE }]}>{recipe.macros.protein}g</Text>
            <Text style={s.macroLabel}>Proteína</Text>
          </View>
          <View style={s.macroDivider} />
          <View style={s.macroItem}>
            <Text style={[s.macroValue, { color: CYAN }]}>{recipe.macros.carbs}g</Text>
            <Text style={s.macroLabel}>Carbos</Text>
          </View>
          <View style={s.macroDivider} />
          <View style={s.macroItem}>
            <Text style={[s.macroValue, { color: PINK }]}>{recipe.macros.fat}g</Text>
            <Text style={s.macroLabel}>Grasas</Text>
          </View>
        </View>

        {/* DISTRIBUTION BAR */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Distribución calórica</Text>
          <View style={s.distributionBar}>
            <View style={[s.distributionSegment, { flex: proteinPct, backgroundColor: ORANGE }]} />
            <View style={[s.distributionSegment, { flex: carbsPct, backgroundColor: CYAN }]} />
            <View style={[s.distributionSegment, { flex: fatPct, backgroundColor: PINK }]} />
          </View>
          <View style={s.distributionLegend}>
            <LegendItem color={ORANGE} label="Proteína" value={`${proteinPct}%`} />
            <LegendItem color={CYAN} label="Carbos" value={`${carbsPct}%`} />
            <LegendItem color={PINK} label="Grasas" value={`${fatPct}%`} />
          </View>
        </View>

        {/* INFO ROW */}
        <View style={s.infoRow}>
          <InfoItem icon="⏱️" label="Tiempo" value={recipe.time} />
          <InfoItem icon="👤" label="Porciones" value={String(recipe.servings)} />
          <InfoItem icon="📊" label="Dificultad" value={recipe.difficulty} />
        </View>

        {/* DESCRIPCIÓN */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Descripción</Text>
          <View style={s.descriptionCard}>
            <Text style={s.descriptionText}>{recipe.description}</Text>
          </View>
        </View>

        {/* TAGS */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Características</Text>
          <View style={s.tagsRow}>
            {recipe.tags.map((tag, idx) => (
              <View key={idx} style={s.tag}>
                <Ionicons name="checkmark-circle" size={12} color={ACCENT} />
                <Text style={s.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* INGREDIENTES */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Ingredientes</Text>
          <View style={s.ingredientsCard}>
            {recipe.ingredients.map((ing, idx) => (
              <TouchableOpacity
                key={idx}
                style={[s.ingredientRow, checkedIngredients[idx] && s.ingredientRowChecked]}
                onPress={() => toggleIngredient(idx)}
                activeOpacity={0.7}
              >
                <View style={[s.checkbox, checkedIngredients[idx] && s.checkboxChecked]}>
                  {checkedIngredients[idx] && <Ionicons name="checkmark" size={14} color={BG} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.ingredientName, checkedIngredients[idx] && s.ingredientNameChecked]}>
                    {ing.name}
                  </Text>
                </View>
                <Text style={s.ingredientAmount}>{ing.amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* PASOS */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Preparación</Text>
          <View style={s.stepsCard}>
            {recipe.steps.map((step, idx) => (
              <View key={idx} style={s.stepRow}>
                <View style={s.stepNumber}>
                  <Text style={s.stepNumberText}>{idx + 1}</Text>
                </View>
                <Text style={s.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* TIP */}
        {recipe.tips && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>💡 Tip del coach</Text>
            <View style={s.tipCard}>
              <Ionicons name="bulb" size={18} color={ACCENT} />
              <Text style={s.tipText}>{recipe.tips}</Text>
            </View>
          </View>
        )}

        {/* BOTÓN GUARDAR */}
<TouchableOpacity
  style={[s.saveBtn, saved && s.saveBtnSaved]}
  onPress={async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión');
      return;
    }

    if (saved) {
      // Eliminar de favoritas
      const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', id);

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setSaved(false);
        Alert.alert('Receta eliminada', 'Se eliminó de tus favoritas');
      }
    } else {
      // Guardar en favoritas
      // Dentro de RecipeDetailScreen.js, en la función de guardar:
const { error } = await supabase
  .from('saved_recipes')
  .insert({
    user_id: user.id,
    recipe_id: id,
    recipe_name: recipe.name,
    recipe_image: recipe.image ? 'asset' : null,
    recipe_category: recipe.category,
    protein: recipe.macros.protein,
    calories: recipe.macros.calories,
    carbs: recipe.macros.carbs,   // ← AGREGAR
    fat: recipe.macros.fat,       // ← AGREGAR
    time: recipe.time,
  });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setSaved(true);
        Alert.alert('¡Receta guardada!', 'Aparecerá como acceso rápido en Nutrición');
      }
    }
  }}
  activeOpacity={0.85}
>
          <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={20} color={saved ? BG : ACCENT} />
          <Text style={[s.saveBtnText, saved && s.saveBtnTextSaved]}>
            {saved ? 'Guardada' : 'Guardar receta'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBCOMPONENTES
// ─────────────────────────────────────────────────────────────────────────────
function LegendItem({ color, label, value }) {
  return (
    <View style={s.legendItem}>
      <View style={[s.legendDot, { backgroundColor: color }]} />
      <Text style={s.legendLabel}>{label}</Text>
      <Text style={s.legendValue}>{value}</Text>
    </View>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <View style={s.infoItem}>
      <Text style={s.infoIcon}>{icon}</Text>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  heroSection: { width: '100%', height: 320, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, backgroundColor: 'rgba(13,13,13,0.95)' },
  backBtn: { position: 'absolute', top: 56, left: 20, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  heroBottom: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  categoryBadge: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: ACCENT, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 12, gap: 6, alignItems: 'center' },
  categoryBadgeText: { fontSize: 11, fontWeight: '800', color: BG },
  heroTitle: { fontSize: 30, fontWeight: '800', color: T1, marginBottom: 6, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 15, color: T2, fontWeight: '500' },

  // Macros card
  macrosCard: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  macroItem: { flex: 1, alignItems: 'center' },
  macroValue: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  macroLabel: { fontSize: 10, color: T3, fontWeight: '600' },
  macroDivider: { width: 1, height: 40, backgroundColor: BORDER, marginVertical: 4 },

  // Distribution bar
  section: { marginTop: 28, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: T1, marginBottom: 12 },
  distributionBar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: SURFACE2, marginBottom: 12 },
  distributionSegment: { height: '100%' },
  distributionLegend: { flexDirection: 'row', justifyContent: 'space-between' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: T2 },
  legendValue: { fontSize: 11, color: T1, fontWeight: '700' },

  // Info row
  infoRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  infoItem: { flex: 1, alignItems: 'center' },
  infoIcon: { fontSize: 20, marginBottom: 4 },
  infoLabel: { fontSize: 10, color: T3, fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 13, color: T1, fontWeight: '700' },

  descriptionCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER, borderLeftWidth: 4, borderLeftColor: ACCENT },
  descriptionText: { fontSize: 14, color: T2, lineHeight: 22 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: SURFACE, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: BORDER },
  tagText: { fontSize: 11, color: T2, fontWeight: '600' },

  ingredientsCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 8, borderWidth: 1, borderColor: BORDER },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: BORDER, gap: 12 },
  ingredientRowChecked: { opacity: 0.5 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: T3, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: ACCENT, borderColor: ACCENT },
  ingredientName: { fontSize: 14, color: T1, fontWeight: '600' },
  ingredientNameChecked: { textDecorationLine: 'line-through' },
  ingredientAmount: { fontSize: 12, color: T3, fontWeight: '600' },

  stepsCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 13, fontWeight: '800', color: BG },
  stepText: { flex: 1, fontSize: 14, color: T2, lineHeight: 20, paddingTop: 3 },

  tipCard: { flexDirection: 'row', gap: 10, backgroundColor: ACCENT + '15', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: ACCENT + '40' },
  tipText: { flex: 1, fontSize: 13, color: T2, lineHeight: 20 },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: SURFACE, borderWidth: 2, borderColor: ACCENT, borderRadius: 16, paddingVertical: 16, marginHorizontal: 20, marginTop: 28 },
  saveBtnSaved: { backgroundColor: ACCENT },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: ACCENT },
  saveBtnTextSaved: { color: BG },
});