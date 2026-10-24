import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SectionList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { colors, radius, spacing, type, shadow } from '../../lib/theme';

export default function HistoryScreen() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('finished_at', { ascending: false });

    if (error) {
      console.error('Error cargando sesiones:', error);
    } else {
      setSessions(data || []);
    }

    setLoading(false);
    setRefreshing(false);
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSessions();
  }, []);

  function confirmDelete(session) {
    Alert.alert(
      'Eliminar entrenamiento',
      `¿Seguro que quieres eliminar "${session.routine_name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const previous = sessions;
            setSessions((s) => s.filter((x) => x.id !== session.id));
            const { error } = await supabase
              .from('workout_sessions')
              .delete()
              .eq('id', session.id);
            if (error) {
              console.error('Error eliminando sesión:', error);
              setSessions(previous);
              Alert.alert('No se pudo eliminar', 'Inténtalo de nuevo.');
            }
          },
        },
      ]
    );
  }

  // Filtra por nombre de rutina
  const filtered = useMemo(() => {
    if (!query.trim()) return sessions;
    const q = query.trim().toLowerCase();
    return sessions.filter((s) =>
      (s.routine_name || '').toLowerCase().includes(q)
    );
  }, [sessions, query]);

  // Agrupa por mes ("Julio 2026") para dar estructura a listas largas
  const sections = useMemo(() => {
    const groups = {};
    filtered.forEach((item) => {
      if (!item.finished_at) return;
      const d = new Date(item.finished_at);
      const key = d.toLocaleDateString('es-ES', {
        month: 'long',
        year: 'numeric',
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.entries(groups).map(([title, data]) => ({
      title: title.charAt(0).toUpperCase() + title.slice(1),
      data,
    }));
  }, [filtered]);

  const totalWorkouts = sessions.length;

  if (loading) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.subtitle}>
          {totalWorkouts > 0
            ? `${totalWorkouts} entrenamiento${totalWorkouts === 1 ? '' : 's'} guardado${totalWorkouts === 1 ? '' : 's'}`
            : 'Todos tus entrenamientos guardados'}
        </Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.t3} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por rutina..."
          placeholderTextColor={colors.t3}
          style={styles.searchInput}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.t3} />
          </TouchableOpacity>
        )}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{
          padding: spacing.md,
          paddingBottom: spacing.xl,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={40} color={colors.t3} />
            <Text style={styles.emptyTitle}>
              {query ? 'Sin resultados' : 'Todavía no hay entrenamientos'}
            </Text>
            <Text style={styles.emptyText}>
              {query
                ? 'Prueba con otro nombre de rutina.'
                : 'Cuando termines tu primer entrenamiento, aparecerá aquí.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const date = item.finished_at ? new Date(item.finished_at) : null;
          const dateLabel = date
            ? date.toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
              })
            : '';
          const timeLabel = date
            ? date.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/historyDetail',
                  params: { sessionId: item.id },
                })
              }
              onLongPress={() => confirmDelete(item)}
            >
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routineName} numberOfLines={1}>
                    {item.routine_name}
                  </Text>
                  <Text style={styles.dateText}>
                    {dateLabel ? `${dateLabel} · ${timeLabel}` : ''}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.t3}
                />
              </View>

              <View style={styles.statsRow}>
                <Stat
                  icon="repeat"
                  value={item.total_sets ?? 0}
                  label="Series"
                />
                <View style={styles.statDivider} />
                <Stat
                  icon="trending-up"
                  value={item.total_volume_kg ?? 0}
                  label="Kg totales"
                  accent
                />
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

function Stat({ icon, value, label, accent }) {
  return (
    <View style={styles.statBlock}>
      <View style={styles.statLabelRow}>
        <Ionicons
          name={icon}
          size={13}
          color={accent ? colors.accent : colors.t3}
        />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={[styles.statValue, accent && { color: colors.accent }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centerAll: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: spacing.md,
  },
  title: {
    color: colors.t1,
    ...type.display,
  },
  subtitle: {
    color: colors.t3,
    marginTop: 4,
    marginBottom: spacing.md,
    ...type.body,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: spacing.md,
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  searchInput: {
    flex: 1,
    color: colors.t1,
    fontSize: 15,
  },
  sectionHeader: {
    color: colors.t3,
    ...type.label,
    textTransform: 'uppercase',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.bg2,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  routineName: {
    color: colors.t1,
    ...type.title,
  },
  dateText: {
    color: colors.t3,
    ...type.caption,
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg3,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  statBlock: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: spacing.sm,
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statLabel: {
    color: colors.t3,
    ...type.caption,
    fontWeight: '600',
  },
  statValue: {
    color: colors.t1,
    fontSize: 20,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    color: colors.t1,
    ...type.title,
  },
  emptyText: {
    color: colors.t3,
    textAlign: 'center',
    paddingHorizontal: 40,
    ...type.body,
  },
});