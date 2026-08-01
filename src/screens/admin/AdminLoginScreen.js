// src/screens/admin/AdminLoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';

export default function AdminLoginScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  // ⚠️ CAMBIA ESTE CÓDIGO por el que tú quieras
  const ADMIN_CODE = 'MYGYM2026';

  function handleLogin() {
    if (code !== ADMIN_CODE) {
      Alert.alert('Acceso denegado', 'Código incorrecto');
      return;
    }
    router.replace('/admin/dashboard');
  }

  return (
    <View style={s.container}>
      <View style={s.content}>
        <View style={s.iconWrap}>
          <Ionicons name="shield-checkmark" size={60} color={ACCENT} />
        </View>
        <Text style={s.title}>Panel de Administración</Text>
        <Text style={s.subtitle}>Ingresa el código de acceso</Text>

        <TextInput
          style={s.input}
          value={code}
          onChangeText={setCode}
          placeholder="Código de acceso"
          placeholderTextColor={T3}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[s.loginBtn, loading && s.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={s.loginBtnText}>Acceder</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={s.backBtnText}>← Volver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG, justifyContent: 'center', padding: 20 },
  content: { alignItems: 'center', gap: 16 },
  iconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: SURFACE, borderWidth: 2, borderColor: ACCENT + '40', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: T1, textAlign: 'center' },
  subtitle: { fontSize: 14, color: T2, textAlign: 'center', marginBottom: 20 },
  input: { width: '100%', backgroundColor: SURFACE, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: T1, fontSize: 16, borderWidth: 1, borderColor: BORDER, textAlign: 'center', letterSpacing: 2 },
  loginBtn: { width: '100%', backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { fontSize: 16, fontWeight: '800', color: BG },
  backBtn: { paddingVertical: 12 },
  backBtnText: { fontSize: 14, color: T3, fontWeight: '600' },
});