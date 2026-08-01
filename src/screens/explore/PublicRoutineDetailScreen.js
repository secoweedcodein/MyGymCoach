// src/screens/explore/PublicRoutineDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import BottomTabBar from '../../../components/BottomTabBar';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';

const ROUTINE_IMAGES = {
  abs: require('../../../assets/wmremove-transformed.png'),
  hipertrofia: require('../../../assets/hiperftrofia.png'),
  funcional: require('../../../assets/funcional.png'),
  upper: require('../../../assets/upper.png'),
  ppl: require('../../../assets/PPL.png'),
  fullbody: require('../../../assets/fullbody.png'),
  '5x5': require('../../../assets/5x5.png'),
  '30dias': require('../../../assets/30diashipertrofia.png'),
};

export default function PublicRoutineDetailScreen() {
  const { id } = useLocalSearchParams();
  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoutine();
  }, [id]);

  async function loadRoutine() {
    setLoading(true);
    const { data, error } = await supabase
      .from('public_routines')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      Alert.alert('Error', 'No se encontró la rutina');
      router.back();
      return;
    }

    setRoutine(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!routine) return null;

  const imageSource = ROUTINE_IMAGES[routine.image_id] || ROUTINE_IMAGES.upper;

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.heroSection}>
          <Image source={imageSource} style={s.heroImage} />
          <View style={s.heroGradient} />
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={T1} />
          </TouchableOpacity>
          <View style={s.heroBottom}>
            <View style={s.levelBadge}>
              <Ionicons name="barbell" size={12} color={BG} />
              <Text style={s.levelBadgeText}>{routine.level}</Text>
            </View>
            <Text style={s.heroTitle}>{routine.name}</Text>
            {routine.frequency && (
              <Text style={s.heroSubtitle}>{routine.frequency}</Text>
            )}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Descripción</Text>
          <View style={s.descriptionCard}>
            <Text style={s.descriptionText}>{routine.description}</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Información</Text>
          <View style={s.infoCard}>
            <View style={s.infoRow}>
              <Ionicons name="calendar" size={18} color={ACCENT} />
              <Text style={s.infoLabel}>Frecuencia</Text>
              <Text style={s.infoValue}>{routine.frequency || 'No especificada'}</Text>
            </View>
            <View style={s.infoRow}>
              <Ionicons name="barbell" size={18} color={ACCENT} />
              <Text style={s.infoLabel}>Nivel</Text>
              <Text style={s.infoValue}>{routine.level}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loading: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  heroSection: { width: '100%', height: 340, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 220, backgroundColor: 'rgba(13,13,13,0.95)' },
  backBtn: { position: 'absolute', top: 56, left: 20, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  heroBottom: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  levelBadge: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: ACCENT, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 12, gap: 6, alignItems: 'center' },
  levelBadgeText: { fontSize: 11, fontWeight: '800', color: BG },
  heroTitle: { fontSize: 32, fontWeight: '800', color: T1, marginBottom: 6, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 16, color: T2, fontWeight: '500' },
  section: { marginTop: 28, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: T1, marginBottom: 12 },
  descriptionCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER, borderLeftWidth: 4, borderLeftColor: ACCENT },
  descriptionText: { fontSize: 14, color: T2, lineHeight: 22 },
  infoCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  infoLabel: { flex: 1, fontSize: 13, color: T2, fontWeight: '600' },
  infoValue: { fontSize: 13, color: T1, fontWeight: '700' },
});