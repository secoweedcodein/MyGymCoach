// src/screens/explore/TrendDetailScreen.js
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
const SURFACE2 = '#1E1E1E';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';

const TREND_IMAGES = {
  abs: require('../../../assets/wmremove-transformed.png'),
  hipertrofia: require('../../../assets/hiperftrofia.png'),
  funcional: require('../../../assets/funcional.png'),
  upper: require('../../../assets/upper.png'),
  ppl: require('../../../assets/PPL.png'),
  fullbody: require('../../../assets/fullbody.png'),
  '5x5': require('../../../assets/5x5.png'),
  '30dias': require('../../../assets/30diashipertrofia.png'),
};

function resolveImage(trend) {
  if (trend.image_url && typeof trend.image_url === 'string' && trend.image_url.startsWith('http')) {
    return { uri: trend.image_url };
  }
  return TREND_IMAGES[trend.image_id] || TREND_IMAGES.abs;
}

export default function TrendDetailScreen() {
  const { id } = useLocalSearchParams();
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [routineId, setRoutineId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTrend();
  }, [id]);

  async function loadTrend() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('trends')
        .select('id, title, subtitle, description, level, rating, rating_avg, users, badge, image_id, image_url, route')
        .eq('id', id)
        .single();
      if (error || !data) throw error || new Error('Tendencia no encontrada');
      setTrend(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!trend) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('routines')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', `Tendencia: ${trend.title}`)
        .maybeSingle();
      if (data) { setSaved(true); setRoutineId(data.id); }
    })();
  }, [trend]);

  async function handleSave() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { Alert.alert('Sesión requerida', 'Debes iniciar sesión para guardar rutinas'); return; }

    if (saved) {
      if (!routineId) return;
      const { error } = await supabase.from('routines').delete().eq('id', routineId);
      if (error) { Alert.alert('Error', error.message); return; }
      setSaved(false);
      setRoutineId(null);
      Alert.alert('Eliminada', 'La tendencia se quitó de tus rutinas');
      return;
    }

    setSaving(true);
    try {
      const { data: newRoutine, error } = await supabase.from('routines').insert({
        user_id: user.id,
        name: `Tendencia: ${trend.title}`,
        description: trend.description || '',
        exercise_ids: [],
        created_at: new Date().toISOString(),
      }).select().single();

      if (error) throw error;
      setSaved(true);
      setRoutineId(newRoutine.id);
      Alert.alert('¡Guardada!', 'La tendencia aparecerá en tus rutinas');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  }

  function goToProgram() {
    if (trend.route && trend.route.trim()) {
      router.push(trend.route.trim());
    } else {
      Alert.alert('Sin programa', 'Esta tendencia aún no tiene un programa asociado');
    }
  }

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (error || !trend) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color={T1} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Tendencia</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={s.centerBox}>
          <Ionicons name="cloud-offline-outline" size={40} color={T3} />
          <Text style={s.emptyText}>No se pudo cargar la tendencia</Text>
          <TouchableOpacity style={s.retryBtn} onPress={loadTrend} activeOpacity={0.8}>
            <Text style={s.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
        <BottomTabBar />
      </View>
    );
  }

  const rating = trend.rating_avg ? Number(trend.rating_avg).toFixed(1) : (trend.rating ? Number(trend.rating).toFixed(1) : '—');

  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header con imagen */}
        <View style={s.heroSection}>
          <Image source={resolveImage(trend)} style={s.heroImage} />
          <View style={s.heroOverlay} />

          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={T1} />
          </TouchableOpacity>

          <View style={s.heroContent}>
            {trend.level ? (
              <View style={s.levelBadge}>
                <Text style={s.levelBadgeText}>{trend.level}</Text>
              </View>
            ) : null}
            <Text style={s.heroTitle}>{trend.title}</Text>
            {trend.subtitle ? <Text style={s.heroSubtitle}>{trend.subtitle}</Text> : null}
          </View>
        </View>

        {/* Stats horizontales */}
        <View style={s.statsContainer}>
          <StatBox icon="⭐" label="Rating" value={rating} />
          <StatBox icon="👥" label="Usuarios" value={trend.users || '—'} />
          {trend.badge ? (
            <StatBox icon="🏷️" label="Etiqueta" value={trend.badge} />
          ) : null}
        </View>

        {/* Descripción */}
        {trend.description ? (
          <>
            <SectionHeader icon="📖" title="Descripción" />
            <View style={s.card}>
              <Text style={s.descriptionText}>{trend.description}</Text>
            </View>
          </>
        ) : null}

        {/* Botones de acción */}
        <View style={s.actionButtons}>
          <TouchableOpacity
            style={[s.actionBtn, s.saveBtn, saved && s.savedBtn]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={saved ? BG : ACCENT}
            />
            <Text style={[s.actionBtnText, saved && s.savedBtnText]}>
              {saving ? 'Guardando...' : saved ? 'Guardada' : 'Guardar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[s.actionBtn, s.programBtn]} onPress={goToProgram} activeOpacity={0.85}>
            <Ionicons name="play-circle" size={20} color={BG} />
            <Text style={s.actionBtnText}>Ver programa</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <BottomTabBar />
    </View>
  );
}

function StatBox({ icon, label, value }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={s.statValue} numberOfLines={1}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({ icon, title }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionIcon}>{icon}</Text>
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loadingContainer: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, gap: 16 },
  backBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: T1, flex: 1 },
  centerBox: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: '700', color: T2 },
  retryBtn: { marginTop: 8, backgroundColor: ACCENT, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  retryText: { fontSize: 13, fontWeight: '800', color: BG },

  heroSection: { width: '100%', height: 320, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, backgroundColor: 'rgba(13,13,13,0.9)' },
  heroContent: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  levelBadge: { alignSelf: 'flex-start', backgroundColor: ACCENT, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, marginBottom: 12 },
  levelBadgeText: { fontSize: 11, fontWeight: '800', color: BG },
  heroTitle: { fontSize: 32, fontWeight: '800', color: T1, marginBottom: 6, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 16, color: T2, fontWeight: '500' },

  statsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, gap: 10 },
  statBox: { flex: 1, backgroundColor: SURFACE, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: BORDER },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 15, fontWeight: '800', color: T1, marginBottom: 2 },
  statLabel: { fontSize: 9, color: T3, fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginTop: 24, marginBottom: 12 },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: T1 },
  card: { marginHorizontal: 20, backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  descriptionText: { fontSize: 14, color: T2, lineHeight: 22 },

  actionButtons: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 28 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 14 },
  saveBtn: { backgroundColor: SURFACE, borderWidth: 1, borderColor: ACCENT },
  savedBtn: { backgroundColor: ACCENT },
  programBtn: { backgroundColor: SURFACE2, borderWidth: 1, borderColor: BORDER },
  actionBtnText: { fontSize: 14, fontWeight: '800', color: BG },
  savedBtnText: { color: BG },
});