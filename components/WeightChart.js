// components/WeightChart.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { supabase } from '../lib/supabase';

export const WeightChart = ({ userId }) => {
  const [weightData, setWeightData] = useState({ labels: [], weights: [] });

  useEffect(() => {
    const loadWeightHistory = async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('weight_logs')
        .select('weight_kg, logged_date')
        .eq('user_id', userId)
        .gte('logged_date', thirtyDaysAgo.toISOString())
        .order('logged_date', { ascending: true });

      if (!error && data) {
        const labels = data.map(d => {
          const date = new Date(d.logged_date);
          return `${date.getDate()}/${date.getMonth() + 1}`;
        });
        const weights = data.map(d => parseFloat(d.weight_kg));
        setWeightData({ labels, weights });
      }
    };

    loadWeightHistory();
  }, [userId]);

  if (weightData.weights.length < 2) {
    return (
      <View style={s.emptyChart}>
        <Text style={s.emptyText}>Registra al menos 2 pesos para ver tu evolución</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Evolución de Peso (últimos 30 días)</Text>
      <LineChart
        data={{
          labels: weightData.labels,
          datasets: [{ data: weightData.weights }]
        }}
        width={Dimensions.get('window').width - 40}
        height={220}
        chartConfig={{
          backgroundColor: '#161616',
          backgroundGradientFrom: '#161616',
          backgroundGradientTo: '#161616',
          decimalCount: 1,
          color: (opacity = 1) => `rgba(192, 255, 62, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#C0FF3E'
          }
        }}
        bezier
        style={s.chart}
      />
    </View>
  );
};

const s = StyleSheet.create({
  container: { marginTop: 20, marginBottom: 20 },
  title: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12, marginLeft: 20 },
  chart: { borderRadius: 16, marginHorizontal: 20 },
  emptyChart: { padding: 20, alignItems: 'center', backgroundColor: '#161616', marginHorizontal: 20, borderRadius: 16 },
  emptyText: { color: '#A0A0A0', textAlign: 'center' }
});