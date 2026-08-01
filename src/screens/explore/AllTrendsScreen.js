// src/screens/explore/AllTrendsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import BottomTabBar from '../../../components/BottomTabBar';

const BG = '#0D0D0D';
const SURFACE = '#161616';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';
const ACCENT = '#C0FF3E';
const PURPLE = '#8B7CFF';

const TREND_IMAGES = {
  abs: require('../../../assets/wmremove-transformed.png'),
  hipertrofia: require('../../../assets/hiperftrofia.png'),
  funcional: require('../../../assets/funcional.png'),
  upper: require('../../../assets/upper.png'),
  ppl: require('../../../assets/PPL.png'),
  fullbody: require('../../../assets/fullbody.png'),
  '5x5': require('../../../assets/5x5.png'),
  '30dias': require('../../../assets/30diashipertrofia.png')
};

export default function AllTrendsScreen() {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrends();
  }, []);

  async function loadTrends() {
    setLoading(true);
    const { data } = await supabase
      .from('trends')
      .select('*')
      .eq('is_active', true)
      .eq('show_in_see_all', true) // ✅ Solo las marcadas
      .order('position', { ascending: true });
    
    if (data) setTrends(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={T1} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>🔥 Tendencias</Text>
          <Text style={s.headerSubtitle}>Lo más popular este mes</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {trends.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="flame-outline" size={48} color={T3} />
            <Text style={s.emptyTitle}>Sin tendencias</Text>
          </View>
        ) : (
          trends.map((item) => {
            const imageSource = TREND_IMAGES[item.image_id] || TREND_IMAGES.abs;
            return (
              <TouchableOpacity
                key={item.id}
                style={s.card}
                onPress={() => router.push(item.route)}
                activeOpacity={0.8}
              >
                <Image source={imageSource} style={s.cardImage} />
                <View style={s.cardContent}>
                  <View style={s.cardHeader}>
                    {item.badge && (
                      <View style={[s.badge, { backgroundColor: (item.badge === 'popular' ? ACCENT : PURPLE) + '22' }]}>
                        <Text style={[s.badgeText, { color: item.badge === 'popular' ? ACCENT : PURPLE }]}>
                          {item.badge === 'popular' ? '🔥 Popular' : '✨ Destacado'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={s.cardTitle}>{item.title}</Text>
                  <Text style={s.cardLevel}>{item.level}</Text>
                  <View style={s.cardMeta}>
                    <View style={s.metaItem}>
                      <Ionicons name="star" size={12} color={ACCENT} />
                      <Text style={s.metaText}>{item.rating}</Text>
                    </View>
                    <View style={s.metaItem}>
                      <Ionicons name="people" size={12} color={T3} />
                      <Text style={s.metaText}>{item.users}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, gap: 12 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: T1 },
  headerSubtitle: { fontSize: 12, color: T2, marginTop: 2 },
  scrollContent: { padding: 20, paddingBottom: 100, gap: 16 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: T1 },
  card: { flexDirection: 'row', backgroundColor: SURFACE, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: BORDER },
  cardImage: { width: 120, height: 140 },
  cardContent: { flex: 1, padding: 14 },
  cardHeader: { marginBottom: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: T1, marginBottom: 4 },
  cardLevel: { fontSize: 12, color: T2, marginBottom: 10 },
  cardMeta: { flexDirection: 'row', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: T2, fontWeight: '600' },
});