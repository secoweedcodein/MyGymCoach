import 'react-native-url-polyfill/auto';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './src/lib/supabase';
import { colors } from './src/lib/theme';

// Screens
import AuthScreen    from './src/screens/AuthScreen';
import HomeScreen    from './src/screens/HomeScreen';
import WorkoutScreen from './src/screens/WorkoutScreen';
import RoutinesScreen from './src/screens/RoutinesScreen';
import LibraryScreen from './src/screens/LibraryScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#141418',
          borderTopColor: '#ffffff08',
          paddingBottom: 6,
          height: 60,
        },
        tabBarActiveTintColor: '#d4ff47',
        tabBarInactiveTintColor: '#5a5a70',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="Inicio"     component={HomeScreen}     options={{ tabBarIcon: () => null }} />
      <Tab.Screen name="Rutinas"    component={RoutinesScreen} options={{ tabBarIcon: () => null }} />
      <Tab.Screen name="Ejercicios" component={LibraryScreen}  options={{ tabBarIcon: () => null }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : (
          <>
            <Stack.Screen name="Main"    component={MainTabs} />
            <Stack.Screen name="Workout" component={WorkoutScreen}
              options={{ presentation: 'fullScreenModal' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}