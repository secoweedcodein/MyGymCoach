import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { EXERCISES, MUSCLES } from './data/exercises';
import { colors, radius, spacing } from '../../lib/theme';

export default function LibraryScreen() {
  const [query, setQuery]   = useState('');
  const [muscle, setMuscle] = useState('Todos');

  const filtered = EXERCISES.filter(e =>
    (muscle === 'Todos' || e.muscle === muscle) &&
    e.name.toLowerCase().includes(query.toLowerCase())
  );

  const typeColors = { Fuerza: colors.blue, Hipertrofia: colors.accent2, Funcional: colors.green };

  return (
    <View style={s.container}>
      <Text style={s.title}>Biblioteca de Ejercicios</Text>

      <TextInput style={s.search} value={query} onChangeText={setQuery}
        placeholder="Buscar ejercicio..." placeholderTextColor={colors.t3} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chips}>
        {MUSCLES.map(m => (
          <TouchableOpacity key={m} style={[s.chip, m === muscle && s.chipOn]} onPress={() => setMuscle(m)}>
            <Text style={[s.chipText, m === muscle && s.chipTextOn]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingTop: 8, paddingBottom: 40 }}>
        {filtered.map(ex => (
          <View key={ex.id} style={s.card}>
            <Text style={s.cardIcon}>{ex.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.cardName}>{ex.name}</Text>
              <Text style={s.cardSub}>{ex.muscle}</Text>
            </View>
            <Text style={[s.badge, { color: typeColors[ex.type] || colors.blue }]}>{ex.type}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: spacing.lg },
  title:     { fontSize: 22, fontWeight: '700', color: colors.t1, paddingHorizontal: spacing.lg, marginBottom: 12 },
  search:    { backgroundColor: colors.bg3, borderWidth: 1, borderColor: '#ffffff10', borderRadius: radius.md, color: colors.t1, fontSize: 14, paddingHorizontal: 14, paddingVertical: 10, marginHorizontal: spacing.lg, marginBottom: 10 },
  chips:     { paddingLeft: spacing.lg, marginBottom: 4, flexGrow: 0 },
  chip:      { backgroundColor: colors.bg3, borderWidth: 1, borderColor: '#ffffff10', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 14, marginRight: 6 },
  chipOn:    { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText:  { fontSize: 12, fontWeight: '600', color: colors.t3 },
  chipTextOn:{ color: '#000' },
  card:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.bg3, borderRadius: radius.md, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: '#ffffff07' },
  cardIcon:  { fontSize: 22 },
  cardName:  { fontSize: 14, fontWeight: '600', color: colors.t1 },
  cardSub:   { fontSize: 11, color: colors.t3 },
  badge:     { fontSize: 11, fontWeight: '600' },
});