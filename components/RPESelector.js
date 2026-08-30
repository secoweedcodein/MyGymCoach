import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

export const RPESelector = ({ value, onChange, visible = true }) => {
  if (!visible) return null;

  const handleSelect = (rpe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(rpe);
  };

  const getRir = (rpe) => {
    return 10 - rpe;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Esfuerzo Percibido (RPE)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {RPE_VALUES.map((rpe) => {
          const isSelected = value === rpe;
          return (
            <TouchableOpacity
              key={rpe}
              style={[styles.pill, isSelected && styles.pillSelected]}
              onPress={() => handleSelect(rpe)}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
                {rpe}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {value ? (
        <Text style={styles.rirText}>
          RIR Equivalente: {getRir(value)} (Repeticiones en reserva)
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    color: '#AAAAAA',
    fontSize: 14,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  pillSelected: {
    backgroundColor: '#C0FF3E',
    borderColor: '#C0FF3E',
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pillTextSelected: {
    color: '#0D0D0D',
  },
  rirText: {
    color: '#888888',
    fontSize: 12,
    marginTop: 8,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
});
