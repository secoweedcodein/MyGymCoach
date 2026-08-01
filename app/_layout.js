// app/_layout.js
import React from 'react';
import { Stack } from 'expo-router';
import { AlertProvider } from '../src/context/AlertContext';
import { SheetProvider } from '../src/context/SheetContext';

export default function RootLayout() {
  return (
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
  );
}