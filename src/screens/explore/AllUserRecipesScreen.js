// src/screens/explore/AllUserRecipesScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import BottomTabBar from '../../../components/BottomTabBar';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';
const ORANGE = '#FF6B3E';

export default function AllUserRecipesScreen() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipes();
  }, []);

  async function loadRecipes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_recipes')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    
    if (data) setRecipes(data);
    setLoading(false);
  }

  return (
    <View style={s.container}>
      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={T1} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Recetas de la Comunidad</Text>
          <Text style={s.headerSubtitle}>Creadas y validadas por usuarios</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={ACCENT} /></View>
      ) : (
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {recipes.length === 0 ? (
            <View style={s.emptyState}>
              <Ionicons name="restaurant-outline" size={48} color={T3} />
              <Text style={s.emptyTitle}>Aún no hay recetas</Text>
              <Text style={s.emptyText}>¡Sé el primero en compartir una!</Text>
            </View>
          ) : (
            recipes.map((recipe) => (
              <TouchableOpacity
                key={recipe.id}
                style={s.recipeCard}
                onPress={() => router.push({ pathname: '/explore/user-recipe-detail', params: { id: recipe.id } })}
                activeOpacity={0.8}
              >
                <View style={s.recipeHeader}>
                  <View style={s.authorBadge}>
                    <Ionicons name="person-circle" size={14} color={ACCENT} />
                    <Text style={s.authorText}>{recipe.author_name}</Text>
                  </View>
                  <View style={s.timeBadge}>
                    <Ionicons name="time-outline" size={12} color={T3} />
                    <Text style={s.timeText}>{recipe.time}</Text>
                  </View>
                </View>
                
                <Text style={s.recipeName}>{recipe.recipe_name}</Text>
                
                <View style={s.macrosRow}>
                  <MacroItem icon="flame" label={recipe.calories} color={ORANGE} />
                  <MacroItem icon="barbell" label={`${recipe.protein}g`} color={ACCENT} />
                  <MacroItem icon="nutrition" label={`${recipe.carbs}g`} color="#3EE5FF" />
                  <MacroItem icon="water" label={`${recipe.fat}g`} color="#FF3EAA" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* BOTÓN FLOTANTE PARA CREAR */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => router.push('/explore/create-user-recipe')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={BG} />
      </TouchableOpacity>

      <BottomTabBar />
    </View>
  );
}

function MacroItem({ icon, label, color }) {
  return (
    <View style={s.macroItem}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[s.macroText, { color }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, gap: 12 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: T1 },
  headerSubtitle: { fontSize: 12, color: T2, marginTop: 2 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: T1, marginTop: 8 },
  emptyText: { fontSize: 12, color: T2 },
  
  recipeCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
  recipeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  authorBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  authorText: { fontSize: 11, color: T2, fontWeight: '600' },
  timeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 11, color: T3, fontWeight: '600' },
  recipeName: { fontSize: 16, fontWeight: '700', color: T1, marginBottom: 12 },
  macrosRow: { flexDirection: 'row', justifyContent: 'space-between' },
  macroItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  macroText: { fontSize: 12, fontWeight: '700' },

  fab: { position: 'absolute', bottom: 90, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, zIndex: 20 },
});