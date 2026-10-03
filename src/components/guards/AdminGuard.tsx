// src/components/guards/AdminGuard.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { requireAdminSession } from '../../../lib/adminAuth';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const segments = useSegments();
  const router = useRouter();
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
  }, [checking, authorized, isLoginRoute, router]);

  if (checking) {
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
