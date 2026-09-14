// src/screens/explore/AllRecipesScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Dimensions, TextInput, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomTabBar from '../../../components/BottomTabBar';
import { supabase } from '../../../lib/supabase';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const SURFACE2 = '#1E1E1E';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';
const ORANGE = '#FF6B3E';
const PURPLE = '#8B7CFF';
const CYAN = '#3EE5FF';
const PINK = '#FF3EAA';

const { width } = Dimensions.get('window');

const CATEGORIES = ['Todas', 'Desayuno', 'Almuerzo', 'Cena', 'Snack', 'Post-entreno'];

export default function AllRecipesScreen() {
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecipes();
  }, []);

  async function loadRecipes() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('recipes_ia')
        .select('id, name, category, protein, calories, time, tags, image_url, subtitle')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRecipes(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  function recipeImage(recipe) {
    if (recipe.image_url && typeof recipe.image_url === 'string' && recipe.image_url.startsWith('http')) {
      return { uri: recipe.image_url };
    }
    return require('../../../assets/pancakes.png');
  }

  const filteredRecipes = recipes.filter(r => {
    const matchCategory = activeCategory === 'Todas' || r.category === activeCategory;
    const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <View style={s.container}>
      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={T1} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Recetas IA</Text>
          <Text style={s.headerSubtitle}>Creadas por MyGymCoach</Text>
        </View>
      </View>

      {/* SEARCH */}
      <View style={s.searchContainer}>
        <Ionicons name="search" size={18} color={T3} />
        <TextInput
          style={s.searchInput}
          placeholder="Buscar recetas..."
          placeholderTextColor={T3}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* CATEGORIES */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.categoriesScroll}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[s.categoryChip, activeCategory === cat && s.categoryChipActive]}
            onPress={() => setActiveCategory(cat)}
            activeOpacity={0.8}
          >
            <Text style={[s.categoryText, activeCategory === cat && s.categoryTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* RECIPES LIST */}
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={ACCENT} style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={s.emptyState}>
            <Ionicons name="cloud-offline-outline" size={48} color={T3} />
            <Text style={s.emptyTitle}>No se pudieron cargar las recetas</Text>
            <TouchableOpacity style={s.retryBtn} onPress={loadRecipes} activeOpacity={0.8}>
              <Text style={s.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={s.resultsCount}>
              {filteredRecipes.length} {filteredRecipes.length === 1 ? 'receta' : 'recetas'}
            </Text>

            {filteredRecipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={s.recipeCard}
                onPress={() => router.push(`/explore/recipe-detail?id=${recipe.id}`)}
                activeOpacity={0.8}
              >
                <Image source={recipeImage(recipe)} style={s.recipeImage} />
                <View style={s.recipeContent}>
                  <View style={s.recipeHeader}>
                    <View style={[s.recipeTag, { backgroundColor: ACCENT + '20', borderColor: ACCENT + '50' }]}>
                      <Text style={[s.recipeTagText, { color: ACCENT }]}>{recipe.tags?.[0] || recipe.category}</Text>
                    </View>
                    <View style={s.recipeTime}>
                      <Ionicons name="time-outline" size={12} color={T3} />
                      <Text style={s.recipeTimeText}>{recipe.time}</Text>
                    </View>
                  </View>
                  <Text style={s.recipeName}>{recipe.name}</Text>
                  <View style={s.recipeMacros}>
                    <View style={s.recipeMacroItem}>
                      <Ionicons name="flame" size={12} color={ORANGE} />
                      <Text style={s.recipeMacroText}>{recipe.calories} kcal</Text>
                    </View>
                    <View style={s.recipeMacroItem}>
                      <Ionicons name="barbell" size={12} color={ACCENT} />
                      <Text style={s.recipeMacroText}>{recipe.protein}g prot</Text>
                    </View>
                  </View>
                </View>
                <View style={s.recipeArrow}>
                  <Ionicons name="chevron-forward" size={20} color={T3} />
                </View>
              </TouchableOpacity>
            ))}

            {filteredRecipes.length === 0 && (
              <View style={s.emptyState}>
                <Ionicons name="restaurant-outline" size={48} color={T3} />
                <Text style={s.emptyTitle}>Sin resultados</Text>
                <Text style={s.emptyText}>Prueba con otra categoría o búsqueda</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, gap: 12 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: T1 },
  headerSubtitle: { fontSize: 12, color: T2, marginTop: 2 },

  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, backgroundColor: SURFACE, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: BORDER, marginBottom: 16 },
  searchInput: { flex: 1, color: T1, fontSize: 14 },

  categoriesScroll: { marginHorizontal: 20, marginBottom: 16 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, marginRight: 8 },
  categoryChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  categoryText: { fontSize: 12, fontWeight: '700', color: T2 },
  categoryTextActive: { color: BG },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  resultsCount: { fontSize: 12, color: T3, fontWeight: '600', marginBottom: 12 },

  recipeCard: { flexDirection: 'row', backgroundColor: SURFACE, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: BORDER, marginBottom: 12 },
  recipeImage: { width: 100, height: 110 },
  recipeContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  recipeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  recipeTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  recipeTagText: { fontSize: 10, fontWeight: '700' },
  recipeTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recipeTimeText: { fontSize: 10, color: T3, fontWeight: '600' },
  recipeName: { fontSize: 14, fontWeight: '700', color: T1, marginBottom: 6 },
  recipeMacros: { flexDirection: 'row', gap: 12 },
  recipeMacroItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recipeMacroText: { fontSize: 11, color: T2, fontWeight: '600' },
  recipeArrow: { justifyContent: 'center', paddingHorizontal: 12 },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: T1, marginTop: 8 },
  emptyText: { fontSize: 12, color: T2 },
  retryBtn: { marginTop: 8, backgroundColor: ACCENT, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  retryText: { fontSize: 13, fontWeight: '800', color: BG },
});