// src/components/guards/OnboardingGuard.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [checking, setChecking] = useState(true);
  const [completed, setCompleted] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (isLoading) return;
      if (!user) {
        if (mounted) setChecking(false);
        return;
      }
      try {
        const v = await AsyncStorage.getItem('@mygymcoach_onboarding_completed');
        if (!mounted) return;
        setCompleted(v === 'true');
      } catch {
        if (mounted) return;
        setCompleted(false);
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user, isLoading]);

  useEffect(() => {
    if (checking || isLoading) return;
    if (user && !completed) {
      const inOnboarding = segments.some((s: string) => s === 'onboarding');
      if (!inOnboarding) {
        router.replace('/onboarding');
      }
    }
  }, [checking, isLoading, user, completed, segments, router]);

  if (isLoading || checking) {
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

  return <>{children}</>;
}
