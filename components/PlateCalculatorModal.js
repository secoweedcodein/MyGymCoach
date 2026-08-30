import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Pressable } from 'react-native';

const STANDARD_PLATES = [
  { weight: 25, color: '#FF4444', height: 100 },
  { weight: 20, color: '#4444FF', height: 90 },
  { weight: 15, color: '#FFFF44', height: 80 },
  { weight: 10, color: '#44FF44', height: 70 },
  { weight: 5, color: '#FFFFFF', height: 60 },
  { weight: 2.5, color: '#555555', height: 50 },
  { weight: 1.25, color: '#AAAAAA', height: 40 },
];

export const PlateCalculatorModal = ({ visible, onClose, targetWeight }) => {
  const [barWeight, setBarWeight] = useState(20);

  const calculation = useMemo(() => {
    const weight = parseFloat(targetWeight);
    if (isNaN(weight) || weight < barWeight) {
      return { error: 'El peso objetivo debe ser mayor o igual al peso de la barra.' };
    }

    let weightPerSide = (weight - barWeight) / 2;
    let currentRemaining = weightPerSide;
    const platesNeeded = [];
    const breakdown = {};

    for (const plate of STANDARD_PLATES) {
      while (currentRemaining >= plate.weight - 0.001) {
        platesNeeded.push(plate);
        breakdown[plate.weight] = (breakdown[plate.weight] || 0) + 1;
        currentRemaining -= plate.weight;
      }
    }

    const breakdownText = Object.entries(breakdown)
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([w, count]) => `${count}×${w}kg`)
      .join(' + ');

    return {
      weightPerSide,
      plates: platesNeeded,
      breakdownText: breakdownText ? `Cada lado: ${breakdownText}` : 'Sin discos',
      remainder: currentRemaining
    };
  }, [targetWeight, barWeight]);

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Calculadora de Discos</Text>
          <Text style={styles.subtitle}>Peso objetivo: {targetWeight} kg</Text>
          
          <View style={styles.barSelector}>
            <TouchableOpacity 
              style={[styles.barButton, barWeight === 20 && styles.barButtonActive]}
              onPress={() => setBarWeight(20)}
            >
              <Text style={[styles.barText, barWeight === 20 && styles.barTextActive]}>Olímpica 20kg</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.barButton, barWeight === 15 && styles.barButtonActive]}
              onPress={() => setBarWeight(15)}
            >
              <Text style={[styles.barText, barWeight === 15 && styles.barTextActive]}>Mujer 15kg</Text>
            </TouchableOpacity>
          </View>

          {calculation.error ? (
            <Text style={styles.errorText}>{calculation.error}</Text>
          ) : (
            <>
              {calculation.remainder > 0.01 && (
                <Text style={styles.warningText}>
                  Aviso: No se puede dividir exactamente con discos estándar. Faltan {calculation.remainder.toFixed(2)}kg por lado.
                </Text>
              )}
              
              <Text style={styles.breakdownText}>{calculation.breakdownText}</Text>
              
              <View style={styles.visualizerContainer}>
                <View style={styles.barCenter} />
                <View style={styles.barSleeve}>
                  {calculation.plates.map((plate, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.plate, 
                        { backgroundColor: plate.color, height: plate.height, width: plate.weight >= 10 ? 20 : 15 }
                      ]} 
                    />
                  ))}
                </View>
              </View>
            </>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#AAAAAA',
    fontSize: 16,
    marginBottom: 20,
  },
  barSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#0D0D0D',
    borderRadius: 8,
    padding: 4,
  },
  barButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  barButtonActive: {
    backgroundColor: '#333333',
  },
  barText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '600',
  },
  barTextActive: {
    color: '#C0FF3E',
  },
  errorText: {
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  warningText: {
    color: '#FF6B6B',
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 10,
  },
  breakdownText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  visualizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 120,
    marginBottom: 30,
    width: '100%',
    justifyContent: 'center',
  },
  barCenter: {
    width: 60,
    height: 16,
    backgroundColor: '#555555',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
  },
  barSleeve: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
    height: 12,
    backgroundColor: '#777777',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  plate: {
    borderRadius: 4,
    marginRight: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
  },
  closeButton: {
    backgroundColor: '#C0FF3E',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
  },
  closeButtonText: {
    color: '#0D0D0D',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
