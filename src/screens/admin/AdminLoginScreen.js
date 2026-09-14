// src/screens/admin/AdminLoginScreen.js
// Acceso al panel basado en rol (user_profiles.role = 'admin') de la cuenta autenticada.
// El rol admin solo se asigna desde el SQL editor / service role (trigger prevent_role_escalation).
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';
import { requireAdminSession } from '../../../lib/adminAuth';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';

export default function AdminLoginScreen() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Si la sesión ya pertenece a un admin, entramos directo al panel.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await requireAdminSession();
        if (active) router.replace('/admin/dashboard');
      } catch {
        // Sin sesión o sin rol: nos quedamos en el login.
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => { active = false; };
  }, []);

  async function handleLogin() {
    if (loading) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Inicia sesión', 'Debes iniciar sesión con tu cuenta para acceder al panel.');
        return;
      }

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (profile?.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        Alert.alert('Acceso denegado', 'Tu cuenta no tiene permisos de administrador.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo verificar el acceso');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.container}>
      <View style={s.content}>
        <View style={s.iconWrap}>
          <Ionicons name="shield-checkmark" size={60} color={ACCENT} />
        </View>
        <Text style={s.title}>Panel de Administración</Text>
        <Text style={s.subtitle}>
          El acceso se valida con el rol de administrador de tu cuenta autenticada
        </Text>

        {checking ? (
          <ActivityIndicator color={ACCENT} size="large" style={{ marginTop: 12 }} />
        ) : (
          <TouchableOpacity
            style={[s.loginBtn, loading && s.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={BG} />
            ) : (
              <Text style={s.loginBtnText}>Verificar acceso</Text>
            )}
          </TouchableOpacity>
        )}

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
  subtitle: { fontSize: 14, color: T2, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  loginBtn: { width: '100%', backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { fontSize: 16, fontWeight: '800', color: BG },
  backBtn: { paddingVertical: 12 },
  backBtnText: { fontSize: 14, color: T3, fontWeight: '600' },
});