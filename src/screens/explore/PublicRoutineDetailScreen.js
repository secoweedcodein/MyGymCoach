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
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRoutine();
  }, [id]);

  async function loadRoutine() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('public_routines')
        .select('id, name, description, exercise_ids, level, image_id, image_url, badge, rating_avg, rating_count, views_count')
        .eq('id', id)
        .single();
      if (error) throw error;
      setRoutine(data);

      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      const { data: mine, error: mineError } = await supabase
        .from('routines')
        .select('id')
        .eq('user_id', userId)
        .eq('name', data.name)
        .limit(1);
      if (mineError) throw mineError;
      setSaved((mine || []).length > 0);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      if (saved) {
        const { error } = await supabase
          .from('routines')
          .delete()
          .eq('user_id', userId)
          .eq('name', routine.name);
        if (error) throw error;
        setSaved(false);
      } else {
        const { error } = await supabase
          .from('routines')
          .insert({
            user_id: userId,
            name: routine.name,
            description: routine.description || '',
            exercise_ids: routine.exercise_ids || [],
            is_challenge: false,
            created_at: new Date().toISOString(),
          });
        if (error) throw error;
        setSaved(true);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo guardar la rutina');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (error || !routine) {
    return (
      <View style={s.loading}>
        <Ionicons name="cloud-offline-outline" size={40} color={T3} />
        <Text style={s.errorText}>No se pudo cargar la rutina</Text>
        <TouchableOpacity style={s.retryBtn} onPress={loadRoutine} activeOpacity={0.8}>
          <Text style={s.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imageSource =
    routine.image_url && typeof routine.image_url === 'string' && routine.image_url.startsWith('http')
      ? { uri: routine.image_url }
      : (ROUTINE_IMAGES[routine.image_id] || ROUTINE_IMAGES.upper);

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.heroSection}>
          {typeof imageSource === 'number' ? (
            <Image source={imageSource} style={s.heroImage} />
          ) : (
            <Image source={imageSource} style={s.heroImage} resizeMode="cover" />
          )}
          <View style={s.heroGradient} />
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={T1} />
          </TouchableOpacity>
          <View style={s.heroBottom}>
            {routine.badge && (
              <View style={s.levelBadge}>
                <Ionicons name="barbell" size={12} color={BG} />
                <Text style={s.levelBadgeText}>{routine.badge}</Text>
              </View>
            )}
            <Text style={s.heroTitle}>{routine.name}</Text>
            {routine.level && (
              <Text style={s.heroSubtitle}>Nivel {routine.level}</Text>
            )}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Descripción</Text>
          <View style={s.descriptionCard}>
            <Text style={s.descriptionText}>
              {routine.description || 'Esta rutina todavía no tiene descripción.'}
            </Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Información</Text>
          <View style={s.infoCard}>
            <View style={s.infoRow}>
              <Ionicons name="barbell" size={18} color={ACCENT} />
              <Text style={s.infoLabel}>Nivel</Text>
              <Text style={s.infoValue}>{routine.level || 'General'}</Text>
            </View>
            <View style={s.infoRow}>
              <Ionicons name="star" size={18} color={ACCENT} />
              <Text style={s.infoLabel}>Valoración</Text>
              <Text style={s.infoValue}>{routine.rating_avg ? `${routine.rating_avg.toFixed?.(1) ?? routine.rating_avg} / 5` : 'Sin valoraciones'}</Text>
            </View>
            <View style={[s.infoRow, { marginBottom: 0 }]}>
              <Ionicons name="eye" size={18} color={ACCENT} />
              <Text style={s.infoLabel}>Visitas</Text>
              <Text style={s.infoValue}>{routine.views_count || 0}</Text>
            </View>
          </View>
        </View>

        <View style={s.saveSection}>
          <TouchableOpacity
            style={[s.saveBtn, saved && s.saveBtnActive]}
            onPress={toggleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color={saved ? ACCENT : BG} />
            ) : (
              <Ionicons
                name={saved ? 'checkmark-circle' : 'bookmark-outline'}
                size={20}
                color={saved ? ACCENT : BG}
              />
            )}
            <Text style={[s.saveBtnText, saved && s.saveBtnTextActive]}>
              {saved ? 'Guardada' : 'Guardar en mis rutinas'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loading: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 14, color: T2, fontWeight: '600' },
  retryBtn: { backgroundColor: ACCENT, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  retryText: { fontSize: 13, fontWeight: '800', color: BG },
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
  saveSection: { marginTop: 28, paddingHorizontal: 20 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 15, borderWidth: 1, borderColor: ACCENT },
  saveBtnActive: { backgroundColor: 'transparent', borderColor: ACCENT },
  saveBtnText: { fontSize: 15, fontWeight: '800', color: BG },
  saveBtnTextActive: { color: ACCENT },
});