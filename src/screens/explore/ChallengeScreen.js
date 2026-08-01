// src/screens/explore/ChallengeScreen.js
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
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

const CHALLENGES = [
  { id: 'c1', title: '10.000 pasos al día', participants: '4.2k', daysLeft: 12, progress: 0.4, description: 'Camina 10.000 pasos diarios durante 30 días.', reward: 'Insignia Caminante Élite' },
  { id: 'c2', title: 'Sin azúcar 7 días', participants: '2.8k', daysLeft: 3, progress: 0.7, description: 'Elimina el azúcar añadido de tu dieta.', reward: 'Insignia Disciplina' },
  { id: 'c3', title: '100 flexiones diarias', participants: '6.1k', daysLeft: 20, progress: 0.15, description: 'Haz 100 flexiones cada día.', reward: 'Insignia Fuerza' },
];

export default function ChallengeScreen() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={T1} />
        </TouchableOpacity>
        <Text style={s.title}>Retos</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
        {CHALLENGES.map(item => (
          <TouchableOpacity key={item.id} style={s.card} activeOpacity={0.85} onPress={() => router.push(`/explore/challenge/${item.id}`)}>
            <View style={s.cardHeader}>
              <View style={s.iconWrap}><Ionicons name="trophy" size={22} color={ACCENT} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{item.title}</Text>
                <Text style={s.cardMeta}>{item.participants} participantes · {item.daysLeft} días restantes</Text>
              </View>
            </View>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${item.progress * 100}%` }]} />
            </View>
            <Text style={s.description}>{item.description}</Text>
            <View style={s.rewardBox}>
              <Ionicons name="gift" size={16} color={ACCENT} />
              <Text style={s.rewardText}>Recompensa: {item.reward}</Text>
            </View>
            <TouchableOpacity style={s.participateBtn} activeOpacity={0.8}>
              <Text style={s.participateBtnText}>Participar</Text>
            </TouchableOpacity>
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
  list: { paddingHorizontal: 20, gap: 16 },
  card: { backgroundColor: SURFACE, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BORDER },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: ACCENT + '20', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: T1, marginBottom: 4 },
  cardMeta: { fontSize: 12, color: T3 },
  progressTrack: { height: 6, backgroundColor: SURFACE2, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  progressFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 3 },
  description: { fontSize: 13, color: T2, lineHeight: 18, marginBottom: 12 },
  rewardBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: ACCENT + '15', padding: 10, borderRadius: 10, marginBottom: 12 },
  rewardText: { fontSize: 12, fontWeight: '700', color: ACCENT },
  participateBtn: { backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  participateBtnText: { fontSize: 14, fontWeight: '800', color: BG },
});