// src/screens/explore/ChallengeScreen.js
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
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

export default function ChallengeScreen() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadChallenges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('id, name, subtitle, description, duration_days, level, participants, image_id, image_url')
        .eq('is_official', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setChallenges(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadChallenges();
    }, [loadChallenges])
  );

  function openDetail(id) {
    router.push(`/explore/challenge-detail?id=${id}`);
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={T1} />
        </TouchableOpacity>
        <Text style={s.title}>Retos</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.list}>
        {loading ? (
          <View style={s.centerBox}>
            <ActivityIndicator size="large" color={ACCENT} />
          </View>
        ) : error ? (
          <View style={s.centerBox}>
            <Ionicons name="cloud-offline-outline" size={40} color={T3} />
            <Text style={s.emptyText}>No se pudieron cargar los retos</Text>
            <TouchableOpacity style={s.retryBtn} onPress={loadChallenges} activeOpacity={0.8}>
              <Text style={s.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : challenges.length === 0 ? (
          <View style={s.centerBox}>
            <Ionicons name="trophy-outline" size={40} color={T3} />
            <Text style={s.emptyText}>Todavía no hay retos disponibles</Text>
            <Text style={s.emptySubtext}>Vuelve más tarde.</Text>
          </View>
        ) : (
          challenges.map(item => (
            <TouchableOpacity key={item.id} style={s.card} activeOpacity={0.85} onPress={() => openDetail(item.id)}>
              <View style={s.cardHeader}>
                <View style={s.iconWrap}><Ionicons name="trophy" size={22} color={ACCENT} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{item.name}</Text>
                  <Text style={s.cardMeta}>
                    {item.participants || 0} participantes · {item.duration_days || 30} días
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={T3} />
              </View>

              <View style={s.levelPill}>
                <Text style={s.levelPillText}>{item.level || 'Principiante'}</Text>
              </View>

              {item.description ? (
                <Text style={s.description} numberOfLines={2}>{item.description}</Text>
              ) : null}

              <View style={s.rewardBox}>
                <Ionicons name="flag" size={16} color={ACCENT} />
                <Text style={s.rewardText}>
                  {item.subtitle ? `Objetivo: ${item.subtitle}` : 'Únete y cumple el reto'}
                </Text>
              </View>

              <TouchableOpacity style={s.participateBtn} activeOpacity={0.8} onPress={() => openDetail(item.id)}>
                <Ionicons name="arrow-forward-circle" size={18} color={BG} />
                <Text style={s.participateBtnText}>Ver reto</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
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
  list: { paddingHorizontal: 20, gap: 16 },
  centerBox: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyText: { fontSize: 14, fontWeight: '700', color: T2 },
  emptySubtext: { fontSize: 12, color: T3 },
  retryBtn: { marginTop: 8, backgroundColor: ACCENT, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  retryText: { fontSize: 13, fontWeight: '800', color: BG },
  card: { backgroundColor: SURFACE, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BORDER },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: ACCENT + '20', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: T1, marginBottom: 4 },
  cardMeta: { fontSize: 12, color: T3 },
  levelPill: { alignSelf: 'flex-start', backgroundColor: SURFACE2, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: BORDER, marginBottom: 12 },
  levelPillText: { fontSize: 11, fontWeight: '700', color: ACCENT },
  description: { fontSize: 13, color: T2, lineHeight: 18, marginBottom: 12 },
  rewardBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: ACCENT + '15', padding: 10, borderRadius: 10, marginBottom: 12 },
  rewardText: { fontSize: 12, fontWeight: '700', color: ACCENT, flex: 1 },
  participateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: ACCENT, borderRadius: 12, paddingVertical: 12 },
  participateBtnText: { fontSize: 14, fontWeight: '800', color: BG },
});