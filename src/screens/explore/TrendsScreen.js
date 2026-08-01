import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, TextInput, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomTabBar from '../../../components/BottomTabBar';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const SURFACE2 = '#1E1E1E';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';

const { width } = Dimensions.get('window');

const TRENDING = [
  { id: 't1', image: require('../../../assets/wmremove-transformed.png'), title: 'Reto 30 días Abs', level: 'Intermedio', rating: 4.8, users: '12.3k', badge: 'popular', duration: '30 días', calories: 350, description: 'Transforma tu core en 30 días con este programa progresivo.' },
  { id: 't2', image: require('../../../assets/hiperftrofia.png'), title: 'Hipertrofia Avanzada', level: 'Avanzado', rating: 8.1, users: '12.3k', duration: '8 semanas', calories: 450, description: 'Programa de hipertrofia para atletas experimentados.' },
  { id: 't3', image: require('../../../assets/funcional.png'), title: 'Fuerza Funcional', level: 'Principiante', rating: 4.6, users: '5.4k', badge: 'nuevo', duration: '6 semanas', calories: 300, description: 'Mejora tu fuerza funcional con ejercicios compuestos.' },
  { id: 't4', image: require('../../../assets/upper.png'), title: 'Powerbuilding', level: 'Avanzado', rating: 4.9, users: '8.7k', duration: '12 semanas', calories: 500, description: 'Combina powerlifting e hipertrofia para máxima fuerza.' },
];

export default function TrendsScreen() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Todos');
  const filters = ['Todos', 'Popular', 'Nuevo', 'Principiante', 'Intermedio', 'Avanzado'];

  const filtered = TRENDING.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'Todos' || item.level === filter || item.badge === filter.toLowerCase();
    return matchSearch && matchFilter;
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={T1} />
        </TouchableOpacity>
        <Text style={s.title}>Tendencias</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={s.searchContainer}>
        <Ionicons name="search" size={18} color={T3} />
        <TextInput style={s.searchInput} placeholder="Buscar tendencias..." placeholderTextColor={T3} value={search} onChangeText={setSearch} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll}>
        {filters.map(f => (
          <TouchableOpacity key={f} style={[s.filterChip, filter === f && s.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="search-outline" size={48} color={T3} />
            <Text style={s.emptyText}>No se encontraron tendencias</Text>
          </View>
        ) : (
          filtered.map(item => (
            <TouchableOpacity key={item.id} style={s.card} activeOpacity={0.85} onPress={() => router.push(`/explore/trends/${item.id}`)}>
              <Image source={item.image} style={s.cardImage} />
              <View style={s.cardBody}>
                <Text style={s.cardTitle}>{item.title}</Text>
                <Text style={s.cardSub}>{item.level} · {item.duration}</Text>
                <View style={s.cardMeta}>
                  <View style={s.metaItem}><Ionicons name="star" size={14} color={ACCENT} /><Text style={s.metaText}>{item.rating}</Text></View>
                  <View style={s.metaItem}><Ionicons name="people" size={14} color={T3} /><Text style={s.metaText}>{item.users}</Text></View>
                  <View style={s.metaItem}><Ionicons name="flame" size={14} color={T2} /><Text style={s.metaText}>{item.calories} kcal</Text></View>
                </View>
                <Text style={s.cardDesc} numberOfLines={2}>{item.description}</Text>
                <TouchableOpacity style={s.saveBtn} activeOpacity={0.8}>
                  <Ionicons name="bookmark-outline" size={16} color={ACCENT} />
                  <Text style={s.saveBtnText}>Guardar</Text>
                </TouchableOpacity>
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
  filterScroll: { paddingHorizontal: 20, marginBottom: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, marginRight: 8 },
  filterChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  filterText: { fontSize: 12, fontWeight: '700', color: T2 },
  filterTextActive: { color: BG },
  list: { paddingHorizontal: 20, gap: 16 },
  card: { backgroundColor: SURFACE, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: BORDER },
  cardImage: { width: '100%', height: 160 },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: T1, marginBottom: 4 },
  cardSub: { fontSize: 12, color: T2, marginBottom: 10 },
  cardMeta: { flexDirection: 'row', gap: 14, marginBottom: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: T3, fontWeight: '600' },
  cardDesc: { fontSize: 12, color: T2, lineHeight: 18, marginBottom: 12 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ACCENT + '15', paddingVertical: 10, borderRadius: 10, justifyContent: 'center' },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: ACCENT },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: T3, marginTop: 12 },
});