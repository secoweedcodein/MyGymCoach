// src/screens/NutritionScreen.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, ActivityIndicator, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import BarcodeScannerScreen from '../../src/screens/BarcodeScannerScreen.js';

const ACCENT  = '#C0FF3E';
const BG      = '#0D0D0D';
const SURFACE = '#161616';
const SRF2    = '#1E1E1E';
const BORDER  = '#FFFFFF0D';
const BORDER2 = '#FFFFFF18';
const T1      = '#FFFFFF';
const T2      = '#A0A0A0';
const T3      = '#555555';

const MEAL_CONFIG = {
  breakfast: { label: 'Desayuno', icon: '🌅', color: '#FFCD00' },
  lunch:     { label: 'Almuerzo', icon: '☀️',  color: '#3EE5FF' },
  dinner:    { label: 'Cena',     icon: '🌙',  color: '#A78BFA' },
  snack:     { label: 'Snack',    icon: '🍎',  color: '#FF6B3E' },
};

const MACRO_CONFIG = [
  { key: 'carbs',   label: 'Carbos',   goalKey: 'carbs_g',   color: ACCENT,    unit: 'g' },
  { key: 'protein', label: 'Proteína', goalKey: 'protein_g', color: '#3E8EFF', unit: 'g' },
  { key: 'fat',     label: 'Grasas',   goalKey: 'fat_g',     color: '#FF6B3E', unit: 'g' },
];

// ── Anillo de calorías (SVG manual) ──────────────────────────────────────────
function CalorieRing({ consumed, goal }) {
  const pct    = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const over   = consumed > goal;
  const color  = over ? '#FF453A' : consumed / goal > 0.85 ? '#FF9500' : ACCENT;
  const remaining = Math.max(goal - consumed, 0);

  const animPct = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(animPct, { toValue: pct, duration: 800, useNativeDriver: false }).start();
  }, [pct]);

  const SIZE   = 120;
  const STROKE = 10;

  return (
    <View style={rg.wrap}>
      <View style={[rg.track, { width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: STROKE, borderColor: SRF2 }]} />
      <RingArc progress={pct} color={color} size={SIZE} stroke={STROKE} />
      <View style={rg.center}>
        <Text style={[rg.consumed, { color }]}>{Math.round(consumed)}</Text>
        <Text style={rg.unit}>kcal</Text>
        <Text style={rg.remaining}>
          {over ? `+${Math.round(consumed - goal)} extra` : `${Math.round(remaining)} rest.`}
        </Text>
      </View>
    </View>
  );
}

function RingArc({ progress, color, size, stroke }) {
  const pct  = Math.max(0, Math.min(1, progress));
  const half = size / 2;
  const q    = [
    pct >= 0.25 ? 1 : pct / 0.25,
    pct >= 0.50 ? 1 : Math.max(0, (pct - 0.25) / 0.25),
    pct >= 0.75 ? 1 : Math.max(0, (pct - 0.50) / 0.25),
    Math.max(0, (pct - 0.75) / 0.25),
  ];
  return (
    <View style={{ position: 'absolute', width: size, height: size }}>
      {[0, 1, 2, 3].map(i => {
        if (q[i] <= 0) return null;
        return (
          <View key={i} style={{
            position: 'absolute', width: half, height: half,
            top: i < 2 ? 0 : half, left: i === 0 || i === 3 ? half : 0,
            overflow: 'hidden', opacity: q[i],
          }}>
            <View style={{
              position: 'absolute', width: size, height: size,
              top: i < 2 ? 0 : -half, left: i === 0 || i === 3 ? -half : 0,
              borderRadius: half, borderWidth: stroke, borderColor: color,
              transform: [{ rotate: `${i * 90}deg` }],
            }} />
          </View>
        );
      })}
    </View>
  );
}

const rg = StyleSheet.create({
  wrap:      { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  track:     { position: 'absolute' },
  center:    { position: 'absolute', alignItems: 'center' },
  consumed:  { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, lineHeight: 26 },
  unit:      { fontSize: 9, color: T3, fontWeight: '700', letterSpacing: 0.5 },
  remaining: { fontSize: 9, color: T3, fontWeight: '600', marginTop: 2 },
});

// ── Barra de macro ────────────────────────────────────────────────────────────
function MacroBar({ label, value, goal, color, unit }) {
  const pct     = goal > 0 ? Math.min(value / goal, 1) : 0;
  const widthAn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(widthAn, { toValue: pct, duration: 700, useNativeDriver: false }).start();
  }, [pct]);

  return (
    <View style={mb.wrap}>
      <View style={mb.row}>
        <View style={[mb.dot, { backgroundColor: color }]} />
        <Text style={mb.label}>{label}</Text>
        <Text style={mb.value}>{Math.round(value)}<Text style={mb.unit}>/{goal}{unit}</Text></Text>
      </View>
      <View style={mb.track}>
        <Animated.View style={[mb.fill, {
          backgroundColor: color,
          width: widthAn.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }]} />
      </View>
    </View>
  );
}

const mb = StyleSheet.create({
  wrap:  { marginBottom: 10 },
  row:   { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  dot:   { width: 8, height: 8, borderRadius: 2, marginRight: 8 },
  label: { flex: 1, fontSize: 12, color: T2, fontWeight: '600' },
  value: { fontSize: 12, fontWeight: '800', color: T1 },
  unit:  { fontWeight: '400', color: T3 },
  track: { height: 4, backgroundColor: SRF2, borderRadius: 2, overflow: 'hidden' },
  fill:  { height: 4, borderRadius: 2 },
});

// ── Componente principal ──────────────────────────────────────────────────────
export default function NutritionScreen() {
  const [loading, setLoading]       = useState(true);
  const [userId, setUserId]         = useState(null);
  const [todayLog, setTodayLog]     = useState([]);
  const [goals, setGoals]           = useState(null);
  
  // ✅ NUEVO: Estado para recetas guardadas
  const [savedRecipes, setSavedRecipes] = useState([]);
  
  const [showScanner, setShowScanner] = useState(false);
  const [currentMealType, setCurrentMealType] = useState('breakfast');

  useFocusEffect(useCallback(() => { loadAll(); }, []));

  async function loadAll() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const today = new Date().toISOString().split('T')[0];

    // ✅ NUEVO: Consultamos también la tabla saved_recipes
    const [logsRes, goalsRes, savedRecipesRes] = await Promise.all([
      supabase.from('nutrition_logs').select('*').eq('user_id', user.id).eq('logged_date', today).order('created_at'),
      supabase.from('nutrition_goals').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('saved_recipes').select('*').eq('user_id', user.id).order('saved_at', { ascending: false }).limit(5),
    ]);

    if (logsRes.data) setTodayLog(logsRes.data);
    if (goalsRes.data) setGoals(goalsRes.data);
    if (savedRecipesRes.data) setSavedRecipes(savedRecipesRes.data); // ✅ Guardamos las recetas
    
    setLoading(false);
  }

  async function removeFood(id) {
    await supabase.from('nutrition_logs').delete().eq('id', id);
    loadAll();
  }

  const openScanner = (mealType) => {
    setCurrentMealType(mealType);
    setShowScanner(true);
  };

  const closeScanner = () => {
    setShowScanner(false);
  };

  const handleFoodAdded = (food) => {
    loadAll();
  };

  const totals = todayLog.reduce((acc, item) => ({
    calories: acc.calories + (item.calories  || 0),
    protein:  acc.protein  + (item.protein_g || 0),
    carbs:    acc.carbs    + (item.carbs_g   || 0),
    fat:      acc.fat      + (item.fat_g     || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const byMeal = Object.keys(MEAL_CONFIG).reduce((acc, key) => {
    acc[key] = todayLog.filter(item => item.meal_type === key);
    return acc;
  }, {});

  const today     = new Date();
  const days      = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const months    = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const dateStr   = `${days[today.getDay()]} ${today.getDate()} ${months[today.getMonth()]}`;

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={s.topBar}>
          <View>
            <Text style={s.dateText}>{dateStr}</Text>
            <Text style={s.title}>Nutrición</Text>
          </View>
          <View style={s.headerButtons}>
            <TouchableOpacity style={s.historyBtn} onPress={() => router.push('/nutrition-history')} activeOpacity={0.8}>
              <Text style={s.historyBtnText}>📊</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.planBtn} onPress={() => router.push('/meal-plan')} activeOpacity={0.8}>
              <Text style={s.planBtnText}>📅 Plan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── RESUMEN CALORÍAS ── */}
        <View style={s.summaryCard}>
          <View style={s.summaryGlow} />
          <View style={s.summaryRow}>
            <CalorieRing consumed={totals.calories} goal={goals?.calories ?? 2000} />
            <View style={s.macrosCol}>
              <Text style={s.macrosTitle}>Macros de hoy</Text>
              {MACRO_CONFIG.map(m => (
                <MacroBar key={m.key} label={m.label} value={totals[m.key]} goal={goals?.[m.goalKey] ?? 0} color={m.color} unit={m.unit} />
              ))}
            </View>
          </View>

          {goals && (
            <View style={s.goalBar}>
              <Text style={s.goalBarText}>Meta diaria: {goals.calories} kcal</Text>
              <Text style={s.goalBarRemain}>
                {totals.calories >= goals.calories ? `¡Meta cumplida! 🎉` : `Faltan ${Math.round(goals.calories - totals.calories)} kcal`}
              </Text>
            </View>
          )}
          {!goals && (
            <TouchableOpacity style={s.noGoalBanner} onPress={() => router.push('/profile')} activeOpacity={0.8}>
              <Text style={s.noGoalText}>⚡ Configura tu objetivo calórico en el perfil →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ✅ NUEVO: SECCIÓN DE RECETAS GUARDADAS (ACCESOS RÁPIDOS) */}
        {savedRecipes.length > 0 && (
          <>
            <Text style={s.sectionLabel}>🔖 RECETAS GUARDADAS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.savedRecipesScroll}>
              {savedRecipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={s.savedRecipeCard}
                  onPress={() => router.push(`/explore/recipe-detail?id=${recipe.recipe_id}`)}
                  activeOpacity={0.8}
                >
                  <View style={s.savedRecipeIcon}>
                    <Text style={s.savedRecipeIconText}>🍳</Text>
                  </View>
                  <Text style={s.savedRecipeName} numberOfLines={1}>{recipe.recipe_name}</Text>
                  <Text style={s.savedRecipeMeta}>{recipe.calories} kcal · {recipe.protein}g prot</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* ── COMIDAS DEL DÍA ── */}
        <Text style={s.sectionLabel}>COMIDAS DEL DÍA</Text>

        {Object.entries(MEAL_CONFIG).map(([mealKey, cfg]) => {
          const items    = byMeal[mealKey] || [];
          const mealCals = items.reduce((a, i) => a + (i.calories || 0), 0);

          return (
            <View key={mealKey} style={s.mealCard}>
              <View style={s.mealHdr}>
                <View style={[s.mealIcon, { backgroundColor: cfg.color + '18' }]}>
                  <Text style={{ fontSize: 18 }}>{cfg.icon}</Text>
                </View>
                <View style={s.mealInfo}>
                  <Text style={s.mealName}>{cfg.label}</Text>
                  <Text style={s.mealCal}>
                    {Math.round(mealCals)} kcal
                    {items.length > 0 ? ` · ${items.length} alimentos` : ''}
                  </Text>
                </View>
                <View style={s.mealActions}>
                  <TouchableOpacity style={s.scanMealBtn} onPress={() => openScanner(mealKey)} activeOpacity={0.8}>
                    <Text style={s.scanMealBtnText}>📷</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.addFoodBtn} onPress={() => router.push({ pathname: '/food-search', params: { mealType: mealKey } })} activeOpacity={0.8}>
                    <Text style={s.addFoodBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {items.map(item => (
                <View key={item.id} style={s.foodRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.foodName} numberOfLines={1}>{item.food_name}</Text>
                    <Text style={s.foodMacros}>
                      P {Math.round(item.protein_g)}g · C {Math.round(item.carbs_g)}g · G {Math.round(item.fat_g)}g
                      {item.quantity_g ? ` · ${item.quantity_g}g` : ''}
                    </Text>
                  </View>
                  <Text style={s.foodCal}>{Math.round(item.calories)} kcal</Text>
                  <TouchableOpacity onPress={() => removeFood(item.id)} style={s.removeFood} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={s.removeFoodText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {items.length === 0 && (
                <View style={s.emptyMealActions}>
                  <TouchableOpacity style={s.emptyMealBtn} onPress={() => openScanner(mealKey)} activeOpacity={0.7}>
                    <Text style={s.emptyMealBtnIcon}>📷</Text>
                    <Text style={s.emptyMealBtnText}>Escanear código</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.emptyMealBtn} onPress={() => router.push({ pathname: '/food-search', params: { mealType: mealKey } })} activeOpacity={0.7}>
                    <Text style={s.emptyMealBtnIcon}>🔍</Text>
                    <Text style={s.emptyMealBtnText}>Buscar alimento</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        {/* ── BÚSQUEDA RÁPIDA ── */}
        <TouchableOpacity style={s.searchCard} onPress={() => router.push({ pathname: '/food-search', params: { mealType: 'snack' } })} activeOpacity={0.8}>
          <Text style={s.searchCardIcon}>🔍</Text>
          <View>
            <Text style={s.searchCardTitle}>Buscar alimento</Text>
            <Text style={s.searchCardSub}>Open Food Facts · millones de productos</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>

      {/* ── BOTÓN FLOTANTE DE ESCÁNER ── */}
      <TouchableOpacity style={s.fabScanner} onPress={() => openScanner('snack')} activeOpacity={0.8}>
        <Text style={s.fabScannerText}>📷</Text>
      </TouchableOpacity>

      {/* ── MODAL DEL ESCÁNER ── */}
      <Modal visible={showScanner} animationType="slide" presentationStyle="fullScreen" onRequestClose={closeScanner}>
        <BarcodeScannerScreen userId={userId} mealType={currentMealType} onFoodAdded={handleFoodAdded} onClose={closeScanner} />
      </Modal>

    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: BG },
  scroll:      { padding: 20, paddingTop: 52, paddingBottom: 100 },
  loading:     { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },

  topBar:      { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 },
  dateText:    { fontSize: 12, color: T3, fontWeight: '600', marginBottom: 3 },
  title:       { fontSize: 30, fontWeight: '800', color: T1, letterSpacing: -0.8 },
  headerButtons: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  historyBtn:  { width: 36, height: 36, borderRadius: 18, backgroundColor: ACCENT + '15', borderWidth: 1, borderColor: ACCENT + '33', alignItems: 'center', justifyContent: 'center' },
  historyBtnText: { fontSize: 16 },
  planBtn:     { backgroundColor: ACCENT + '15', borderWidth: 1, borderColor: ACCENT + '33', borderRadius: 20, paddingHorizontal: 13, paddingVertical: 7 },
  planBtnText: { fontSize: 11, fontWeight: '700', color: ACCENT },

  summaryCard: { backgroundColor: SURFACE, borderRadius: 22, padding: 18, marginBottom: 10, borderWidth: 1, borderColor: BORDER, overflow: 'hidden', position: 'relative' },
  summaryGlow: { position: 'absolute', top: -40, left: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: ACCENT, opacity: 0.05 },
  summaryRow:  { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 },
  macrosCol:   { flex: 1 },
  macrosTitle: { fontSize: 12, fontWeight: '700', color: T1, marginBottom: 10 },
  goalBar:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: SRF2, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: BORDER2 },
  goalBarText: { fontSize: 11, color: T3, fontWeight: '600' },
  goalBarRemain:{ fontSize: 11, color: ACCENT, fontWeight: '700' },
  noGoalBanner:{ backgroundColor: ACCENT + '12', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: ACCENT + '25', alignItems: 'center' },
  noGoalText:  { fontSize: 12, color: ACCENT, fontWeight: '700' },

  sectionLabel:{ fontSize: 9, fontWeight: '700', letterSpacing: 2, color: T3, textTransform: 'uppercase', marginTop: 22, marginBottom: 10 },

  // ✅ NUEVOS ESTILOS: Recetas guardadas
  savedRecipesScroll: { marginBottom: 20 },
  savedRecipeCard: {
    width: 140,
    backgroundColor: SURFACE,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: BORDER,
    marginRight: 10,
    alignItems: 'center',
  },
  savedRecipeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCENT + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  savedRecipeIconText: { fontSize: 20 },
  savedRecipeName: {
    fontSize: 12,
    fontWeight: '700',
    color: T1,
    textAlign: 'center',
    marginBottom: 4,
  },
  savedRecipeMeta: {
    fontSize: 10,
    color: T3,
    fontWeight: '600',
    textAlign: 'center',
  },

  mealCard:    { backgroundColor: SURFACE, borderRadius: 18, marginBottom: 8, borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  mealHdr:     { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  mealIcon:    { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  mealInfo:    { flex: 1 },
  mealName:    { fontSize: 14, fontWeight: '700', color: T1 },
  mealCal:     { fontSize: 11, color: T3, marginTop: 2, fontWeight: '500' },
  mealActions: { flexDirection: 'row', gap: 8 },
  scanMealBtn: { width: 30, height: 30, borderRadius: 9, backgroundColor: SRF2, borderWidth: 1, borderColor: BORDER2, alignItems: 'center', justifyContent: 'center' },
  scanMealBtnText:{ fontSize: 14 },
  addFoodBtn:  { width: 30, height: 30, borderRadius: 9, backgroundColor: SRF2, borderWidth: 1, borderColor: BORDER2, alignItems: 'center', justifyContent: 'center' },
  addFoodBtnText:{ fontSize: 18, color: ACCENT, fontWeight: '700', lineHeight: 22 },

  foodRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: BORDER, gap: 8 },
  foodName:    { fontSize: 13, fontWeight: '600', color: T2 },
  foodMacros:  { fontSize: 10, color: T3, marginTop: 2, fontWeight: '500' },
  foodCal:     { fontSize: 12, fontWeight: '700', color: T1 },
  removeFood:  { padding: 4 },
  removeFoodText:{ fontSize: 13, color: T3 },

  emptyMealActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: BORDER },
  emptyMealBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: SRF2, borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: BORDER2 },
  emptyMealBtnIcon: { fontSize: 16, marginRight: 6 },
  emptyMealBtnText: { fontSize: 12, color: T2, fontWeight: '600' },

  searchCard:  { backgroundColor: SURFACE, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: ACCENT + '20', flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  searchCardIcon:{ fontSize: 22 },
  searchCardTitle:{ fontSize: 13, fontWeight: '700', color: ACCENT },
  searchCardSub:{ fontSize: 10, color: T3, marginTop: 2 },

  fabScanner:  { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', shadowColor: ACCENT, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  fabScannerText:{ fontSize: 24 },
});