// src/screens/explore/ExerciseOfDayScreen.js
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EXERCISE_OF_DAY } from '../data/exploreData';
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

export default function ExerciseOfDayScreen() {
  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={T1} />
          </TouchableOpacity>
          <Text style={s.title}>Ejercicio del Día</Text>
          <View style={{ width: 44 }} />
        </View>

        <Image source={EXERCISE_OF_DAY.image} style={s.heroImage} />

        <View style={s.content}>
          <Text style={s.exerciseName}>{EXERCISE_OF_DAY.name}</Text>
          
          <View style={s.badgeRow}>
            <View style={s.badge}>
              <Ionicons name="fitness" size={14} color={ACCENT} />
              <Text style={s.badgeText}>{EXERCISE_OF_DAY.muscle}</Text>
            </View>
            <View style={s.badge}>
              <Ionicons name="bar-chart" size={14} color={T2} />
              <Text style={s.badgeText}>{EXERCISE_OF_DAY.difficulty}</Text>
            </View>
          </View>

          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statValue}>{EXERCISE_OF_DAY.sets}</Text>
              <Text style={s.statLabel}>Series</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statValue}>{EXERCISE_OF_DAY.reps}</Text>
              <Text style={s.statLabel}>Repeticiones</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statValue}>{EXERCISE_OF_DAY.rest}</Text>
              <Text style={s.statLabel}>Descanso</Text>
            </View>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Ejecución correcta</Text>
            <Text style={s.sectionText}>{EXERCISE_OF_DAY.execution}</Text>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Errores comunes</Text>
            <Text style={s.sectionText}>{EXERCISE_OF_DAY.mistakes}</Text>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Variantes</Text>
            <Text style={s.sectionText}>{EXERCISE_OF_DAY.variants}</Text>
          </View>

          <TouchableOpacity style={s.startBtn} activeOpacity={0.8}>
            <Ionicons name="play-circle" size={20} color={BG} />
            <Text style={s.startBtnText}>Comenzar ejercicio</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: 'rgba(13,13,13,0.8)' },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: T1 },
  heroImage: { width: '100%', height: 280 },
  content: { padding: 20 },
  exerciseName: { fontSize: 28, fontWeight: '800', color: T1, marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: SURFACE, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: BORDER },
  badgeText: { fontSize: 12, fontWeight: '700', color: T1 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: SURFACE, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  statValue: { fontSize: 16, fontWeight: '800', color: ACCENT, marginBottom: 4 },
  statLabel: { fontSize: 10, color: T3, fontWeight: '600' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: T1, marginBottom: 8 },
  sectionText: { fontSize: 13, color: T2, lineHeight: 20 },
  startBtn: { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 10 },
  startBtnText: { fontSize: 15, fontWeight: '800', color: BG },
});