import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, radius, spacing } from '../../../lib/theme';
import { fetchHistoryDetail } from '../services/historyService';

export default function HistoryDetailScreen() {
  const { sessionId } = useLocalSearchParams();

  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = Array.isArray(sessionId) ? sessionId[0] : sessionId;
    if (typeof id !== 'string' || !id) {
      setLoading(false);
      Alert.alert('Error', 'No se indicó una sesión válida.');
      return;
    }
    fetchHistoryDetail(id)
      .then(setSets)
      .catch((error) => {
        console.error('Error cargando detalle del entrenamiento:', error);
        Alert.alert('Error', 'No se pudo cargar el detalle del entrenamiento.');
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const grouped = {};

  sets.forEach(set => {
    if (!grouped[set.exercise_name]) {
      grouped[set.exercise_name] = [];
    }

    grouped[set.exercise_name].push(set);
  });

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ padding: spacing.lg }}
    >
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          activeOpacity={0.7}
        >
          <Text style={s.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={s.title}>Historial del entrenamiento</Text>
      </View>

      {Object.keys(grouped).length === 0 && (
        <Text style={s.empty}>
          No se encontraron series para esta sesión.
        </Text>
      )}

      {Object.entries(grouped).map(([exerciseName, exerciseSets]) => (
        <View key={exerciseName} style={s.card}>
          <Text style={s.exerciseName}>
            {exerciseName}
          </Text>

          {exerciseSets.map(set => (
            <View key={set.id} style={s.row}>
              <Text style={s.text}>
                Serie {set.set_number}
              </Text>

              <Text style={s.text}>
                {set.weight_kg} kg × {set.reps}
              </Text>

              <Text style={s.type}>
                {set.set_type}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.t1,
  },

  header: {
    marginBottom: 20,
    paddingTop: 10,
  },

  backBtn: {
    paddingVertical: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },

  backText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },

  empty: {
    color: colors.t3,
    textAlign: 'center',
    marginTop: 20,
  },

  card: {
    backgroundColor: colors.bg3,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffffff10',
  },

  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.t1,
    marginBottom: 10,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },

  text: {
    color: colors.t2,
    fontSize: 14,
  },

  type: {
    color: colors.accent,
    fontWeight: '700',
  },
});