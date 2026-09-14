// src/screens/explore/CommunityRecipesScreen.js
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, TextInput, ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
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

const RECIPE_FALLBACK = require('../../../assets/pancakes.png');

export default function CommunityRecipesScreen() {
  const [search, setSearch] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('user_recipes')
        .select('id, recipe_name, author_name, protein, calories, time, image_url, likes_count')
        .in('status', ['approved', 'published'])
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRecipes(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
    }, [loadRecipes])
  );

  const q = search.trim().toLowerCase();
  const filtered = q
    ? recipes.filter(item =>
        item.recipe_name?.toLowerCase().includes(q) ||
        item.author_name?.toLowerCase().includes(q)
      )
    : recipes;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={T1} />
        </TouchableOpacity>
        <Text style={s.title}>Recetas Comunidad</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={s.searchContainer}>
        <Ionicons name="search" size={18} color={T3} />
        <TextInput
          style={s.searchInput}
          placeholder="Buscar recetas o usuarios..."
          placeholderTextColor={T3}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
        {loading ? (
          <View style={s.centerBox}>
            <ActivityIndicator size="large" color={ACCENT} />
          </View>
        ) : error ? (
          <View style={s.centerBox}>
            <Ionicons name="cloud-offline-outline" size={40} color={T3} />
            <Text style={s.emptyText}>No se pudieron cargar las recetas</Text>
            <TouchableOpacity style={s.retryBtn} onPress={loadRecipes} activeOpacity={0.8}>
              <Text style={s.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={s.centerBox}>
            <Ionicons name="fast-food-outline" size={40} color={T3} />
            <Text style={s.emptyText}>
              {q ? 'Sin resultados para tu búsqueda' : 'Todavía no hay recetas de la comunidad'}
            </Text>
          </View>
        ) : (
          filtered.map(item => (
            <TouchableOpacity
              key={item.id}
              style={s.card}
              activeOpacity={0.85}
              onPress={() => router.push(`/explore/user-recipe-detail?id=${item.id}`)}
            >
              <Image
                source={item.image_url && typeof item.image_url === 'string' && item.image_url.startsWith('http') ? { uri: item.image_url } : RECIPE_FALLBACK}
                style={s.cardImage}
              />
              <View style={s.cardBody}>
                <Text style={s.cardTitle}>{item.recipe_name}</Text>
                <Text style={s.cardAuthor}>{item.author_name || 'Miembro de la comunidad'}</Text>

                <View style={s.macroRow}>
                  <View style={s.macroItem}>
                    <Text style={s.macroValue}>{item.protein ?? 0}g</Text>
                    <Text style={s.macroLabel}>Proteína</Text>
                  </View>
                  <View style={s.macroItem}>
                    <Text style={s.macroValue}>{item.calories ?? 0}</Text>
                    <Text style={s.macroLabel}>Kcal</Text>
                  </View>
                  <View style={s.macroItem}>
                    <Text style={s.macroValue}>{item.time || '—'}</Text>
                    <Text style={s.macroLabel}>Tiempo</Text>
                  </View>
                </View>

                <View style={s.socialRow}>
                  <View style={s.socialItem}>
                    <Ionicons name="heart" size={16} color={T2} />
                    <Text style={s.socialText}>{item.likes_count || 0}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={T3} style={{ marginLeft: 'auto' }} />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: T1 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 14, padding: 12, marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: BORDER },
  searchInput: { flex: 1, color: T1, fontSize: 14, marginLeft: 10 },
  list: { paddingHorizontal: 20, gap: 16 },
  centerBox: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: '700', color: T2, textAlign: 'center', lineHeight: 20 },
  retryBtn: { marginTop: 8, backgroundColor: ACCENT, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  retryText: { fontSize: 13, fontWeight: '800', color: BG },
  card: { backgroundColor: SURFACE, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: BORDER },
  cardImage: { width: '100%', height: 160 },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: T1, marginBottom: 4 },
  cardAuthor: { fontSize: 12, color: ACCENT, fontWeight: '600', marginBottom: 12 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12, backgroundColor: SURFACE2, padding: 10, borderRadius: 10 },
  macroItem: { alignItems: 'center' },
  macroValue: { fontSize: 14, fontWeight: '800', color: T1 },
  macroLabel: { fontSize: 10, color: T3, fontWeight: '600' },
  socialRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  socialItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  socialText: { fontSize: 12, color: T2, fontWeight: '600' },
});