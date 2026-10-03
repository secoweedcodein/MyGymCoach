// features/workout/components/ExerciseSelectorModal.js
import React, { useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, TextInput, StyleSheet } from 'react-native';
import ExerciseIcon from '../../../components/ExerciseIcon';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const SURFACE2 = '#1E1E1E';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';

export default function ExerciseSelectorModal({ visible, onClose, exercises = [], onSelect }) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const s = q.toLowerCase();
    if (!s) return exercises;
    return exercises.filter(e => (e.name || '').toLowerCase().includes(s) || (e.muscle || '').toLowerCase().includes(s));
  }, [q, exercises]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.header}>
            <Text style={s.title}>Seleccionar ejercicio</Text>
            <TouchableOpacity onPress={onClose} style={s.close}>
              <Text style={s.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Buscar ejercicio o músculo..."
            placeholderTextColor={T2}
            style={s.input}
          />
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.item} onPress={() => onSelect(item)} activeOpacity={0.7}>
                <ExerciseIcon id={item.id} size={20} />
                <View style={s.itemInfo}>
                  <Text style={s.itemName}>{item.name}</Text>
                  <Text style={s.itemMeta}>{item.muscle} • {item.type}</Text>
                </View>
                <Text style={s.itemArrow}>›</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { height: '80%', backgroundColor: BG, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: BORDER },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  title: { color: T1, fontWeight: '800', fontSize: 16 },
  close: { padding: 6 },
  closeText: { color: T2, fontSize: 18 },
  input: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: SURFACE2,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    color: T1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 10, borderBottomWidth: 1, borderBottomColor: BORDER },
  itemInfo: { flex: 1 },
  itemName: { color: T1, fontWeight: '700' },
  itemMeta: { color: T2, fontSize: 12, marginTop: 2 },
  itemArrow: { color: T2, fontSize: 18 },
});
