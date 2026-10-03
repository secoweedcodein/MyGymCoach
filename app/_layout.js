import React from 'react';
import { Stack } from 'expo-router';
import { AlertProvider } from '../src/context/AlertContext';
import { SheetProvider } from '../src/context/SheetContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { AuthProvider } from '../src/contexts/AuthProvider';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
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
      </AuthProvider>
    </ErrorBoundary>
  );
}