// components/DataState.js
// Estados reutilizables para carga de datos: loading, error con reintento y vacío.
import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { colors as c } from '../lib/theme';

export function LoadingState({ message = 'Cargando...' }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={c.accent} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

export function ErrorState({ message = 'No se pudieron cargar los datos.', onRetry, retryText = 'Reintentar' }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>😕</Text>
      <Text style={styles.title}>Algo salió mal</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function EmptyState({ message = 'Sin datos por el momento.' }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🗂️</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 10,
  },
  icon: { fontSize: 36 },
  title: { fontSize: 16, fontWeight: '800', color: c.t1, textAlign: 'center' },
  message: { fontSize: 13, color: c.t2, textAlign: 'center', lineHeight: 19 },
  button: {
    marginTop: 12,
    backgroundColor: c.accent,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  buttonText: { fontSize: 13, fontWeight: '800', color: c.bg },
});