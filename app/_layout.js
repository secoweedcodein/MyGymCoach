import React from 'react';
import { Stack } from 'expo-router';
import { AlertProvider } from '../src/context/AlertContext';
import { SheetProvider } from '../src/context/SheetContext';
import { ErrorBoundary } from '../components/ErrorBoundary'; // Ajusta la ruta según la ubicación real de tu componente
import { FloatingRestTimer } from '../components/FloatingRestTimer';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SheetProvider>
        <AlertProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false }}
            />
          </Stack>
        </AlertProvider>
      </SheetProvider>
      <FloatingRestTimer />
    </ErrorBoundary>
  );
}