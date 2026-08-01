// src/screens/admin/AdminRecipesIAScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';
const ORANGE = '#FF6B3E';
const CYAN = '#3EE5FF';
const PINK = '#FF3EAA';
const RED = '#FF453A';

export default function AdminRecipesIAScreen() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipes();
  }, []);

  async function loadRecipes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('recipes_ia')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setRecipes(data || []);
    }
    setLoading(false);
  }

  function handleDelete(recipe) {
    Alert.alert(
      'Eliminar receta',
      `¿Seguro que quieres eliminar "${recipe.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('recipes_ia')
              .delete()
              .eq('id', recipe.id);

            if (error) {
              Alert.alert('Error', error.message);
            } else {
              setRecipes(prev => prev.filter(r => r.id !== recipe.id));
              Alert.alert('Eliminada', 'Receta eliminada correctamente');
            }
          }
        }
      ]
    );
  }

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={T1} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>🍳 Recetas IA</Text>
          <Text style={s.headerSubtitle}>{recipes.length} recetas publicadas</Text>
        </View>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => router.push('/admin/recipe-form')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color={BG} />
        </TouchableOpacity>
      </View>

      {/* LISTA */}
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {recipes.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="restaurant-outline" size={48} color={T3} />
            <Text style={s.emptyTitle}>Sin recetas</Text>
            <Text style={s.emptyText}>Crea la primera con el botón +</Text>
          </View>
        ) : (
          recipes.map((recipe) => (
            <View key={recipe.id} style={s.recipeCard}>
              <View style={s.recipeHeader}>
                <View style={s.categoryBadge}>
                  <Text style={s.categoryText}>{recipe.category}</Text>
                </View>
                <Text style={s.timeText}>⏱️ {recipe.time}</Text>
              </View>

              <Text style={s.recipeName}>{recipe.name}</Text>
              {recipe.subtitle && (
                <Text style={s.recipeSubtitle}>{recipe.subtitle}</Text>
              )}

              {/* MACROS */}
              <View style={s.macrosRow}>
                <MacroItem icon="flame" value={`${recipe.calories} kcal`} color={ORANGE} />
                <MacroItem icon="barbell" value={`${recipe.protein}g`} color={ACCENT} />
                <MacroItem icon="nutrition" value={`${recipe.carbs}g`} color={CYAN} />
                <MacroItem icon="water" value={`${recipe.fat}g`} color={PINK} />
              </View>

              <View style={s.actionsRow}>
                <TouchableOpacity
                  style={s.editBtn}
                  onPress={() => router.push({
                    pathname: '/admin/recipe-form',
                    params: { id: recipe.id }
                  })}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={16} color={ACCENT} />
                  <Text style={s.editBtnText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.deleteBtn}
                  onPress={() => handleDelete(recipe)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={16} color={RED} />
                  <Text style={s.deleteBtnText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function MacroItem({ icon, value, color }) {
  return (
    <View style={s.macroItem}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={[s.macroText, { color }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loading: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, gap: 12 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: T1 },
  headerSubtitle: { fontSize: 12, color: T2, marginTop: 2 },
  addBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },

  scrollContent: { padding: 20, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: T1, marginTop: 8 },
  emptyText: { fontSize: 12, color: T2 },

  recipeCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
  recipeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  categoryBadge: { backgroundColor: ACCENT + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  categoryText: { fontSize: 11, fontWeight: '700', color: ACCENT },
  timeText: { fontSize: 11, color: T3, fontWeight: '600' },
  recipeName: { fontSize: 16, fontWeight: '700', color: T1, marginBottom: 4 },
  recipeSubtitle: { fontSize: 12, color: T2, marginBottom: 10 },

  macrosRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: BG, borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
  macroItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  macroText: { fontSize: 11, fontWeight: '700' },

  actionsRow: { flexDirection: 'row', gap: 10 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ACCENT + '15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: ACCENT + '40' },
  editBtnText: { fontSize: 12, fontWeight: '700', color: ACCENT },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: RED + '15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: RED + '40' },
  deleteBtnText: { fontSize: 12, fontWeight: '700', color: RED },
});