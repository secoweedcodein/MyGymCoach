// src/screens/explore/UserRecipeDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, ActivityIndicator, Alert,
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

const { width } = Dimensions.get('window');

export default function UserRecipeDetailScreen() {
  const { id } = useLocalSearchParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadRecipe();
    checkIfSaved();
  }, [id]);

  async function loadRecipe() {
    setLoading(true);
    // ✅ Buscamos en la tabla correcta: user_recipes
    const { data, error } = await supabase
      .from('user_recipes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      console.error('Error cargando receta de usuario:', error);
      Alert.alert('Error', 'No se encontró la receta');
      router.back();
      return;
    }

    setRecipe({
      id: data.id,
      name: data.recipe_name,
      author: data.author_name,
      category: data.recipe_category || 'Comunidad',
      time: data.time,
      description: data.description,
      macros: {
        calories: data.calories || 0,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fat: data.fat || 0,
      },
      ingredients: data.ingredients || [],
      steps: data.steps || [],
      tips: data.tips,
    });
    setLoading(false);
  }

  async function checkIfSaved() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('saved_recipes')
      .select('id')
      .eq('user_id', user.id)
      .eq('recipe_id', `user-${id}`) // Prefijo para diferenciar de las de IA
      .maybeSingle();

    if (data) setSaved(true);
  }

  async function handleSave() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión');
      return;
    }

    if (saved) {
      const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', `user-${id}`);

      if (error) Alert.alert('Error', error.message);
      else {
        setSaved(false);
        Alert.alert('Receta eliminada', 'Se eliminó de tus accesos rápidos');
      }
    } else {
      const { error } = await supabase
        .from('saved_recipes')
        .insert({
          user_id: user.id,
          recipe_id: `user-${id}`,
          recipe_name: recipe.name,
          recipe_category: 'Comunidad',
          protein: recipe.macros.protein,
          calories: recipe.macros.calories,
          carbs: recipe.macros.carbs,
          fat: recipe.macros.fat,
          time: recipe.time,
        });

      if (error) Alert.alert('Error', error.message);
      else {
        setSaved(true);
        Alert.alert('¡Receta guardada!', 'Aparecerá como acceso rápido en el buscador');
      }
    }
  }

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!recipe) return null;

  const totalMacroCals = (recipe.macros.protein * 4) + (recipe.macros.carbs * 4) + (recipe.macros.fat * 9) || 1;
  const proteinPct = Math.round(((recipe.macros.protein * 4) / totalMacroCals) * 100);
  const carbsPct = Math.round(((recipe.macros.carbs * 4) / totalMacroCals) * 100);
  const fatPct = Math.round(((recipe.macros.fat * 9) / totalMacroCals) * 100);

  // Parsear ingredientes y pasos si vienen como string (por si acaso)
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
  const steps = Array.isArray(recipe.steps) ? recipe.steps : [];

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.headerSection}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={T1} />
          </TouchableOpacity>
          <View style={s.headerContent}>
            <View style={s.communityBadge}>
              <Ionicons name="people" size={12} color={BG} />
              <Text style={s.communityBadgeText}>COMUNIDAD</Text>
            </View>
            <Text style={s.recipeTitle}>{recipe.name}</Text>
            <View style={s.authorRow}>
              <Ionicons name="person-circle" size={14} color={ACCENT} />
              <Text style={s.authorText}>por {recipe.author}</Text>
            </View>
          </View>
        </View>

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

        <View style={s.infoRow}>
          <InfoItem icon="⏱️" label="Tiempo" value={recipe.time} />
          <InfoItem icon="👤" label="Autor" value={recipe.author} />
        </View>

        {recipe.description && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Descripción</Text>
            <View style={s.descriptionCard}>
              <Text style={s.descriptionText}>{recipe.description}</Text>
            </View>
          </View>
        )}

        <View style={s.section}>
          <Text style={s.sectionTitle}>Ingredientes</Text>
          <View style={s.ingredientsCard}>
            {ingredients.map((ing, idx) => (
              <View key={idx} style={s.ingredientRow}>
                <View style={s.ingredientDot} />
                <Text style={s.ingredientText}>
                  {typeof ing === 'string' ? ing : `${ing.name} - ${ing.amount}`}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Preparación</Text>
          <View style={s.stepsCard}>
            {steps.map((step, idx) => (
              <View key={idx} style={s.stepRow}>
                <View style={s.stepNumber}>
                  <Text style={s.stepNumberText}>{idx + 1}</Text>
                </View>
                <Text style={s.stepText}>{typeof step === 'string' ? step : step.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[s.saveBtn, saved && s.saveBtnSaved]}
          onPress={handleSave}
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
      <Text style={s.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loadingContainer: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  headerSection: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  headerContent: {},
  communityBadge: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: ACCENT, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 12, gap: 6, alignItems: 'center' },
  communityBadgeText: { fontSize: 11, fontWeight: '800', color: BG },
  recipeTitle: { fontSize: 28, fontWeight: '800', color: T1, marginBottom: 8, letterSpacing: -0.5 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorText: { fontSize: 13, color: T2, fontWeight: '600' },
  macrosCard: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
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
  infoRow: { flexDirection: 'row', marginHorizontal: 20, marginTop: 20, backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER, gap: 10 },
  infoItem: { flex: 1, alignItems: 'center' },
  infoIcon: { fontSize: 20, marginBottom: 4 },
  infoLabel: { fontSize: 10, color: T3, fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 12, color: T1, fontWeight: '700' },
  descriptionCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER, borderLeftWidth: 4, borderLeftColor: ACCENT },
  descriptionText: { fontSize: 14, color: T2, lineHeight: 22 },
  ingredientsCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  ingredientDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT, marginTop: 7 },
  ingredientText: { flex: 1, fontSize: 13, color: T2, lineHeight: 20 },
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