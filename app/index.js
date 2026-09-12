import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { loadCustomExercises } from '../src/screens/data/exercises';
import CustomSplashScreen from '../src/screens/SplashScreen';
import { AlertProvider } from '../src/context/AlertContext';
import { SheetProvider } from '../src/context/SheetContext';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [animationFinished, setAnimationFinished] = useState(false);
  const [initialRoute, setInitialRoute] = useState(null);

  // 1. Cargar ejercicios al iniciar
  useEffect(() => {
    loadCustomExercises(supabase);
  }, []);

  // 2. Tope de seguridad para el Splash Screen (4 segundos)
  useEffect(() => {
    const timeout = setTimeout(() => setAnimationFinished(true), 4000);
    return () => clearTimeout(timeout);
  }, []);

  // 3. Verificar estado del usuario y escuchar cambios de sesión
  useEffect(() => {
    checkUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Si inicia sesión, verificamos si ya hizo el onboarding
        const onboardingCompleted = await AsyncStorage.getItem('@mygymcoach_onboarding_completed');
        setInitialRoute(onboardingCompleted ? '/(tabs)' : '/onboarding');
      } else {
        setInitialRoute('/auth');
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Función principal para verificar usuario y onboarding
  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setInitialRoute('/auth');
        return;
      }

      const onboardingCompleted = await AsyncStorage.getItem('@mygymcoach_onboarding_completed');

      if (!onboardingCompleted) {
        setInitialRoute('/onboarding');
      } else {
        setInitialRoute('/(tabs)');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setInitialRoute('/auth');
    } finally {
      setLoading(false); // Terminamos de cargar la lógica
    }
  }

  // 4. Efecto para ejecutar la navegación SOLO cuando todo esté listo
  useEffect(() => {
    // Si la animación terminó, ya cargó la lógica y tenemos una ruta destino: navegamos.
    if (animationFinished && !loading && initialRoute) {
      router.replace(initialRoute);
    }
  }, [animationFinished, loading, initialRoute]);

  // 5. Renderizado
  return (
    <SheetProvider>
      <AlertProvider>
        {/* Mantener contenido visible mientras se completa la redirección evita una pantalla blanca. */}
        <CustomSplashScreen onFinish={() => setAnimationFinished(true)} />
      </AlertProvider>
    </SheetProvider>
  );
}