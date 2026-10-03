import React from 'react';
import { Tabs } from 'expo-router';
import { ProtectedRoute } from '../../src/components/guards/ProtectedRoute';
import { OnboardingGuard } from '../../src/components/guards/OnboardingGuard';

// La tab bar nativa de Expo Router se oculta: la app usa su propio
// BottomTabBar (components/BottomTabBar.js), renderizado dentro de cada pantalla.
export default function TabsLayout() {
  return (
    <ProtectedRoute>
      <OnboardingGuard>
        <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
          <Tabs.Screen name="home" />
          <Tabs.Screen name="explore" />
          <Tabs.Screen name="coach" />
          <Tabs.Screen name="profile" />
        </Tabs>
      </OnboardingGuard>
    </ProtectedRoute>
  );
}
