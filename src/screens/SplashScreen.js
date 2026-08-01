import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LottieView from 'lottie-react-native';

export default function CustomSplashScreen({ onFinish }) {
  console.log("--- SPLASH SCREEN INICIADO ---"); // Esto saldrá en tu terminal
  
  return (
    <View style={styles.container}>
      <Text style={{color: 'white', marginBottom: 20}}>Cargando App...</Text>
      <LottieView
        source={require('../../assets/dumbellAnimation.json')} // Tu archivo .json
        autoPlay
        loop={false}
        onAnimationFinish={onFinish}
        style={styles.animation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }, // Color azul para identificarlo al instante
  animation: { width: 300, height: 300 }
});