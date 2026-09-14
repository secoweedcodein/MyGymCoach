// src/screens/explore/RecipeDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Alert,
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
const ORANGE = '#FF6B3E';
const CYAN = '#3EE5FF';
const PINK = '#FF3EAA';

const FALLBACK_IMAGE = { uri: null };

function recipeImage(recipe) {
  if (recipe.image_url && typeof recipe.image_url === 'string' && recipe.image_url.startsWith('http')) {
    return { uri: recipe.image_url };
  }
  return require('../../../assets/pancakes.png');
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkedIngredients, setCheckedIngredients] = useState({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRecipe();
  }, [id]);

  useEffect(() => {
    if (!recipe) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('saved_recipes')
        .select('id')
        .eq('user_id', user.id)
        .eq('recipe_id', id)
        .eq('recipe_type', 'ia')
        .maybeSingle();
      if (data) setSaved(true);
    })();
  }, [recipe]);

  async function loadRecipe() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('recipes_ia')
        .select('id, name, subtitle, category, calories, protein, carbs_g, fat_g, time, tags, image_url, ingredients, instructions')
        .eq('id', id)
        .single();
      if (error || !data) throw error || new Error('Receta no encontrada');
      setRecipe(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  const toggleIngredient = (idx) => {
    setCheckedIngredients(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  async function handleSave() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { Alert.alert('Sesión requerida', 'Debes iniciar sesión para guardar recetas'); return; }

    if (saved) {
      const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', id)
        .eq('recipe_type', 'ia');
      if (error) { Alert.alert('Error', error.message); return; }
      setSaved(false);
      Alert.alert('Eliminada', 'La receta se quitó de tus favoritas');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('saved_recipes')
        .upsert({
          user_id: user.id,
          recipe_id: id,
          recipe_type: 'ia',
        }, { onConflict: 'user_id,recipe_id' });
      if (error) throw error;
      setSaved(true);
      Alert.alert('¡Receta guardada!', 'Aparecerá como acceso rápido en Nutrición');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (error || !recipe) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={T1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Receta</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={s.centerBox}>
          <Ionicons name="cloud-offline-outline" size={40} color={T3} />
          <Text style={s.emptyText}>No se pudo cargar la receta</Text>
          <TouchableOpacity style={s.retryBtn} onPress={loadRecipe} activeOpacity={0.8}>
            <Text style={s.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
        <BottomTabBar />
      </View>
    );
  }

  const macros = {
    calories: recipe.calories || 0,
    protein: Number(recipe.protein) || 0,
    carbs: Number(recipe.carbs_g) || 0,
    fat: Number(recipe.fat_g) || 0,
  };
  const totalMacroCals = (macros.protein * 4) + (macros.carbs * 4) + (macros.fat * 9) || 1;
  const proteinPct = Math.round(((macros.protein * 4) / totalMacroCals) * 100);
  const carbsPct = Math.round(((macros.carbs * 4) / totalMacroCals) * 100);
  const fatPct = Math.round(((macros.fat * 9) / totalMacroCals) * 100);

  const tags = Array.isArray(recipe.tags) ? recipe.tags : [];
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const steps = Array.isArray(recipe.instructions) ? recipe.instructions : [];

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View style={s.heroSection}>
          <Image source={recipeImage(recipe)} style={s.heroImage} />
          <View style={s.heroGradient} />
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={T1} />
          </TouchableOpacity>
          <View style={s.heroBottom}>
            {recipe.category ? (
              <View style={s.categoryBadge}>
                <Ionicons name="sparkles" size={12} color={BG} />
                <Text style={s.categoryBadgeText}>{recipe.category}</Text>
              </View>
            ) : null}
            <Text style={s.heroTitle}>{recipe.name}</Text>
            {recipe.subtitle ? <Text style={s.heroSubtitle}>{recipe.subtitle}</Text> : null}
          </View>
        </View>

        {/* MACROS CARD */}
        <View style={s.macrosCard}>
          <View style={s.macroItem}>
            <Text style={[s.macroValue, { color: ACCENT }]}>{macros.calories}</Text>
            <Text style={s.macroLabel}>Calorías</Text>
          </View>
          <View style={s.macroDivider} />
          <View style={s.macroItem}>
            <Text style={[s.macroValue, { color: ORANGE }]}>{macros.protein}g</Text>
            <Text style={s.macroLabel}>Proteína</Text>
          </View>
          <View style={s.macroDivider} />
          <View style={s.macroItem}>
            <Text style={[s.macroValue, { color: CYAN }]}>{macros.carbs}g</Text>
            <Text style={s.macroLabel}>Carbos</Text>
          </View>
          <View style={s.macroDivider} />
          <View style={s.macroItem}>
            <Text style={[s.macroValue, { color: PINK }]}>{macros.fat}g</Text>
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
          <InfoItem icon="⏱️" label="Tiempo" value={recipe.time || '—'} />
          <InfoItem icon="✅" label="Autor" value="MyGymCoach IA" />
        </View>

        {/* TAGS */}
        {tags.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Características</Text>
            <View style={s.tagsRow}>
              {tags.map((tag, idx) => (
                <View key={idx} style={s.tag}>
                  <Ionicons name="checkmark-circle" size={12} color={ACCENT} />
                  <Text style={s.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* INGREDIENTES */}
        {ingredients.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Ingredientes</Text>
            <View style={s.ingredientsCard}>
              {ingredients.map((ing, idx) => {
                const text = typeof ing === 'string' ? ing : (ing?.name || '');
                const amount = typeof ing === 'string' ? '' : (ing?.amount || '');
                return (
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
                        {text}
                      </Text>
                    </View>
                    {amount ? <Text style={s.ingredientAmount}>{amount}</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* PASOS */}
        {steps.length > 0 ? (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Preparación</Text>
            <View style={s.stepsCard}>
              {steps.map((step, idx) => (
                <View key={idx} style={s.stepRow}>
                  <View style={s.stepNumber}>
                    <Text style={s.stepNumberText}>{idx + 1}</Text>
                  </View>
                  <Text style={s.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* BOTÓN GUARDAR */}
        <TouchableOpacity
          style={[s.saveBtn, saved && s.saveBtnSaved]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? BG : ACCENT} />
          <Text style={[s.saveBtnText, saved && s.saveBtnTextSaved]}>
            {saving ? 'Guardando...' : saved ? 'Guardada' : 'Guardar receta'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

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

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loadingContainer: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: T1, flex: 1 },
  centerBox: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: '700', color: T2 },
  retryBtn: { marginTop: 8, backgroundColor: ACCENT, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  retryText: { fontSize: 13, fontWeight: '800', color: BG },

  heroSection: { width: '100%', height: 320, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, backgroundColor: 'rgba(13,13,13,0.95)' },
  heroBottom: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  categoryBadge: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: ACCENT, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 12, gap: 6, alignItems: 'center' },
  categoryBadgeText: { fontSize: 11, fontWeight: '800', color: BG },
  heroTitle: { fontSize: 30, fontWeight: '800', color: T1, marginBottom: 6, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 15, color: T2, fontWeight: '500' },

  macrosCard: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  macroItem: { flex: 1, alignItems: 'center' },
  macroValue: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  macroLabel: { fontSize: 10, color: T3, fontWeight: '600' },
  macroDivider: { width: 1, height: 40, backgroundColor: BORDER, marginVertical: 4 },

  section: { marginTop: 28, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: T1, marginBottom: 12 },
  distributionBar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', backgroundColor: SURFACE2, marginBottom: 12 },
  distributionSegment: { height: '100%' },
  distributionLegend: { flexDirection: 'row', justifyContent: 'space-between' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: T2 },
  legendValue: { fontSize: 11, color: T1, fontWeight: '700' },

  infoRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  infoItem: { flex: 1, alignItems: 'center' },
  infoIcon: { fontSize: 20, marginBottom: 4 },
  infoLabel: { fontSize: 10, color: T3, fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 13, color: T1, fontWeight: '700', textAlign: 'center' },

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

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: SURFACE, borderWidth: 2, borderColor: ACCENT, borderRadius: 16, paddingVertical: 16, marginHorizontal: 20, marginTop: 28 },
  saveBtnSaved: { backgroundColor: ACCENT },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: ACCENT },
  saveBtnTextSaved: { color: BG },
});