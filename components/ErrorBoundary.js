import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error capturado y contenido:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Ups, algo salió mal 😕</Text>
          <Text style={styles.subtitle}>No te preocupes, tus datos de entrenamiento están a salvo.</Text>
          <TouchableOpacity style={styles.button} onPress={() => this.setState({ hasError: false })}>
            <Text style={styles.buttonText}>Reiniciar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#0D0D0D' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#FFFFFF' },
  subtitle: { fontSize: 16, color: '#AAAAAA', textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: '#C0FF3E', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#0D0D0D', fontWeight: 'bold', fontSize: 16 }
});