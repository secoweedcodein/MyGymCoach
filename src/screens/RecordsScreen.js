import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase.js'; // Asegúrate de la ruta
import { colors, radius, spacing } from '../../lib/theme.js';

export default function RecordsScreen() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, []);

  async function fetchRecords() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Traemos los récords ordenados por peso (el más alto primero)
      const { data, error } = await supabase
        .from('personal_records')
        .select('*')
        .eq('user_id', user.id)
        .order('weight_kg', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error al cargar récords:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Mis Mejores Marcas</Text>
      
      {records.length === 0 ? (
        <Text style={styles.emptyText}>¡Aún no tienes récords! Entrena duro y aparecerán aquí.</Text>
      ) : (
        records.map((record, index) => (
          <View key={index} style={styles.card}>
            <View>
              <Text style={styles.exName}>{record.exercise_name}</Text>
              <Text style={styles.date}>
                {new Date(record.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.weightContainer}>
              <Text style={styles.weight}>{record.weight_kg}</Text>
              <Text style={styles.unit}>KG</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  title: { color: colors.t1, fontSize: 24, fontWeight: '800', marginBottom: 20 },
  emptyText: { color: colors.t3, textAlign: 'center', marginTop: 50, fontSize: 16 },
  card: {
    backgroundColor: colors.bg3,
    padding: 18,
    borderRadius: radius.lg,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  exName: { color: colors.t1, fontSize: 16, fontWeight: '700' },
  date: { color: colors.t3, fontSize: 12, marginTop: 4 },
  weightContainer: { alignItems: 'flex-end' },
  weight: { color: colors.accent, fontSize: 24, fontWeight: '900' },
  unit: { color: colors.t2, fontSize: 10, fontWeight: '600' }
});