import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

export const GymKeypad = ({ value, onChange, onDone, onCalculatePlates }) => {
  const [internalValue, setInternalValue] = useState(value ? String(value) : '');

  useEffect(() => {
    if (value !== undefined && String(value) !== internalValue) {
      setInternalValue(String(value));
    }
  }, [value]);

  const handlePress = (char) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (char === 'del') {
      const newValue = internalValue.slice(0, -1);
      setInternalValue(newValue);
      onChange && onChange(newValue);
    } else if (char === '.') {
      if (!internalValue.includes('.')) {
        const newValue = internalValue ? internalValue + '.' : '0.';
        setInternalValue(newValue);
        onChange && onChange(newValue);
      }
    } else {
      const newValue = internalValue + char;
      setInternalValue(newValue);
      onChange && onChange(newValue);
    }
  };

  const handleQuickAdjust = (amount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const currentNum = parseFloat(internalValue) || 0;
    const newNum = Math.max(0, currentNum + amount); // Prevent negative
    const newValue = String(newNum);
    setInternalValue(newValue);
    onChange && onChange(newValue);
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (onDone) {
      const numericVal = parseFloat(internalValue);
      onDone(isNaN(numericVal) ? 0 : numericVal);
    }
  };

  const renderKey = (char, label = char) => (
    <TouchableOpacity style={styles.keyButton} onPress={() => handlePress(char)}>
      <Text style={styles.keyText}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.quickAdjustRow}>
        <TouchableOpacity style={styles.quickButton} onPress={() => handleQuickAdjust(-2.5)}>
          <Text style={styles.quickText}>-2.5</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={() => handleQuickAdjust(1.25)}>
          <Text style={styles.quickText}>+1.25</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={() => handleQuickAdjust(2.5)}>
          <Text style={styles.quickText}>+2.5</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={() => handleQuickAdjust(5)}>
          <Text style={styles.quickText}>+5</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.platesButton} onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onCalculatePlates && onCalculatePlates();
      }}>
        <Text style={styles.platesButtonText}>🧮 Ver Discos de Barra</Text>
      </TouchableOpacity>

      <View style={styles.keypadGrid}>
        <View style={styles.row}>
          {renderKey('1')}
          {renderKey('2')}
          {renderKey('3')}
        </View>
        <View style={styles.row}>
          {renderKey('4')}
          {renderKey('5')}
          {renderKey('6')}
        </View>
        <View style={styles.row}>
          {renderKey('7')}
          {renderKey('8')}
          {renderKey('9')}
        </View>
        <View style={styles.row}>
          {renderKey('.')}
          {renderKey('0')}
          {renderKey('del', '⌫')}
        </View>
      </View>

      <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
        <Text style={styles.doneButtonText}>Listo</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
  },
  quickAdjustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickButton: {
    backgroundColor: '#333333',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  platesButton: {
    backgroundColor: '#2A2A2A',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  platesButtonText: {
    color: '#C0FF3E',
    fontSize: 16,
    fontWeight: 'bold',
  },
  keypadGrid: {
    gap: 8,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  keyButton: {
    flex: 1,
    backgroundColor: '#2A2A2A',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '500',
  },
  doneButton: {
    backgroundColor: '#C0FF3E',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#0D0D0D',
    fontSize: 18,
    fontWeight: 'bold',
  },
});