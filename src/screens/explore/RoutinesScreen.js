import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, TextInput } from 'react-native';
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

const ROUTINES = [
  { id: 'r1', image: require('../../../assets/upper.png'), title: 'Hipertrofia Upper', level: 'Intermedio', rating: 4.7, users: '12.3k', badge: 'popular', category: 'Hipertrofia', duration: '45 min' },
  { id: 'r2', image: require('../../../assets/PPL.png'), title: 'Push Pull Legs', level: 'Intermedio', rating: 4.8, users: '9.7k', badge: 'verificado', category: 'Hipertrofia', duration: '60 min' },
  { id: 'r3', image: require('../../../assets/fullbody.png'), title: 'Full Body 3 Días', level: 'Principiante', rating: 4.5, users: '6.2k', category: 'Principiante', duration: '40 min' },
  { id: 'r4', image: require('../../../assets/5x5.png'), title: 'Fuerza 5x5', level: 'Avanzado', rating: 4.9, users: '4.8k', badge: 'ia', category: 'Powerlifting', duration: '50 min' },
  { id: 'r5', image: require('../../../assets/funcional.png'), title: 'Crossfit WOD', level: 'Intermedio', rating: 4.6, users: '7.1k', category: 'Crossfit', duration: '30 min' },
];

export default function RoutinesScreen() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const categories = ['Todas', 'Hipertrofia', 'Powerlifting', 'Crossfit', 'Principiante', 'Intermedio', 'Avanzado'];

  const filtered = ROUTINES.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'Todas' || item.category === category || item.level === category;
    return matchSearch && matchCategory;
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={T1} />
        </TouchableOpacity>
        <Text style={s.title}>Rutinas</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={s.searchContainer}>
        <Ionicons name="search" size={18} color={T3} />
        <TextInput style={s.searchInput} placeholder="Buscar rutinas..." placeholderTextColor={T3} value={search} onChangeText={setSearch} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll}>
        {categories.map(cat => (
          <TouchableOpacity key={cat} style={[s.filterChip, category === cat && s.filterChipActive]} onPress={() => setCategory(cat)}>
            <Text style={[s.filterText, category === cat && s.filterTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
        {filtered.map(item => (
          <TouchableOpacity key={item.id} style={s.card} activeOpacity={0.85} onPress={() => router.push(`/explore/routines/${item.id}`)}>
            <Image source={item.image} style={s.cardImage} />
            <View style={s.cardBody}>
              <Text style={s.cardTitle}>{item.title}</Text>
              <View style={s.badgeRow}>
                <View style={s.levelBadge}><Text style={s.levelText}>{item.level}</Text></View>
                <View style={s.durationBadge}><Ionicons name="time-outline" size={12} color={T2} /><Text style={s.durationText}>{item.duration}</Text></View>
              </View>
              <View style={s.cardMeta}>
                <View style={s.metaItem}><Ionicons name="star" size={14} color={ACCENT} /><Text style={s.metaText}>{item.rating}</Text></View>
                <View style={s.metaItem}><Ionicons name="people" size={14} color={T3} /><Text style={s.metaText}>{item.users}</Text></View>
              </View>
              <View style={s.buttonRow}>
                <TouchableOpacity style={s.saveBtn} activeOpacity={0.8}>
                  <Ionicons name="bookmark-outline" size={16} color={T1} />
                </TouchableOpacity>
                <TouchableOpacity style={s.startBtn} activeOpacity={0.8}>
                  <Text style={s.startBtnText}>Comenzar</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 14, padding: 12, marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderColor: BORDER },
  searchInput: { flex: 1, color: T1, fontSize: 14, marginLeft: 10 },
  filterScroll: { paddingHorizontal: 20, marginBottom: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, marginRight: 8 },
  filterChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  filterText: { fontSize: 12, fontWeight: '700', color: T2 },
  filterTextActive: { color: BG },
  list: { paddingHorizontal: 20, gap: 16 },
  card: { backgroundColor: SURFACE, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: BORDER },
  cardImage: { width: '100%', height: 140 },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: T1, marginBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  levelBadge: { backgroundColor: ACCENT + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  levelText: { fontSize: 11, fontWeight: '700', color: ACCENT },
  durationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: SURFACE2, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  durationText: { fontSize: 11, color: T2, fontWeight: '600' },
  cardMeta: { flexDirection: 'row', gap: 14, marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: T3, fontWeight: '600' },
  buttonRow: { flexDirection: 'row', gap: 10 },
  saveBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  startBtn: { flex: 1, backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  startBtnText: { fontSize: 14, fontWeight: '800', color: BG },
});