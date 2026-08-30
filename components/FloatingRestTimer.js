import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTimerStore } from '../Store/useTimerStore';
import { BlurView } from 'expo-blur';

export const FloatingRestTimer = () => {
  const { isActive, timeLeft, stopTimer, startTimer, defaultDuration } = useTimerStore();

  if (!isActive) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
        <Text style={styles.timeText}>{formatTime(timeLeft)}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.button} onPress={() => startTimer(defaultDuration)}>
            <Text style={styles.buttonText}>Reiniciar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={stopTimer}>
            <Text style={styles.buttonText}>Saltar</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 30, left: 20, right: 20, borderRadius: 16, overflow: 'hidden', elevation: 10 },
  blurContainer: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeText: { fontSize: 32, fontWeight: 'bold', color: '#fff', fontVariant: ['tabular-nums'] },
  buttonRow: { flexDirection: 'row', gap: 10 },
  button: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  stopButton: { backgroundColor: 'rgba(255,80,80,0.3)' },
  buttonText: { color: '#fff', fontWeight: '600' }
});