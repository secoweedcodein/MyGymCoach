import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
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

const CATEGORIES = [
  { icon: '⬆️', label: 'Tendencias', route: '/explore/trends' },
  { icon: '🏋️', label: 'Rutinas', route: '/explore/routines' },
  { icon: '🍳', label: 'Recetas IA', route: '/explore/recipes-ai' },
  { icon: '🍽️', label: 'Comunidad', route: '/explore/community-recipes' },
  { icon: '📚', label: 'Aprende', route: '/explore/learn' },
  { icon: '🎯', label: 'Retos', route: '/explore/challenge' },
  { icon: '⭐', label: 'Ejercicios', route: '/explore/exercise-day' },
];

const RESULT_TYPES = {
  trend: { icon: '🔥', label: 'Tendencia' },
  routine: { icon: '🏋️', label: 'Rutina' },
  recipe_ia: { icon: '🍳', label: 'Receta IA' },
  user_recipe: { icon: '🍽️', label: 'Receta Comunidad' },
  article: { icon: '📚', label: 'Artículo' },
  challenge: { icon: '🎯', label: 'Reto' },
  exercise: { icon: '⭐', label: 'Ejercicio del día' },
};

export default function SearchScreen() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = search.trim();
    if (!q || q.length < 3) {
      setResults([]);
      setSearched(false);
      return;
    }
    timer.current = setTimeout(() => {
      runSearch(q);
    }, 350);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [search]);

  async function runSearch(q) {
    setSearching(true);
    const like = `%${q}%`;
    const promises = [];

    try {
      const columns = 'id, title';
      promises.push(
        supabase.from('trends').select(columns).ilike('title', like).limit(6)
          .then(r => ({ type: 'trend', data: r.data, error: r.error })),
        supabase.from('public_routines').select('id, name').ilike('name', like).limit(6)
          .then(r => ({ type: 'routine', data: r.data, error: r.error })),
        supabase.from('recipes_ia').select('id, name').ilike('name', like).limit(6)
          .then(r => ({ type: 'recipe_ia', data: r.data, error: r.error })),
        supabase.from('user_recipes').select('id, recipe_name').in('status', ['approved', 'published']).ilike('recipe_name', like).limit(6)
          .then(r => ({ type: 'user_recipe', data: r.data, error: r.error })),
        supabase.from('articles').select('id, title').ilike('title', like).limit(6)
          .then(r => ({ type: 'article', data: r.data, error: r.error })),
        supabase.from('challenges').select('id, name').eq('is_official', true).ilike('name', like).limit(6)
          .then(r => ({ type: 'challenge', data: r.data, error: r.error })),
      );

      const settled = await Promise.all(promises);
      const flattened = [];
      settled.forEach(group => {
        if (group.error) return;
        (group.data || []).forEach(item => {
          flattened.push({
            type: group.type,
            id: item.id,
            main: item.title || item.name || item.recipe_name,
          });
        });
      });
      setResults(flattened);
    } catch (err) {
      setResults([]);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  }

  function navigateTo(item) {
    const map = {
      trend: `/explore/trend-detail?id=${item.id}`,
      routine: `/explore/public-routine-detail?id=${item.id}`,
      recipe_ia: `/explore/recipe-detail?id=${item.id}`,
      user_recipe: `/explore/user-recipe-detail?id=${item.id}`,
      article: `/explore/article-detail?id=${item.id}`,
      challenge: `/explore/challenge-detail?id=${item.id}`,
    };
    router.push(map[item.type]);
  }

  const canSearch = search.trim().length >= 3;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={T1} />
        </TouchableOpacity>
        <Text style={s.title}>Buscar</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={s.searchContainer}>
        <Ionicons name="search" size={18} color={T3} />
        <TextInput
          style={s.searchInput}
          placeholder="¿Qué estás buscando? (mín. 3 letras)"
          placeholderTextColor={T3}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searching ? <ActivityIndicator size="small" color={ACCENT} /> : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
        {!canSearch ? (
          <>
            <Text style={s.sectionTitle}>Categorías</Text>
            {CATEGORIES.map((cat, idx) => (
              <TouchableOpacity key={idx} style={s.categoryCard} onPress={() => router.push(cat.route)} activeOpacity={0.8}>
                <Text style={s.categoryIcon}>{cat.icon}</Text>
                <Text style={s.categoryLabel}>{cat.label}</Text>
                <Ionicons name="chevron-forward" size={20} color={T3} />
              </TouchableOpacity>
            ))}
          </>
        ) : searching ? (
          <View style={s.centerBox}>
            <ActivityIndicator size="large" color={ACCENT} />
          </View>
        ) : results.length === 0 ? (
          <View style={s.centerBox}>
            <Ionicons name="search-outline" size={40} color={T3} />
            <Text style={s.noResults}>
              {searched ? 'Sin resultados. Prueba con otra búsqueda.' : 'Escribe al menos 3 letras para buscar'}
            </Text>
          </View>
        ) : (
          results.map((item, idx) => {
            const meta = RESULT_TYPES[item.type] || RESULT_TYPES.trend;
            return (
              <TouchableOpacity key={`${item.type}-${item.id}-${idx}`} style={s.resultCard} onPress={() => navigateTo(item)} activeOpacity={0.8}>
                <View style={s.resultIconWrap}>
                  <Ionicons name="search" size={18} color={ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.resultMain} numberOfLines={1}>{item.main}</Text>
                  <Text style={s.resultMeta}>{meta.icon} {meta.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={T3} />
              </TouchableOpacity>
            );
          })
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
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 14, padding: 12, marginHorizontal: 20, marginBottom: 24, borderWidth: 1, borderColor: BORDER },
  searchInput: { flex: 1, color: T1, fontSize: 14, marginLeft: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: T1, paddingHorizontal: 20, marginBottom: 12 },
  list: { paddingHorizontal: 20, gap: 10 },
  categoryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: BORDER },
  categoryIcon: { fontSize: 24, marginRight: 14 },
  categoryLabel: { flex: 1, fontSize: 15, fontWeight: '700', color: T1 },
  centerBox: { alignItems: 'center', paddingTop: 80, gap: 12 },
  noResults: { fontSize: 14, color: T2, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
  resultCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER, gap: 12 },
  resultIconWrap: { width: 38, height: 38, borderRadius: 11, backgroundColor: ACCENT + '20', alignItems: 'center', justifyContent: 'center' },
  resultMain: { fontSize: 15, fontWeight: '700', color: T1, marginBottom: 3 },
  resultMeta: { fontSize: 12, color: T3 },
});