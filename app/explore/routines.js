import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomTabBar from '../../components/BottomTabBar';

const BG = '#0D0D0D';
const SURFACE = '#161616';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const ACCENT = '#C0FF3E';

const ALL_ROUTINES = [
  { id: 'upper', image: require('../../assets/upper.png'), title: 'Hipertrofia Upper', level: 'Intermedio' },
  { id: 'ppl', image: require('../../assets/PPL.png'), title: 'Push Pull Legs', level: 'Intermedio' },
  { id: 'fullbody', image: require('../../assets/fullbody.png'), title: 'Full Body 3 Días', level: 'Principiante' },
  { id: '5x5', image: require('../../assets/5x5.png'), title: 'Fuerza 5x5', level: 'Avanzado' },
];

export default function AllRoutinesScreen() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={T1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>🏋️ Todas las Rutinas</Text>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {ALL_ROUTINES.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={s.card}
            onPress={() => router.push(`/explore/routine-detail?id=${r.id}`)}
            activeOpacity={0.8}
          >
            <Image source={r.image} style={s.cardImage} />
            <View style={s.cardContent}>
              <Text style={s.cardTitle}>{r.title}</Text>
              <Text style={s.cardLevel}>{r.level}</Text>
              <View style={s.viewBtn}>
                <Text style={s.viewBtnText}>Ver detalle →</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, gap: 16 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: T1 },
  scrollContent: { padding: 20, gap: 16, paddingBottom: 100 },
  card: { flexDirection: 'row', backgroundColor: SURFACE, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: BORDER },
  cardImage: { width: 100, height: 100 },
  cardContent: { flex: 1, padding: 16, justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: T1, marginBottom: 4 },
  cardLevel: { fontSize: 12, color: T2, marginBottom: 12 },
  viewBtn: { backgroundColor: ACCENT, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
  viewBtnText: { fontSize: 12, fontWeight: '800', color: BG },
});