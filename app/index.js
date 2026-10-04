import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { loadCustomExercises } from '../src/screens/data/exercises';
import CustomSplashScreen from '../src/screens/SplashScreen';
import { useAuth } from '../src/hooks/useAuth';
import { getPostAuthRoute } from '../services/onboardingService';

export default function Index() {
  const { user, isLoading } = useAuth();
  const [animationFinished, setAnimationFinished] = useState(false);
  const [checkedOnboarding, setCheckedOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  // 1. Cargar ejercicios al iniciar
  useEffect(() => {
    loadCustomExercises(supabase);
  }, []);

  // 2. Tope de seguridad para el Splash Screen (4 segundos)
  useEffect(() => {
    const timeout = setTimeout(() => setAnimationFinished(true), 4000);
    return () => clearTimeout(timeout);
  }, []);

  // 3. Comprobar onboarding cuando hay usuario
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (user) {
        try {
          const route = await getPostAuthRoute(user.id);
          if (!mounted) return;
          setOnboardingCompleted(route === '/home');
        } catch {
          if (!mounted) return;
          setOnboardingCompleted(false);
        }
      }
      if (mounted) setCheckedOnboarding(true);
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  // 4. Navegación reactiva al estado global
  useEffect(() => {
    const authReady = !isLoading && checkedOnboarding;
    const splashReady = animationFinished;
    if (!authReady || !splashReady) return;

    if (!user) {
      router.replace('/auth');
      return;
    }

    if (!onboardingCompleted) {
      router.replace('/onboarding');
      return;
    }

    router.replace('/home');
  }, [isLoading, checkedOnboarding, animationFinished, user, onboardingCompleted]);

  // 5. Renderizado (mientras decide ruta, mantenemos splash)
  return <CustomSplashScreen onFinish={() => setAnimationFinished(true)} />;
}