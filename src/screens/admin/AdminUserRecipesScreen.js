// src/screens/admin/AdminUserRecipesScreen.js
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
const GREEN = '#3DD68C';

const FILTERS = [
  { id: 'pending', label: 'Pendientes', color: ORANGE },
  { id: 'approved', label: 'Aprobadas', color: GREEN },
  { id: 'all', label: 'Todas', color: T2 },
];

export default function AdminUserRecipesScreen() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('pending');

  useEffect(() => {
    loadRecipes();
  }, [activeFilter]);

  async function loadRecipes() {
    setLoading(true);
    let query = supabase
      .from('user_recipes')
      .select('*')
      .order('created_at', { ascending: false });

    if (activeFilter !== 'all') {
      query = query.eq('status', activeFilter);
    }

    const { data, error } = await query;

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setRecipes(data || []);
    }
    setLoading(false);
  }

  function handleApprove(recipe) {
    Alert.alert(
      'Aprobar receta',
      `¿Aprobar "${recipe.recipe_name}" de ${recipe.author_name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          onPress: async () => {
            const { error } = await supabase
              .from('user_recipes')
              .update({ status: 'approved' })
              .eq('id', recipe.id);

            if (error) {
              Alert.alert('Error', error.message);
            } else {
              setRecipes(prev => prev.map(r => r.id === recipe.id ? { ...r, status: 'approved' } : r));
              Alert.alert('Aprobada', 'La receta ahora es visible para todos los usuarios');
            }
          }
        }
      ]
    );
  }

  function handleReject(recipe) {
    Alert.alert(
      'Eliminar receta',
      `¿Eliminar "${recipe.recipe_name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('user_recipes')
              .delete()
              .eq('id', recipe.id);

            if (error) {
              Alert.alert('Error', error.message);
            } else {
              setRecipes(prev => prev.filter(r => r.id !== recipe.id));
              Alert.alert('Eliminada', 'La receta fue eliminada');
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
          <Text style={s.headerTitle}>👨‍🍳 Recetas Usuarios</Text>
          <Text style={s.headerSubtitle}>{recipes.length} recetas</Text>
        </View>
      </View>

      {/* FILTROS */}
      <View style={s.filtersRow}>
        {FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[s.filterBtn, activeFilter === filter.id && { backgroundColor: filter.color + '22', borderColor: filter.color }]}
            onPress={() => setActiveFilter(filter.id)}
            activeOpacity={0.8}
          >
            <Text style={[s.filterText, activeFilter === filter.id && { color: filter.color }]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* LISTA */}
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {recipes.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="checkmark-circle-outline" size={48} color={T3} />
            <Text style={s.emptyTitle}>Sin recetas</Text>
            <Text style={s.emptyText}>
              {activeFilter === 'pending' ? 'No hay recetas pendientes de aprobación' : 'No hay recetas en esta categoría'}
            </Text>
          </View>
        ) : (
          recipes.map((recipe) => (
            <View key={recipe.id} style={s.recipeCard}>
              {/* STATUS BADGE */}
              <View style={s.cardHeader}>
                <View style={[
                  s.statusBadge,
                  { backgroundColor: recipe.status === 'approved' ? GREEN + '22' : ORANGE + '22' }
                ]}>
                  <Text style={[
                    s.statusText,
                    { color: recipe.status === 'approved' ? GREEN : ORANGE }
                  ]}>
                    {recipe.status === 'approved' ? '✓ Aprobada' : '⏳ Pendiente'}
                  </Text>
                </View>
                <Text style={s.dateText}>
                  {new Date(recipe.created_at).toLocaleDateString('es-ES')}
                </Text>
              </View>

              {/* INFO */}
              <Text style={s.recipeName}>{recipe.recipe_name}</Text>
              <View style={s.authorRow}>
                <Ionicons name="person-circle" size={14} color={T3} />
                <Text style={s.authorText}>por {recipe.author_name}</Text>
              </View>

              {/* MACROS */}
              <View style={s.macrosRow}>
                <MacroItem icon="flame" value={`${recipe.calories} kcal`} color={ORANGE} />
                <MacroItem icon="barbell" value={`${recipe.protein}g`} color={ACCENT} />
                <MacroItem icon="nutrition" value={`${recipe.carbs}g`} color={CYAN} />
                <MacroItem icon="water" value={`${recipe.fat}g`} color={PINK} />
              </View>

              {/* TIEMPO */}
              <View style={s.timeRow}>
                <Ionicons name="time-outline" size={14} color={T3} />
                <Text style={s.timeText}>{recipe.time}</Text>
              </View>

              {/* ACCIONES */}
              <View style={s.actionsRow}>
                {recipe.status !== 'approved' && (
                  <TouchableOpacity
                    style={s.approveBtn}
                    onPress={() => handleApprove(recipe)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark-circle" size={16} color={GREEN} />
                    <Text style={s.approveBtnText}>Aprobar</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={s.deleteBtn}
                  onPress={() => handleReject(recipe)}
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

  filtersRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  filterText: { fontSize: 12, fontWeight: '700', color: T2 },

  scrollContent: { padding: 20, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: T1, marginTop: 8 },
  emptyText: { fontSize: 12, color: T2, textAlign: 'center' },

  recipeCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  dateText: { fontSize: 11, color: T3, fontWeight: '600' },

  recipeName: { fontSize: 16, fontWeight: '700', color: T1, marginBottom: 6 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  authorText: { fontSize: 12, color: T3, fontWeight: '500' },

  macrosRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: BG, borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: BORDER },
  macroItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  macroText: { fontSize: 11, fontWeight: '700' },

  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  timeText: { fontSize: 12, color: T3, fontWeight: '600' },

  actionsRow: { flexDirection: 'row', gap: 10 },
  approveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: GREEN + '15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: GREEN + '40' },
  approveBtnText: { fontSize: 12, fontWeight: '700', color: GREEN },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: RED + '15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: RED + '40' },
  deleteBtnText: { fontSize: 12, fontWeight: '700', color: RED },
});