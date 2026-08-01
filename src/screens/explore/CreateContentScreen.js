import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
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

const OPTIONS = [
  { icon: '🏋️', label: 'Rutina', desc: 'Crea una nueva rutina', color: '#C0FF3E' },
  { icon: '🍳', label: 'Receta', desc: 'Comparte una receta', color: '#FF9500' },
  { icon: '📚', label: 'Artículo', desc: 'Escribe un artículo', color: '#3E8EFF' },
  { icon: '⭐', label: 'Ejercicio', desc: 'Añade un ejercicio', color: '#A78BFA' },
];

export default function CreateContentScreen() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={T1} />
        </TouchableOpacity>
        <Text style={s.title}>Crear contenido</Text>
        <View style={{ width: 44 }} />
      </View>

      <Text style={s.subtitle}>¿Qué deseas crear?</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
        {OPTIONS.map((opt, idx) => (
          <TouchableOpacity key={idx} style={s.optionCard} activeOpacity={0.85}>
            <View style={[s.optionIconWrap, { backgroundColor: opt.color + '20' }]}>
              <Text style={s.optionIcon}>{opt.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.optionLabel}>{opt.label}</Text>
              <Text style={s.optionDesc}>{opt.desc}</Text>
            </View>
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
  subtitle: { fontSize: 14, color: T2, paddingHorizontal: 20, marginBottom: 20 },
  list: { paddingHorizontal: 20, gap: 12 },
  optionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  optionIconWrap: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  optionIcon: { fontSize: 24 },
  optionLabel: { fontSize: 15, fontWeight: '700', color: T1, marginBottom: 2 },
  optionDesc: { fontSize: 12, color: T3 },
});