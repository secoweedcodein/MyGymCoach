// features/workout/components/SetEditorModal.js
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GymKeypad } from '../../../components/GymKeypad';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';

const TYPES = [
  { k: 'N', label: 'Normal' },
  { k: 'W', label: 'Calent.' },
  { k: 'D', label: 'Drop' },
  { k: 'F', label: 'Fallo' },
];

export default function SetEditorModal({ visible, set, onClose, onSave, onDelete }) {
  const [weight, setWeight] = useState(set?.weightKg ? String(set.weightKg) : '');
  const [reps, setReps] = useState(set?.reps ? String(set.reps) : '');
  const [type, setType] = useState(set?.setType || 'N');

  useEffect(() => {
    if (visible) {
      setWeight(set?.weightKg ? String(set.weightKg) : '');
      setReps(set?.reps ? String(set.reps) : '');
      setType(set?.setType || 'N');
    }
  }, [visible, set]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.header}>
            <Text style={s.title}>Editar serie</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={s.close}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.label}>Peso (kg)</Text>
          <View style={s.valueRow}>
            <Text style={s.value}>{weight || '0'}</Text>
            <Text style={s.unit}>kg</Text>
          </View>
          <GymKeypad value={weight} onChange={setWeight} suffix="kg" />
          <Text style={s.label}>Repeticiones</Text>
          <View style={s.valueRow}>
            <Text style={s.value}>{reps || '0'}</Text>
            <Text style={s.unit}>rep</Text>
          </View>
          <GymKeypad value={reps} onChange={setReps} />
          <Text style={s.label}>Tipo</Text>
          <View style={s.types}>
            {TYPES.map(t => (
              <TouchableOpacity
                key={t.k}
                style={[s.typeBtn, type === t.k && s.typeBtnActive]}
                onPress={() => setType(t.k)}
              >
                <Text style={[s.typeTxt, type === t.k && s.typeTxtActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.actions}>
            {onDelete && (
              <TouchableOpacity style={[s.btn, s.btnDel]} onPress={() => onDelete(set)}>
                <Text style={s.btnDelTxt}>Eliminar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.btn, s.btnSave]}
              onPress={() =>
                onSave({ ...set, weightKg: parseFloat(weight) || 0, reps: parseInt(reps) || 0, setType: type })
              }
            >
              <Text style={s.btnSaveTxt}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: BG, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, borderWidth: 1, borderColor: BORDER },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: T1, fontWeight: '800', fontSize: 16 },
  close: { color: T2, fontSize: 18 },
  label: { color: T2, fontSize: 12, marginTop: 12, marginBottom: 4 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: SURFACE, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: BORDER },
  value: { color: T1, fontSize: 28, fontWeight: '800', flex: 1 },
  unit: { color: T2, marginLeft: 6 },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  typeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  typeBtnActive: { backgroundColor: ACCENT },
  typeTxt: { color: T1, fontWeight: '700' },
  typeTxtActive: { color: '#000' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnSave: { backgroundColor: ACCENT },
  btnSaveTxt: { color: '#000', fontWeight: '800' },
  btnDel: { backgroundColor: '#FF453A' },
  btnDelTxt: { color: '#fff', fontWeight: '800' },
});
