// src/components/guards/OnboardingGuard.js
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { getPostAuthRoute } from '../../../services/onboardingService';

export function OnboardingGuard({ children }) {
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
        const route = await getPostAuthRoute(user.id);
        if (!mounted) return;
        setCompleted(route === '/home');
      } catch {
        if (!mounted) return;
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
      const inOnboarding = segments.some((s) => s === 'onboarding');
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
