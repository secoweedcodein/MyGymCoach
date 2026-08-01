import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView
} from 'react-native';

import { useLocalSearchParams } from 'expo-router';

export default function FoodDetailsScreen() {

  const params = useLocalSearchParams();

  const product = JSON.parse(params.product);

  const nutriments = product.nutriments || {};

  return (
    <ScrollView style={styles.container}>

      <Text style={styles.title}>
        {product.product_name}
      </Text>

      <Text style={styles.brand}>
        {product.brands}
      </Text>

      <View style={styles.card}>
        <Text>🔥 Calorías</Text>
        <Text>
          {Math.round(
            nutriments['energy-kcal_100g'] ||
            nutriments['energy_100g'] / 4.184 ||
            0
          )}
        </Text>
      </View>

      <View style={styles.card}>
        <Text>🥩 Proteína</Text>
        <Text>
          {nutriments['proteins_100g'] || 0} g
        </Text>
      </View>

      <View style={styles.card}>
        <Text>🍞 Carbohidratos</Text>
        <Text>
          {nutriments['carbohydrates_100g'] || 0} g
        </Text>
      </View>

      <View style={styles.card}>
        <Text>🥑 Grasas</Text>
        <Text>
          {nutriments['fat_100g'] || 0} g
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
  },

  brand: {
    marginBottom: 20,
    opacity: 0.7,
  },

  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#f2f2f2',
  },
});