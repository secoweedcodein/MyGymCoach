// src/screens/admin/AdminFeaturedScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Image,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {
  getFeaturedContent,
  upsertFeaturedContent,
  deleteFeaturedContent,
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

const CHALLENGE_IMAGES = {
  abs: require('../../../assets/wmremove-transformed.png'),
  hipertrofia: require('../../../assets/hiperftrofia.png'),
  funcional: require('../../../assets/funcional.png'),
  upper: require('../../../assets/upper.png'),
  ppl: require('../../../assets/PPL.png'),
  fullbody: require('../../../assets/fullbody.png'),
  '5x5': require('../../../assets/5x5.png'),
  '30dias': require('../../../assets/30diashipertrofia.png'),
};

function resolveImage(imageId) {
  if (typeof imageId !== 'string' || !imageId) return null;
  if (imageId.startsWith('http')) return { uri: imageId };
  return CHALLENGE_IMAGES[imageId] || null;
}

const FEATURE_TYPES = [
  { id: 'reto_mes', label: 'Reto Mes', route: '/explore/challenge-detail' },
  { id: 'ejercicio_dia', label: 'Ej. Día', route: '/explore/challenge-detail' },
];

export default function AdminFeaturedScreen() {
  const { newId } = useLocalSearchParams();
  const [featured, setFeatured] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    if (newId) loadData();
  }, [newId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [featData, challData] = await Promise.all([
        getFeaturedContent(),
        listChallenges({ officialOnly: true }),
      ]);
      setFeatured(featData || []);
      setChallenges(challData || []);
    } catch (error) {
      Alert.alert('❌ Error', error.message || 'No se pudo cargar');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectForFeatured = async (challenge, type) => {
    const featureType = FEATURE_TYPES.find(f => f.id === type);
    if (!featureType) return;

    const payload = {
      id: type,
      target_id: challenge.id,
      target_type: 'challenge',
      title: challenge.name,
      subtitle: challenge.subtitle || `${challenge.duration_days} días · ${challenge.frequency}`,
      image_id: challenge.image_id || '',
      route: featureType.route,
      participants: challenge.participants || '',
      updated_at: new Date().toISOString(),
    };

    try {
      await upsertFeaturedContent(payload);
      Alert.alert(
        '✅ Éxito',
        `${challenge.name} ahora es el ${type === 'reto_mes' ? 'Reto del Mes' : 'Ejercicio del Día'}`
      );
      loadData();
    } catch (error) {
      Alert.alert('❌ Error', error.message || 'No se pudo asignar el destacado');
    }
  };

  const handleDeleteChallenge = (challenge) => {
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
              Alert.alert('✅ Éxito', `"${challenge.name}" eliminado`);
              loadData();
            } catch (error) {
              Alert.alert('❌ Error', error.message || 'No se pudo eliminar el reto');
            }
          },
        },
      ]
    );
  };

  const handleDelete = (item) => {
    Alert.alert('Quitar destacado', `¿Eliminar "${item.title}" de los destacados?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          try {
            await deleteFeaturedContent(item.id);
            Alert.alert('✅ Éxito', 'Destacado quitado');
            loadData();
          } catch (error) {
            Alert.alert('❌ Error', error.message || 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.title}>Contenido Destacado</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Acciones principales */}
        <View style={s.mainActions}>
          <TouchableOpacity
            style={s.mainActionBtn}
            onPress={() => router.push('/admin/create-challenge?type=reto_mes')}
          >
            <Text style={s.mainActionIcon}>🏆</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.mainActionTitle}>Crear Reto del Mes</Text>
              <Text style={s.mainActionSub}>Nuevo reto completo</Text>
            </View>
            <Text style={s.mainActionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.mainActionBtn, { backgroundColor: SURFACE2, borderWidth: 1, borderColor: ACCENT }]}
            onPress={() => router.push('/admin/create-challenge?type=ejercicio_dia')}
          >
            <Text style={s.mainActionIcon}>💪</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.mainActionTitle, { color: ACCENT }]}>Crear Ejercicio del Día</Text>
              <Text style={s.mainActionSub}>Nuevo ejercicio destacado</Text>
            </View>
            <Text style={[s.mainActionArrow, { color: ACCENT }]}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Retos existentes para seleccionar */}
        <Text style={s.sectionLabel}>RETOS DISPONIBLES</Text>
        {challenges.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyText}>No hay retos oficiales</Text>
            <Text style={s.emptySubtext}>Crea uno con el botón de arriba</Text>
          </View>
        ) : (
          challenges.map(ch => {
            const isFeaturedAsHero = featured.find(f => f.id === 'reto_mes' && f.target_id === ch.id);
            const isFeaturedAsEx = featured.find(f => f.id === 'ejercicio_dia' && f.target_id === ch.id);

            return (
              <View key={ch.id} style={s.challengeCard}>
                {ch.image_id ? (
                  <Image source={resolveImage(ch.image_id)} style={s.challengeImage} />
                ) : null}
                <View style={s.challengeBody}>
                  <View style={s.challengeBadges}>
                    {isFeaturedAsHero && (
                      <View style={s.linkedBadge}><Text style={s.linkedText}>✓ Reto Mes</Text></View>
                    )}
                    {isFeaturedAsEx && (
                      <View style={s.linkedBadge}><Text style={s.linkedText}>✓ Ej. Día</Text></View>
                    )}
                  </View>
                  <Text style={s.challengeName}>{ch.name}</Text>
                  <Text style={s.challengeMeta}>
                    {ch.duration_days} días · {ch.frequency} · {ch.level}
                  </Text>
                  {ch.subtitle ? <Text style={s.challengeSubtitle} numberOfLines={2}>{ch.subtitle}</Text> : null}
                </View>

                <View style={s.challengeActions}>
                  {FEATURE_TYPES.map(ft => {
                    const isAssigned = (ft.id === 'reto_mes' ? isFeaturedAsHero : isFeaturedAsEx);
                    return (
                      <TouchableOpacity
                        key={ft.id}
                        style={[s.assignBtn, isAssigned && s.assignBtnActive]}
                        onPress={() => handleSelectForFeatured(ch, ft.id)}
                      >
                        <Text style={[s.assignBtnText, isAssigned && s.assignBtnTextActive]}>
                          {isAssigned ? `✓ ${ft.label}` : `Hacer ${ft.label}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={s.iconBtn}
                    onPress={() => router.push(`/admin/create-challenge?id=${ch.id}`)}
                  >
                    <Text style={s.editIcon}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.iconBtn}
                    onPress={() => handleDeleteChallenge(ch)}
                  >
                    <Text style={s.deleteIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* Destacados actuales */}
        <Text style={s.sectionLabel}>DESTACADOS ACTIVOS</Text>
        {featured.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyText}>Sin destacados activos</Text>
          </View>
        ) : (
          featured.slice(0, 2).map(item => (
            <View key={item.id} style={s.featuredCard}>
              <View style={s.featuredHeader}>
                <Text style={s.featuredType}>
                  {item.id === 'reto_mes' ? '🏆 RETO DEL MES' : '💪 EJERCICIO DEL DÍA'}
                </Text>
                {item.target_id ? (
                  <View style={s.linkedBadge}><Text style={s.linkedText}>✓ Vinculado</Text></View>
                ) : (
                  <View style={s.unlinkedBadge}><Text style={s.unlinkedText}>✗ Sin vincular</Text></View>
                )}
              </View>
              {item.image_id ? <Image source={resolveImage(item.image_id)} style={s.featuredImage} /> : null}
              <View style={s.featuredBody}>
                <Text style={s.featuredTitle}>{item.title}</Text>
                {item.subtitle ? <Text style={s.featuredSubtitle}>{item.subtitle}</Text> : null}
              </View>
              <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(item)}>
                <Text style={s.deleteBtnText}>🗑️ Quitar destacado</Text>
              </TouchableOpacity>
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
  loading: { flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingTop: 60, paddingBottom: 20, gap: 16,
  },
  backBtn: { paddingVertical: 8 },
  backBtnText: { color: ACCENT, fontSize: 16, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '800', color: T1 },
  scrollContent: { paddingHorizontal: 20 },

  mainActions: { gap: 10, marginBottom: 24 },
  mainActionBtn: {
    backgroundColor: ACCENT, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  mainActionIcon: { fontSize: 28 },
  mainActionTitle: { color: '#000', fontWeight: '800', fontSize: 15 },
  mainActionSub: { color: '#000', fontSize: 11, opacity: 0.7, marginTop: 2 },
  mainActionArrow: { color: '#000', fontSize: 20, fontWeight: '800' },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2, color: T3,
    textTransform: 'uppercase', marginBottom: 12, marginTop: 8,
  },
  emptyState: { paddingVertical: 30, alignItems: 'center' },
  emptyText: { fontSize: 14, fontWeight: '700', color: T1 },
  emptySubtext: { fontSize: 12, color: T3, marginTop: 4 },

  challengeCard: {
    backgroundColor: SURFACE, borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
  },
  challengeImage: { width: '100%', height: 140, resizeMode: 'cover' },
  challengeBody: { padding: 14 },
  challengeBadges: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  challengeName: { fontSize: 16, fontWeight: '800', color: T1, marginBottom: 4 },
  challengeMeta: { fontSize: 11, color: T3, fontWeight: '600', marginBottom: 6 },
  challengeSubtitle: { fontSize: 12, color: T2 },
  challengeActions: {
    flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: BORDER, gap: 8,
  },
  assignBtn: {
    flex: 1, backgroundColor: SURFACE2, paddingVertical: 10,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  assignBtnActive: { backgroundColor: ACCENT + '20', borderWidth: 1, borderColor: ACCENT },
  assignBtnText: { color: T2, fontWeight: '700', fontSize: 11 },
  assignBtnTextActive: { color: ACCENT },
  iconBtn: {
    backgroundColor: SURFACE2, width: 38, alignItems: 'center', justifyContent: 'center',
    borderRadius: 10,
  },
  editIcon: { fontSize: 15 },
  deleteIcon: { fontSize: 15 },

  featuredCard: {
    backgroundColor: SURFACE, borderRadius: 16, marginBottom: 12,
    borderWidth: 1, borderColor: BORDER, overflow: 'hidden',
  },
  featuredHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 12, borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  featuredType: { fontSize: 10, fontWeight: '800', color: ACCENT, letterSpacing: 0.5 },
  linkedBadge: { backgroundColor: '#3DD68C20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  linkedText: { fontSize: 10, fontWeight: '700', color: '#3DD68C' },
  unlinkedBadge: { backgroundColor: RED + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  unlinkedText: { fontSize: 10, fontWeight: '700', color: RED },
  featuredImage: { width: '100%', height: 140, resizeMode: 'cover' },
  featuredBody: { padding: 14 },
  featuredTitle: { fontSize: 16, fontWeight: '700', color: T1, marginBottom: 4 },
  featuredSubtitle: { fontSize: 12, color: T2 },
  deleteBtn: {
    padding: 12, borderTopWidth: 1, borderTopColor: BORDER, alignItems: 'center',
  },
  deleteBtnText: { color: RED, fontWeight: '700', fontSize: 13 },
});