// src/components/guards/ProtectedRoute.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const inAuthRoute = segments.some((s: string) => s === 'auth');

  useEffect(() => {
    if (isLoading) return;
    if (!user && !inAuthRoute) {
      router.replace('/auth');
    }
  }, [isLoading, user, inAuthRoute, router]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0D0D0D',
        }}
      >
        <ActivityIndicator color="#C0FF3E" size="large" />
      </View>
    );
  }

  if (!user && !inAuthRoute) {
    return null;
  }

  return <>{children}</>;
}
