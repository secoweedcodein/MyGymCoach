// features/workout/components/ExerciseCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import ExerciseIcon from '../../../components/ExerciseIcon';
import SetRow from './SetRow';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const SURFACE2 = '#1E1E1E';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';

export default function ExerciseCard({
  exercise,
  onAddSet,
  onSetPress,
  onSetLongPress,
  onToggleSetComplete,
  showRpe = false,
}) {
  return (
    <View style={s.card}>
      <View style={s.header}>
        <ExerciseIcon id={exercise.exerciseId} size={22} />
        <Text style={s.name}>{exercise.name}</Text>
        <TouchableOpacity style={s.addBtn} onPress={onAddSet} activeOpacity={0.8}>
          <Text style={s.addText}>+ Serie</Text>
        </TouchableOpacity>
      </View>
      {exercise.sets?.length ? (
        <FlatList
          data={exercise.sets}
          keyExtractor={(st) => String(st.id)}
          renderItem={({ item }) => (
            <SetRow
              set={item}
              onPress={() => onSetPress?.(item)}
              onLongPress={() => onSetLongPress?.(item)}
              onToggleComplete={() => onToggleSetComplete?.(item.id)}
              showRpe={showRpe}
            />
          )}
          scrollEnabled={false}
        />
      ) : (
        <Text style={s.empty}>Sin series aún</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 12,
    marginBottom: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  name: { flex: 1, color: T1, fontWeight: '800', fontSize: 14 },
  addBtn: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addText: { color: T1, fontWeight: '800', fontSize: 11 },
  empty: { color: T2, fontSize: 12, textAlign: 'center', paddingVertical: 6 },
});
