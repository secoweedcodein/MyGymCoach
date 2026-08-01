// src/screens/admin/AdminTrendsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';
const PURPLE = '#8B7CFF';
const CYAN = '#3EE5FF';
const RED = '#FF453A';

const BADGE_COLORS = {
  popular: ACCENT,
  nuevo: CYAN,
  ia: PURPLE,
  verificado: '#3E8EFF',
};

export default function AdminTrendsScreen() {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrends();
  }, []);

  async function loadTrends() {
    setLoading(true);
    const { data, error } = await supabase
      .from('trends')
      .select('*')
      .order('position', { ascending: true });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setTrends(data || []);
    }
    setLoading(false);
  }

  async function toggleActive(trend) {
    const newStatus = !trend.is_active;
    const { error } = await supabase
      .from('trends')
      .update({ is_active: newStatus })
      .eq('id', trend.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setTrends(prev => prev.map(t => t.id === trend.id ? { ...t, is_active: newStatus } : t));
    }
  }

  function handleDelete(trend) {
    Alert.alert(
      'Eliminar tendencia',
      `¿Seguro que quieres eliminar "${trend.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('trends')
              .delete()
              .eq('id', trend.id);

            if (error) {
              Alert.alert('Error', error.message);
            } else {
              setTrends(prev => prev.filter(t => t.id !== trend.id));
              Alert.alert('Eliminada', 'Tendencia eliminada correctamente');
            }
          }
        }
      ]
    );
  }

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color={T1} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>🔥 Tendencias</Text>
          <Text style={s.headerSubtitle}>{trends.length} tendencias activas</Text>
        </View>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => router.push('/admin/trend-form')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color={BG} />
        </TouchableOpacity>
      </View>

      {/* LISTA */}
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {trends.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="flame-outline" size={48} color={T3} />
            <Text style={s.emptyTitle}>Sin tendencias</Text>
            <Text style={s.emptyText}>Crea la primera con el botón +</Text>
          </View>
        ) : (
          trends.map((trend, idx) => (
            <View key={trend.id} style={[s.trendCard, !trend.is_active && s.trendCardInactive]}>
              <View style={s.trendHeader}>
                <View style={s.positionBadge}>
                  <Text style={s.positionText}>#{idx + 1}</Text>
                </View>
                {trend.badge && (
                  <View style={[s.badge, { backgroundColor: (BADGE_COLORS[trend.badge] || ACCENT) + '22' }]}>
                    <Text style={[s.badgeText, { color: BADGE_COLORS[trend.badge] || ACCENT }]}>
                      {trend.badge}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => toggleActive(trend)}
                  style={s.toggleBtn}
                >
                  <Ionicons
                    name={trend.is_active ? "eye" : "eye-off"}
                    size={18}
                    color={trend.is_active ? ACCENT : T3}
                  />
                </TouchableOpacity>
              </View>

              <Text style={s.trendTitle}>{trend.title}</Text>
              
              <View style={s.metaRow}>
                <View style={s.metaItem}>
                  <Ionicons name="star" size={12} color={ACCENT} />
                  <Text style={s.metaText}>{trend.rating}</Text>
                </View>
                <View style={s.metaItem}>
                  <Ionicons name="people" size={12} color={T3} />
                  <Text style={s.metaText}>{trend.users}</Text>
                </View>
                <View style={s.metaItem}>
                  <Ionicons name="barbell" size={12} color={T3} />
                  <Text style={s.metaText}>{trend.level}</Text>
                </View>
              </View>

              <View style={s.routeRow}>
                <Ionicons name="link-outline" size={12} color={T3} />
                <Text style={s.routeText} numberOfLines={1}>{trend.route}</Text>
              </View>

              <View style={s.actionsRow}>
                <TouchableOpacity
                  style={s.editBtn}
                  onPress={() => router.push({
                    pathname: '/admin/trend-form',
                    params: { id: trend.id }
                  })}
                  activeOpacity={0.8}
                >
                  <Ionicons name="create-outline" size={16} color={ACCENT} />
                  <Text style={s.editBtnText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.deleteBtn}
                  onPress={() => handleDelete(trend)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={16} color={RED} />
                  <Text style={s.deleteBtnText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loading: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, gap: 12 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: T1 },
  headerSubtitle: { fontSize: 12, color: T2, marginTop: 2 },
  addBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },

  scrollContent: { padding: 20, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: T1, marginTop: 8 },
  emptyText: { fontSize: 12, color: T2 },

  trendCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: BORDER },
  trendCardInactive: { opacity: 0.5 },
  trendHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  positionBadge: { backgroundColor: ACCENT + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  positionText: { fontSize: 11, fontWeight: '800', color: ACCENT },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  toggleBtn: { marginLeft: 'auto', padding: 4 },

  trendTitle: { fontSize: 16, fontWeight: '700', color: T1, marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 14, marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: T2, fontWeight: '600' },

  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12, backgroundColor: BG, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  routeText: { fontSize: 11, color: T3, fontWeight: '500', flex: 1 },

  actionsRow: { flexDirection: 'row', gap: 10 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ACCENT + '15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: ACCENT + '40' },
  editBtnText: { fontSize: 12, fontWeight: '700', color: ACCENT },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: RED + '15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: RED + '40' },
  deleteBtnText: { fontSize: 12, fontWeight: '700', color: RED },
});