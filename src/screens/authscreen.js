// src/screens/AuthScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase.js';
import { colors, radius, spacing } from '../../lib/theme.js';
import { useAlert } from "../context/AlertContext.js";

export default function AuthScreen() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin]   = useState(true);
  const [loading, setLoading]   = useState(false);
  const { showAlert } = useAlert();
  async function handleAuth() {
    if (isLogin) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log("LOGIN DATA:", data);
  console.log("LOGIN ERROR:", error);

  if (error) throw error;

  showAlert("Éxito", "Sesión iniciada");
}
    console.log("URL:", supabase.supabaseUrl);
    if (!email || !password) {
      showAlert('Error', 'Completa todos los campos');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

console.log("LOGIN:", data);
console.log("ERROR:", error);

if (error) throw error;

showAlert("Éxito", "Sesión iniciada");
        if (error) throw error;
      } else {
        console.log("Intentando conectar con:", "https://ajajfeefrrwyqoaexkxl.supabase.co");
        const result = await supabase.auth.signUp({
  email,
  password,
});

console.log("RESULTADO:", result);

if (result.error) throw result.error;
        showAlert('¡Listo!', 'Revisa tu email para confirmar la cuenta.');
      }
    } catch (err) {
      showAlert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.inner}>
        <Text style={s.logo}>MyGym<Text style={s.logoSub}>Coach</Text></Text>
        <Text style={s.tagline}>Tu diario de gimnasio. Sin anuncios.</Text>

        <View style={s.card}>
          <Text style={s.cardTitle}>{isLogin ? 'Iniciar sesión' : 'Crear cuenta'}</Text>

          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            placeholderTextColor={colors.t3}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={s.label}>Contraseña</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={colors.t3}
            secureTextEntry
          />

          <TouchableOpacity style={s.btnAcc} onPress={handleAuth} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={s.btnAccText}>{isLogin ? 'Entrar' : 'Registrarme'}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={s.switchBtn}>
            <Text style={s.switchText}>
              {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
              <Text style={{ color: colors.accent }}>
                {isLogin ? 'Regístrate' : 'Inicia sesión'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  logo: { fontSize: 36, fontWeight: '700', color: colors.accent, textAlign: 'center', marginBottom: 6 },
  logoSub: { color: colors.t3, fontWeight: '400' },
  tagline: { fontSize: 14, color: colors.t3, textAlign: 'center', marginBottom: 32 },
  card: { backgroundColor: colors.bg3, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: '#ffffff08' },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.t1, marginBottom: 18 },
  label: { fontSize: 12, color: colors.t3, fontWeight: '600', marginBottom: 5, letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.bg4, borderWidth: 1, borderColor: '#ffffff12',
    borderRadius: radius.md, color: colors.t1, fontSize: 15,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14,
  },
  btnAcc: {
    backgroundColor: colors.accent, borderRadius: radius.md,
    paddingVertical: 14, alignItems: 'center', marginTop: 4,
  },
  btnAccText: { fontSize: 16, fontWeight: '700', color: '#000' },
  switchBtn: { marginTop: 16, alignItems: 'center' },
  switchText: { fontSize: 14, color: colors.t2 },
});