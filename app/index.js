import React, { useEffect, useState } from 'react';
import AuthScreen from '../src/screens/authscreen';
import HomeScreen from '../src/screens/homeScreen';
import CustomSplashScreen from '../src/screens/SplashScreen';
import { supabase } from '../lib/supabase';
import { loadCustomExercises } from '../src/screens/data/exercises';

import { AlertProvider } from "../src/context/AlertContext";
import { SheetProvider } from "../src/context/SheetContext";

export default function Page() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [animationFinished, setAnimationFinished] = useState(false);

  useEffect(() => {
    loadCustomExercises(supabase);
  }, []);

  useEffect(() => {
    checkUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  }

  let screen = null;

  if (!animationFinished) {
    screen = (
      <CustomSplashScreen
        onFinish={() => setAnimationFinished(true)}
      />
    );
  } else if (loading) {
    screen = null;
  } else {
    screen = user ? <HomeScreen /> : <AuthScreen />;
  }

  // Retornamos la pantalla directamente. El AlertProvider debe envolver 
  // a toda la app en el archivo app/_layout.js
  return (
    <SheetProvider>
      <AlertProvider>
        {screen}
      </AlertProvider>
    </SheetProvider>
  );
}