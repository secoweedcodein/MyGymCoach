// src/screens/admin/AdminChallengesScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  listChallenges,
  deleteChallenge,
  deleteFeaturedByTarget,
} from '../../../services/adminService';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const SURFACE2 = '#1E1E1E';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';
const RED = '#FF453A';
const PINK = '#FF3EAA';

export default function AdminChallengesScreen() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await listChallenges({ officialOnly: false });
      setChallenges(data || []);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudieron cargar los retos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const handleDelete = (challenge) => {
    Alert.alert(
      'Eliminar reto',
      `¿Eliminar "${challenge.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            try {
              await deleteFeaturedByTarget(challenge.id);
              await deleteChallenge(challenge.id);
              Alert.alert('Reto eliminado', `"${challenge.name}" eliminado correctamente.`);
              loadData();
            } catch (error) {
              Alert.alert('Error', error.message || 'No se pudo eliminar el reto');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.title}>Retos</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <TouchableOpacity
          style={s.createBtn}
          onPress={() => router.push('/admin/create-challenge')}
        >
          <Text style={s.createBtnIcon}>🏆</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.createBtnTitle}>Crear nuevo reto</Text>
            <Text style={s.createBtnSub}>Reto oficial completo</Text>
          </View>
          <Text style={s.createBtnArrow}>→</Text>
        </TouchableOpacity>

        <Text style={s.sectionLabel}>RETOS EXISTENTES</Text>

        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={ACCENT} size="large" />
          </View>
        ) : challenges.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyText}>No hay retos creados</Text>
            <Text style={s.emptySubtext}>Crea el primero con el botón de arriba</Text>
          </View>
        ) : (
          challenges.map((ch) => (
            <View key={ch.id} style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.officialBadge}>
                  {ch.is_official ? 'OFICIAL' : 'COMUNIDAD'}
                </Text>
                <Text style={s.challengeName}>{ch.name}</Text>
                <Text style={s.challengeMeta}>
                  {ch.duration_days ? `${ch.duration_days} días · ` : ''}
                  {ch.frequency ? `${ch.frequency} · ` : ''}
                  {ch.level ? ch.level : 'Sin nivel'}
                </Text>
                {ch.subtitle ? (
                  <Text style={s.challengeSubtitle} numberOfLines={2}>{ch.subtitle}</Text>
                ) : null}
                {ch.objectives?.length ? (
                  <Text style={s.challengeObjective} numberOfLines={1}>
                    Objetivos: {ch.objectives.join(', ')}
                  </Text>
                ) : null}
              </View>
              <View style={s.cardActions}>
                <TouchableOpacity
                  style={s.iconBtn}
                  onPress={() => router.push(`/admin/create-challenge?id=${ch.id}`)}
                >
                  <Text style={s.editIcon}>✏️ Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.iconBtn, { borderColor: RED + '40' }]}
                  onPress={() => handleDelete(ch)}
                >
                  <Text style={[s.editIcon, { color: RED }]}>🗑️ Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 60, paddingBottom: 20, gap: 16,
  },
  backBtn: { paddingVertical: 8 },
  backBtnText: { color: ACCENT, fontSize: 16, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '800', color: T1 },
  scrollContent: { paddingHorizontal: 20 },

  createBtn: {
    backgroundColor: ACCENT, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24,
  },
  createBtnIcon: { fontSize: 28 },
  createBtnTitle: { color: '#000', fontWeight: '800', fontSize: 15 },
  createBtnSub: { color: '#000', fontSize: 11, opacity: 0.7, marginTop: 2 },
  createBtnArrow: { color: '#000', fontSize: 20, fontWeight: '800' },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2, color: T3,
    textTransform: 'uppercase', marginBottom: 12, marginTop: 8,
  },
  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  emptyState: { paddingVertical: 30, alignItems: 'center' },
  emptyText: { fontSize: 14, fontWeight: '700', color: T1 },
  emptySubtext: { fontSize: 12, color: T3, marginTop: 4 },

  card: {
    backgroundColor: SURFACE, borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
  },
  cardHeader: { padding: 14 },
  officialBadge: {
    alignSelf: 'flex-start', fontSize: 10, fontWeight: '800',
    color: PINK, marginBottom: 8,
  },
  challengeName: { fontSize: 16, fontWeight: '800', color: T1, marginBottom: 4 },
  challengeMeta: { fontSize: 11, color: T3, fontWeight: '600', marginBottom: 6 },
  challengeSubtitle: { fontSize: 12, color: T2 },
  challengeObjective: { fontSize: 11, color: T3, marginTop: 6 },
  cardActions: {
    flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: BORDER, gap: 8,
  },
  iconBtn: {
    flex: 1, backgroundColor: SURFACE2, paddingVertical: 10,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  editIcon: { color: T2, fontWeight: '700', fontSize: 12 },
});