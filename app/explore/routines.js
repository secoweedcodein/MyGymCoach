import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomTabBar from '../../components/BottomTabBar';
import { supabase } from '../../lib/supabase';
import { colors as c } from '../../lib/theme';

const BG = c.bg;
const SURFACE = c.bg2;
const BORDER = c.border;
const T1 = c.t1;
const T2 = c.t2;
const T3 = c.t3;
const ACCENT = c.accent;
const RED = '#FF453A';

function resolveImage(r) {
  if (r.image_url && typeof r.image_url === 'string' && r.image_url.startsWith('http')) {
    return { uri: r.image_url };
  }
  const local = {
    abs: require('../../assets/wmremove-transformed.png'),
    hipertrofia: require('../../assets/hiperftrofia.png'),
    funcional: require('../../assets/funcional.png'),
    upper: require('../../assets/upper.png'),
    ppl: require('../../assets/PPL.png'),
    fullbody: require('../../assets/fullbody.png'),
    '5x5': require('../../assets/5x5.png'),
    '30dias': require('../../assets/30diashipertrofia.png'),
  };
  return local[r.image_id] || local.abs;
}

export default function AllRoutinesScreen() {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRoutines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('public_routines')
        .select('id, name, level, image_id, image_url, description, rating_avg, views_count, route')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRoutines(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, [loadRoutines])
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={T1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>🏋️ Todas las Rutinas</Text>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={s.centerBox}>
            <ActivityIndicator size="large" color={ACCENT} />
          </View>
        ) : error ? (
          <View style={s.centerBox}>
            <Ionicons name="cloud-offline-outline" size={40} color={T3} />
            <Text style={s.emptyText}>No se pudieron cargar las rutinas</Text>
            <TouchableOpacity style={s.retryBtn} onPress={loadRoutines} activeOpacity={0.8}>
              <Text style={s.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : routines.length === 0 ? (
          <View style={s.centerBox}>
            <Ionicons name="barbell-outline" size={40} color={T3} />
            <Text style={s.emptyText}>Todavía no hay rutinas públicas</Text>
            <Text style={s.emptySubtext}>Vuelve más tarde.</Text>
          </View>
        ) : (
          routines.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={s.card}
              onPress={() => router.push(`/explore/public-routine-detail?id=${r.id}`)}
              activeOpacity={0.8}
            >
              <Image source={resolveImage(r)} style={s.cardImage} />
              <View style={s.cardContent}>
                <Text style={s.cardTitle} numberOfLines={1}>{r.name}</Text>
                <Text style={s.cardLevel}>{r.level || 'Sin nivel'}</Text>
                <View style={s.viewBtn}>
                  <Text style={s.viewBtnText}>Ver detalle →</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, gap: 16 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: T1 },
  scrollContent: { padding: 20, gap: 16, paddingBottom: 100 },
  centerBox: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: '700', color: T2 },
  emptySubtext: { fontSize: 12, color: T3 },
  retryBtn: { marginTop: 8, backgroundColor: ACCENT, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  retryText: { fontSize: 13, fontWeight: '800', color: '#000' },
  card: { flexDirection: 'row', backgroundColor: SURFACE, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: BORDER },
  cardImage: { width: 100, height: 100 },
  cardContent: { flex: 1, padding: 16, justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: T1, marginBottom: 4 },
  cardLevel: { fontSize: 12, color: T2, marginBottom: 12 },
  viewBtn: { backgroundColor: ACCENT, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
  viewBtnText: { fontSize: 12, fontWeight: '800', color: BG },
});