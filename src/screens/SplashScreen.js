import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LottieView from 'lottie-react-native';

export default function CustomSplashScreen({ onFinish }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Cargando App...</Text>
      <LottieView
        source={require('../../assets/dumbellAnimation.json')}
        autoPlay
        loop={false}
        onAnimationFinish={onFinish}
        style={styles.animation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center' },
  text: { color: 'white', marginBottom: 20, fontSize: 14, fontWeight: '600' },
  animation: { width: 300, height: 300 }
});