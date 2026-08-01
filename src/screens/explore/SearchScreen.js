import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
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

export default function SearchScreen() {
  const [search, setSearch] = useState('');
  const categories = [
    { icon: '', label: 'Tendencias', route: '/explore/trends' },
    { icon: '🏋️', label: 'Rutinas', route: '/explore/routines' },
    { icon: '🍳', label: 'Recetas IA', route: '/explore/recipes-ai' },
    { icon: '', label: 'Comunidad', route: '/explore/community-recipes' },
    { icon: '📚', label: 'Aprende', route: '/explore/learn' },
    { icon: '🎯', label: 'Retos', route: '/explore/challenge' },
    { icon: '⭐', label: 'Ejercicios', route: '/explore/exercise-day' },
  ];

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
        <TextInput style={s.searchInput} placeholder="¿Qué estás buscando?" placeholderTextColor={T3} value={search} onChangeText={setSearch} autoFocus />
      </View>

      <Text style={s.sectionTitle}>Categorías</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
        {categories.map((cat, idx) => (
          <TouchableOpacity key={idx} style={s.categoryCard} onPress={() => router.push(cat.route)} activeOpacity={0.8}>
            <Text style={s.categoryIcon}>{cat.icon}</Text>
            <Text style={s.categoryLabel}>{cat.label}</Text>
            <Ionicons name="chevron-forward" size={20} color={T3} />
          </TouchableOpacity>
        ))}
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
});