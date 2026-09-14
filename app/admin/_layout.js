// app/admin/_layout.js
// Protege TODAS las rutas /admin/*: verifica sesión y rol de admin antes de
// renderizar cualquier pantalla del panel. Un usuario normal que navegue
// manualmente a /admin/* es redirigido a /admin/login.
import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { requireAdminSession } from '../../lib/adminAuth';

export default function AdminLayout() {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const segments = useSegments();
  const current = segments[segments.length - 1];
  const isLoginRoute = current === 'login';

  const check = useCallback(async () => {
    setChecking(true);
    try {
      await requireAdminSession();
      setAuthorized(true);
    } catch {
      setAuthorized(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (isLoginRoute) {
      setChecking(false);
      return;
    }
    check();
  }, [isLoginRoute, check]);

  useEffect(() => {
    if (!checking && !authorized && !isLoginRoute) {
      router.replace('/admin/login');
    }
  }, [checking, authorized, isLoginRoute]);

  if (checking) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D0D', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#C0FF3E" size="large" />
      </View>
    );
  }

  // Autorizado o en la pantalla de login (accesible sin ser admin).
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}