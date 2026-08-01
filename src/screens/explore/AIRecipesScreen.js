// src/screens/explore/AllRecipesScreen.js
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomTabBar from '../../../components/BottomTabBar';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';
const ORANGE = '#FF6B3E';
const PURPLE = '#8B7CFF';
const CYAN = '#3EE5FF';
const PINK = '#FF3EAA';

const ALL_RECIPES = [
  { id: 'bowl-pollo', image: require('../../../assets/pancakes.png'), name: 'Bowl Proteico de Pollo', category: 'Almuerzo', protein: 48, calories: 520, time: '20 min', tag: 'Alto en proteína', tagColor: ACCENT },
  { id: 'pancakes-avena', image: require('../../../assets/pancakes.png'), name: 'Pancakes de Avena Fit', category: 'Desayuno', protein: 28, calories: 380, time: '15 min', tag: 'Sin azúcar', tagColor: PURPLE },
  { id: 'wrap-atun', image: require('../../../assets/wrap.png'), name: 'Wrap de Atún y Aguacate', category: 'Almuerzo', protein: 35, calories: 420, time: '10 min', tag: 'Omega-3', tagColor: CYAN },
  { id: 'batido-post-entreno', image: require('../../../assets/pancakes.png'), name: 'Batido Post-Entreno', category: 'Post-entreno', protein: 38, calories: 420, time: '5 min', tag: 'Recuperación', tagColor: ORANGE },
  { id: 'salmon-quinoa', image: require('../../../assets/pancakes.png'), name: 'Salmón con Quinoa', category: 'Cena', protein: 42, calories: 580, time: '25 min', tag: 'Omega-3', tagColor: CYAN },
  { id: 'tacos-fit', image: require('../../../assets/wrap.png'), name: 'Tacos de Pollo Fit', category: 'Almuerzo', protein: 40, calories: 480, time: '25 min', tag: 'Sin gluten', tagColor: ACCENT },
  { id: 'pasta-proteica', image: require('../../../assets/pancakes.png'), name: 'Pasta Proteica con Pavo', category: 'Almuerzo', protein: 45, calories: 560, time: '20 min', tag: 'Pre-entreno', tagColor: ORANGE },
  { id: 'ensalada-cesar-fit', image: require('../../../assets/wrap.png'), name: 'Ensalada César Fit', category: 'Almuerzo', protein: 38, calories: 420, time: '15 min', tag: 'Bajo en carbos', tagColor: PINK },
  { id: 'arroz-pollo-curry', image: require('../../../assets/pancakes.png'), name: 'Arroz con Pollo al Curry', category: 'Almuerzo', protein: 42, calories: 540, time: '30 min', tag: 'Antiinflamatorio', tagColor: PURPLE },
  { id: 'overnight-oats', image: require('../../../assets/pancakes.png'), name: 'Overnight Oats Proteicos', category: 'Desayuno', protein: 35, calories: 450, time: '5 min', tag: 'Meal prep', tagColor: ACCENT },
  { id: 'revuelto-claras', image: require('../../../assets/pancakes.png'), name: 'Revuelto de Claras', category: 'Desayuno', protein: 32, calories: 280, time: '10 min', tag: 'Bajo en carbos', tagColor: PINK },
  { id: 'yogur-proteico', image: require('../../../assets/pancakes.png'), name: 'Yogur Proteico con Granola', category: 'Snack', protein: 24, calories: 320, time: '5 min', tag: 'Rápido', tagColor: ORANGE },
];

export default function AllRecipesScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecipes = ALL_RECIPES.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={T3} />
          </TouchableOpacity>
        )}
      </View>

      {/* RECIPES LIST */}
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
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
            <Image source={recipe.image} style={s.recipeImage} />
            <View style={s.recipeContent}>
              <View style={s.recipeHeader}>
                <View style={[s.recipeTag, { backgroundColor: recipe.tagColor + '20', borderColor: recipe.tagColor + '50' }]}>
                  <Text style={[s.recipeTagText, { color: recipe.tagColor }]}>{recipe.tag}</Text>
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
            <Text style={s.emptyText}>Prueba con otra búsqueda</Text>
          </View>
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
});