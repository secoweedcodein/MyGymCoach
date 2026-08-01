// src/screens/FoodSearchScreen.js
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { searchFoods, increaseFoodUsage } from '../../services/foodService';
import CreateFoodModal from '../../components/CreateFoodModal';
import { useAlert } from "../context/AlertContext";

const ACCENT  = '#C0FF3E';
const BG      = '#0D0D0D';
const SURFACE = '#161616';
const SRF2    = '#1E1E1E';
const BORDER  = '#FFFFFF0D';
const BORDER2 = '#FFFFFF18';
const T1      = '#FFFFFF';
const T2      = '#A0A0A0';
const T3      = '#555555';

const MEAL_LABELS = {
  breakfast: 'Desayuno',
  lunch:     'Almuerzo',
  dinner:    'Cena',
  snack:     'Snack',
};

function scaleNutrients(food, grams) {
  const f = grams / 100;
  return {
    calories: Math.round(food.per100g.calories * f),
    protein:  Math.round(food.per100g.protein  * f * 10) / 10,
    carbs:    Math.round(food.per100g.carbs    * f * 10) / 10,
    fat:      Math.round(food.per100g.fat      * f * 10) / 10,
  };
}

export default function FoodSearchScreen() {
  const params   = useLocalSearchParams();
  const mealType = params.mealType || 'snack';

  const [query, setQuery]           = useState('');
  const [results, setResults]       = useState([]);
  const [searching, setSearching]   = useState(false);
  const [searchErr, setSearchErr]   = useState('');
  const [favorites, setFavorites]   = useState([]);
  const [userId, setUserId]         = useState(null);
  const [recentFoods, setRecentFoods] = useState([]);
  
  // ✅ NUEVO: Estado para recetas guardadas
  const [savedRecipes, setSavedRecipes] = useState([]);

  const [showModal, setShowModal]   = useState(false);
  const [selectedFood, setSelected] = useState(null);
  const [grams, setGrams]           = useState('100');
  const [saving, setSaving]         = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { showAlert } = useAlert();
  const debounceRef = useRef(null);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Cargar recientes
      const { data: recent } = await supabase
        .from('recent_foods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (recent) setRecentFoods(recent);

      // Cargar favoritos
      const { data: favs } = await supabase
        .from('food_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (favs) setFavorites(favs);

      // ✅ NUEVO: Cargar recetas guardadas
      const { data: recipes } = await supabase
        .from('saved_recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });
      if (recipes) setSavedRecipes(recipes);
    }
    init();
  }, []);

  function handleQueryChange(text) {
    setQuery(text);
    setSearchErr('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(() => doSearch(text), 600);
  }

  async function doSearch(text) {
    setSearching(true);
    setResults([]);
    try {
      const res = await searchFoods(text);
      setResults(res);
      if (res.length === 0) setSearchErr('Sin resultados. Prueba con otro nombre.');
    } catch (e) {
      setSearchErr(e.message);
    } finally {
      setSearching(false);
    }
  }

  function openModal(food) {
    setSelected(food);
    setGrams('100');
    setShowModal(true);
  }

  async function confirmAdd() {
    if (!selectedFood || !userId) return;
    const g = parseFloat(grams);
    if (!g || g <= 0) { showAlert('Cantidad inválida', 'Ingresa los gramos.'); return; }

    setSaving(true);
    const scaled = scaleNutrients(selectedFood, g);

    await supabase.from('recent_foods').insert({
      user_id:   userId,
      food_name: selectedFood.name,
      food_id:   selectedFood.id,
    });

    const { error } = await supabase.from('nutrition_logs').insert({
      user_id:     userId,
      meal_type:   mealType,
      food_name:   selectedFood.name,
      food_id:     selectedFood.id,
      calories:    scaled.calories,
      protein_g:   scaled.protein,
      carbs_g:     scaled.carbs,
      fat_g:       scaled.fat,
      quantity_g:  g,
      logged_date: new Date().toISOString().split('T')[0],
    });

    setSaving(false);
    if (error) { showAlert('Error', error.message); return; }

    setShowModal(false);
    if (params.planMode === 'true') {
      await supabase.from('meal_plans').insert({
        user_id:     userId,
        week_start:  params.weekStart,
        day_of_week: parseInt(params.dayOfWeek),
        meal_type:   mealType,
        food_name:   selectedFood.name,
        calories:    scaled.calories,
        protein_g:   scaled.protein,
        carbs_g:     scaled.carbs,
        fat_g:       scaled.fat,
      });
      router.back();
      return;
    }

    if (selectedFood.id) await increaseFoodUsage(selectedFood.id);
    router.back();
  }

  // ✅ NUEVO: Función para añadir receta guardada directamente
  async function addSavedRecipe(recipe) {
    if (!userId) return;
    setSaving(true);
    
    const { error } = await supabase.from('nutrition_logs').insert({
      user_id:     userId,
      meal_type:   mealType,
      food_name:   `🍳 ${recipe.recipe_name}`, // Emoji para identificar que es una receta
      food_id:     `recipe_${recipe.recipe_id}`,
      calories:    recipe.calories || 0,
      protein_g:   recipe.protein || 0,
      carbs_g:     recipe.carbs || 0,
      fat_g:       recipe.fat || 0,
      quantity_g:  1, // 1 porción completa de la receta
      logged_date: new Date().toISOString().split('T')[0],
    });

    setSaving(false);
    if (error) {
      showAlert('Error', error.message);
    } else {
      router.back();
    }
  }

  async function toggleFavorite(food) {
    if (!userId) return;
    const existing = favorites.find(f => f.food_id === food.id);
    if (existing) {
      await supabase.from('food_favorites').delete().eq('id', existing.id);
      setFavorites(prev => prev.filter(f => f.food_id !== food.id));
    } else {
      const { data } = await supabase.from('food_favorites').insert({
        user_id:   userId,
        food_name: food.name,
        food_id:   food.id,
        calories:  food.per100g.calories,
        protein_g: food.per100g.protein,
        carbs_g:   food.per100g.carbs,
        fat_g:     food.per100g.fat,
      }).select().single();
      if (data) setFavorites(prev => [data, ...prev]);
    }
  }

  function isFav(food) { return favorites.some(f => f.food_id === food.id); }

  const preview = selectedFood && parseFloat(grams) > 0
    ? scaleNutrients(selectedFood, parseFloat(grams))
    : null;

  const showFavorites = !query.trim() && favorites.length > 0;

  return (
    <>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Text style={s.backBtnText}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={s.title}>Agregar alimento</Text>
            <Text style={s.subtitle}>{MEAL_LABELS[mealType] || mealType}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/barcode')}
          style={s.scanBtn}
          activeOpacity={0.8}
        >
          <Text style={s.scanBtnText}>📷 Escanear código de barras</Text>
        </TouchableOpacity>

        <View style={s.buttonsRow}>
          <TouchableOpacity
            style={s.createBtn}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}
          >
            <Text style={s.createBtnText}>+ Crear alimento</Text>
          </TouchableOpacity>
        </View>

        <CreateFoodModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onFoodCreated={(food) => {
            if (query.trim()) doSearch(query);
          }}
        />

        <View style={s.searchWrap}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            value={query}
            onChangeText={handleQueryChange}
            placeholder="Buscar en base de datos"
            placeholderTextColor={T3}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => query.trim() && doSearch(query)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearchErr(''); }}>
              <Text style={s.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {recentFoods.length > 0 && query.length === 0 && (
            <View>
              <Text style={s.sectionTitle}>Recientes</Text>
              {recentFoods.map(food => (
                <TouchableOpacity
                  key={food.id}
                  style={s.recentItem}
                  onPress={() => { setQuery(food.food_name); doSearch(food.food_name); }}
                >
                  <Text style={{ color: T1 }}>{food.food_name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {searching && (
            <View style={s.center}>
              <ActivityIndicator size="large" color={ACCENT} />
              <Text style={s.loadingText}>Buscando…</Text>
            </View>
          )}

          {!searching && searchErr ? (
            <View style={s.center}>
              <Text style={s.errText}>{searchErr}</Text>
            </View>
          ) : null}

          {showFavorites && !searching && (
            <>
              <Text style={s.sectionLabel}>FAVORITOS</Text>
              {favorites.map(fav => (
                <FoodItem
                  key={fav.id}
                  food={{
                    id: fav.food_id, name: fav.food_name,
                    per100g: { calories: fav.calories, protein: fav.protein_g, carbs: fav.carbs_g, fat: fav.fat_g },
                  }}
                  isFav
                  onAdd={() => openModal({ id: fav.food_id, name: fav.food_name, per100g: { calories: fav.calories, protein: fav.protein_g, carbs: fav.carbs_g, fat: fav.fat_g } })}
                  onFav={() => toggleFavorite({ id: fav.food_id, name: fav.food_name })}
                />
              ))}
            </>
          )}

          {!searching && results.length > 0 && (
            <>
              <Text style={s.sectionLabel}>{results.length} RESULTADOS</Text>
              {results.map(food => (
                <FoodItem
                  key={food.id ?? food.barcode ?? food.name}
                  food={food}
                  isFav={isFav(food)}
                  onAdd={() => openModal(food)}
                  onFav={() => toggleFavorite(food)}
                />
              ))}
            </>
          )}

          {/* ✅ AQUÍ ESTÁ EL CAMBIO: Mostrar recetas guardadas en lugar del placeholder vacío */}
          {!query && !searching && favorites.length === 0 && recentFoods.length === 0 && (
            <>
              <Text style={s.sectionLabel}>🔖 RECETAS GUARDADAS</Text>
              {savedRecipes.length > 0 ? (
                savedRecipes.map(recipe => (
                  <TouchableOpacity
                    key={recipe.id}
                    style={fi.row}
                    onPress={() => addSavedRecipe(recipe)}
                    activeOpacity={0.7}
                    disabled={saving}
                  >
                    <View style={fi.main}>
                      <Text style={fi.name} numberOfLines={2}>🍳 {recipe.recipe_name}</Text>
                      <Text style={fi.brand}>{recipe.recipe_category || 'Receta'} · {recipe.time || 'N/A'}</Text>
                      <Text style={fi.macros}>
                        {recipe.calories || 0} kcal · P {recipe.protein || 0}g
                      </Text>
                    </View>
                    <View style={fi.actions}>
                      <TouchableOpacity 
                        style={[fi.addBtn, saving && { opacity: 0.5 }]} 
                        activeOpacity={0.8}
                      >
                        <Text style={fi.addBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={s.placeholder}>
                  <Text style={s.placeholderIcon}>📭</Text>
                  <Text style={s.placeholderTitle}>No tienes recetas guardadas</Text>
                  <Text style={s.placeholderSub}>Guarda recetas en la pestaña Explorar para verlas aquí</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={m.overlay}>
          <View style={m.sheet}>
            <View style={m.handle} />
            {selectedFood && (
              <>
                <Text style={m.foodName} numberOfLines={2}>{selectedFood.name}</Text>
                <Text style={m.foodBrand}>{selectedFood.brand || 'Open Food Facts'}</Text>

                <Text style={m.label}>CANTIDAD (gramos)</Text>
                <View style={m.gramsRow}>
                  {['50', '100', '150', '200'].map(g => (
                    <TouchableOpacity
                      key={g}
                      style={[m.gramPreset, grams === g && m.gramPresetActive]}
                      onPress={() => setGrams(g)}
                    >
                      <Text style={[m.gramPresetText, grams === g && m.gramPresetTextActive]}>{g}g</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={m.gramsInput}
                  value={grams}
                  onChangeText={setGrams}
                  keyboardType="decimal-pad"
                  placeholder="100"
                  placeholderTextColor={T3}
                  selectTextOnFocus
                />

                {preview && (
                  <View style={m.preview}>
                    <MacroPreview label="Calorías" value={preview.calories} unit="kcal" color={ACCENT} />
                    <MacroPreview label="Prot."    value={preview.protein}  unit="g"    color="#3E8EFF" />
                    <MacroPreview label="Carbos"   value={preview.carbs}    unit="g"    color={ACCENT} />
                    <MacroPreview label="Grasas"   value={preview.fat}      unit="g"    color="#FF6B3E" />
                  </View>
                )}

                <TouchableOpacity
                  style={[m.addBtn, saving && { opacity: 0.6 }]}
                  onPress={confirmAdd}
                  activeOpacity={0.8}
                  disabled={saving}
                >
                  <Text style={m.addBtnText}>
                    {saving ? 'Añadiendo…' : `Añadir al ${MEAL_LABELS[mealType]}`}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={m.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={m.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <CreateFoodModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onFoodCreated={(food) => {
          if (query.trim()) doSearch(query);
        }}
      />
    </>
  );
}

function MacroPreview({ label, value, unit, color }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ fontSize: 16, fontWeight: '800', color }}>{value}</Text>
      <Text style={{ fontSize: 9, color: T3, fontWeight: '600', marginTop: 1 }}>{unit}</Text>
      <Text style={{ fontSize: 9, color: T3, marginTop: 1 }}>{label}</Text>
    </View>
  );
}

function FoodItem({ food, isFav, onAdd, onFav }) {
  return (
    <View style={fi.row}>
      <TouchableOpacity style={fi.main} onPress={onAdd} activeOpacity={0.7}>
        <Text style={fi.name} numberOfLines={2}>{food.name}</Text>
        {food.brand ? <Text style={fi.brand} numberOfLines={1}>{food.brand}</Text> : null}
        <Text style={fi.macros}>
          {food.per100g.calories} kcal · P {food.per100g.protein}g · C {food.per100g.carbs}g · G {food.per100g.fat}g
          <Text style={fi.per}> /100g</Text>
        </Text>
      </TouchableOpacity>
      <View style={fi.actions}>
        <TouchableOpacity onPress={onFav} style={fi.favBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontSize: 16, color: isFav ? '#FF6B3E' : T3 }}>{isFav ? '♥' : '♡'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onAdd} style={fi.addBtn} activeOpacity={0.8}>
          <Text style={fi.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const fi = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: BORDER, gap: 10 },
  main:      { flex: 1 },
  name:      { fontSize: 13, fontWeight: '700', color: T1, marginBottom: 2 },
  brand:     { fontSize: 10, color: T3, marginBottom: 3, fontWeight: '500' },
  macros:    { fontSize: 11, color: T2, fontWeight: '500' },
  per:       { color: T3 },
  actions:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  favBtn:    { padding: 4 },
  addBtn:    { width: 30, height: 30, borderRadius: 9, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  addBtnText:{ fontSize: 18, fontWeight: '800', color: '#000', lineHeight: 22 },
});

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: BG },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16 },
  backBtn:     { width: 38, height: 38, borderRadius: 11, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER2, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 18, color: T1, fontWeight: '700' },
  title:       { fontSize: 20, fontWeight: '800', color: T1, letterSpacing: -0.4 },
  subtitle:    { fontSize: 12, color: T3, marginTop: 1, fontWeight: '500' },
  scanBtn:     { padding: 14, borderRadius: 12, backgroundColor: '#4CAF50', marginBottom: 12, marginHorizontal: 20 },
  scanBtnText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: BORDER2, gap: 10 },
  searchIcon:  { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 15, color: T1, fontWeight: '500' },
  clearBtn:    { fontSize: 14, color: T3 },
  listContent: { paddingHorizontal: 20, paddingBottom: 60 },
  sectionLabel:{ fontSize: 9, fontWeight: '700', letterSpacing: 2, color: T3, textTransform: 'uppercase', marginBottom: 10 },
  sectionTitle:{ fontSize: 16, fontWeight: '700', color: T1, marginBottom: 12, marginTop: 4 },
  recentItem:  { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BORDER2, marginBottom: 4 },
  center:      { alignItems: 'center', paddingVertical: 40 },
  loadingText: { fontSize: 13, color: T3, marginTop: 14, fontWeight: '500' },
  errText:     { fontSize: 13, color: T3, textAlign: 'center', lineHeight: 20 },
  placeholder: { alignItems: 'center', paddingVertical: 60 },
  placeholderIcon: { fontSize: 40, marginBottom: 14 },
  placeholderTitle:{ fontSize: 17, fontWeight: '700', color: T1, marginBottom: 6 },
  placeholderSub:  { fontSize: 13, color: T3, textAlign: 'center' },
  buttonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  createBtn: {
    flex: 1,
    backgroundColor: ACCENT + '15',
    borderWidth: 1,
    borderColor: ACCENT + '33',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: ACCENT,
  },
});

const m = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: '#000000CC', justifyContent: 'flex-end' },
  sheet:      { backgroundColor: SURFACE, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 48 },
  handle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: BORDER2, alignSelf: 'center', marginBottom: 20 },
  foodName:   { fontSize: 18, fontWeight: '800', color: T1, letterSpacing: -0.4, marginBottom: 3 },
  foodBrand:  { fontSize: 12, color: T3, marginBottom: 18 },
  label:      { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: T3, marginBottom: 10, marginTop: 4 },
  gramsRow:   { flexDirection: 'row', gap: 8, marginBottom: 10 },
  gramPreset: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: SRF2, borderWidth: 1, borderColor: BORDER2, alignItems: 'center' },
  gramPresetActive: { backgroundColor: ACCENT + '18', borderColor: ACCENT },
  gramPresetText: { fontSize: 12, fontWeight: '700', color: T2 },
  gramPresetTextActive: { color: ACCENT },
  gramsInput: { backgroundColor: SRF2, borderWidth: 1, borderColor: BORDER2, borderRadius: 12, color: T1, fontSize: 24, fontWeight: '800', paddingHorizontal: 14, paddingVertical: 12, textAlign: 'center', marginBottom: 16 },
  preview:    { flexDirection: 'row', backgroundColor: SRF2, borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: BORDER2 },
  addBtn:     { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  addBtnText: { fontSize: 15, fontWeight: '800', color: '#000' },
  cancelBtn:  { alignItems: 'center', marginTop: 12, paddingVertical: 8 },
  cancelBtnText: { fontSize: 13, color: T3, fontWeight: '500' },
});