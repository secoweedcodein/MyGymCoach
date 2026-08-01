// src/components/WeightUpdateModal.js
import React, { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const SRF2 = '#1E1E1E';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';

export default function WeightUpdateModal({ visible, onClose, userId }) {
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const weightValue = parseFloat(weight);
    if (!weightValue || weightValue <= 0 || weightValue > 500) {
      alert('Por favor ingresa un peso válido');
      return;
    }

    setSaving(true);
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase.from('weight_logs').upsert({
      user_id: userId,
      weight_kg: weightValue,
      logged_date: today,
    }, { onConflict: 'user_id,logged_date' });

    setSaving(false);

    if (error) {
      alert('Error al guardar: ' + error.message);
    } else {
      setWeight('');
      onClose();
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={wm.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={wm.container}
        >
          <View style={wm.card}>
            <View style={wm.glow} />
            
            <Text style={wm.icon}>⚖️</Text>
            <Text style={wm.title}>¿Actualizar tu peso?</Text>
            <Text style={wm.subtitle}>
              Han pasado 3 semanas desde tu último registro. Mantener tu peso actualizado ayuda al Coach IA a darte mejores recomendaciones.
            </Text>

            <TextInput
              style={wm.input}
              value={weight}
              onChangeText={setWeight}
              placeholder="Ej: 75.5"
              placeholderTextColor={T3}
              keyboardType="decimal-pad"
              autoFocus
            />

            <View style={wm.buttonRow}>
              <TouchableOpacity
                style={wm.skipBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={wm.skipBtnText}>Ahora no</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[wm.saveBtn, saving && wm.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color={BG} size="small" />
                ) : (
                  <Text style={wm.saveBtnText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const wm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: SURFACE,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: ACCENT + '30',
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: ACCENT,
    opacity: 0.08,
  },
  icon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: T1,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: T2,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  input: {
    backgroundColor: SRF2,
    borderRadius: 14,
    padding: 16,
    fontSize: 20,
    fontWeight: '700',
    color: T1,
    borderWidth: 1,
    borderColor: BORDER,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: SRF2,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: T2,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: ACCENT,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: BG,
  },
});