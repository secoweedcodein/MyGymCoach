// app/admin/_layout.js
// Protege TODAS las rutas /admin/*: verifica sesión y rol de admin antes de
// renderizar cualquier pantalla del panel.
import React from 'react';
import { Stack } from 'expo-router';
import { AdminGuard } from '../../src/components/guards/AdminGuard';

export default function AdminLayout() {
  return (
    <AdminGuard>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
    </AdminGuard>
  );
}
