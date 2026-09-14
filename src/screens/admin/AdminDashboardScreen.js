// src/screens/admin/AdminDashboardScreen.js
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../../lib/supabase';

const ACCENT = '#C0FF3E';
const BG = '#0D0D0D';
const SURFACE = '#161616';
const BORDER = '#FFFFFF0D';
const T1 = '#FFFFFF';
const T2 = '#A0A0A0';
const T3 = '#555555';
const PURPLE = '#8B7CFF';
const ORANGE = '#FF6B3E';
const CYAN = '#3EE5FF';
const PINK = '#FF3EAA';
const RED = '#FF453A';
const GOLD = '#FFCD00';

const ADMIN_OPTIONS = [
  { 
    id: 'featured', 
    icon: 'star', 
    label: 'Contenido Destacado', 
    subtitle: 'Reto del mes y ejercicio del día', 
    color: GOLD, 
    route: '/admin/featured' 
  },
  { 
    id: 'routines', 
    icon: 'barbell', 
    label: 'Rutinas Públicas', 
    subtitle: 'Crear, editar y eliminar rutinas', 
    color: CYAN, 
    route: '/admin/routines' 
  },
  { 
    id: 'articles', 
    icon: 'book', 
    label: 'Artículos', 
    subtitle: 'Gestionar contenido de Aprende', 
    color: ACCENT, 
    route: '/admin/articles' 
  },
  { 
    id: 'recipes-ia', 
    icon: 'restaurant', 
    label: 'Recetas IA', 
    subtitle: 'Gestionar recetas oficiales', 
    color: PURPLE, 
    route: '/admin/recipes-ia' 
  },
  { 
    id: 'user-recipes', 
    icon: 'people', 
    label: 'Recetas Usuarios', 
    subtitle: 'Aprobar o eliminar recetas', 
    color: ORANGE, 
    route: '/admin/user-recipes' 
  },
  { 
    id: 'challenges', 
    icon: 'trophy', 
    label: 'Retos', 
    subtitle: 'Gestionar retos activos', 
    color: PINK, 
    route: '/admin/challenges' 
  },
  { 
    id: 'trends', 
    icon: 'flame', 
    label: 'Tendencias', 
    subtitle: 'Gestionar tendencias del home', 
    color: ORANGE, 
    route: '/admin/trends' 
  },
];

export default function AdminDashboardScreen() {
  const [signingOut, setSigningOut] = React.useState(false);

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/auth');
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo cerrar la sesión');
      setSigningOut(false);
    }
  }

  function confirmLogout() {
    Alert.alert(
      'Salir del panel',
      '¿Estás seguro que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: handleLogout },
      ]
    );
  }

  return (
    <View style={s.container}>
      {/* HEADER */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <View style={s.adminBadge}>
            <Ionicons name="shield-checkmark" size={12} color={BG} />
            <Text style={s.adminBadgeText}>ADMIN</Text>
          </View>
          <Text style={s.headerTitle}>Panel de Control</Text>
          <Text style={s.headerSubtitle}>Gestiona el contenido de la app</Text>
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={confirmLogout} activeOpacity={0.8}>
          {signingOut ? (
            <ActivityIndicator size="small" color={RED} />
          ) : (
            <Ionicons name="log-out-outline" size={20} color={RED} />
          )}
        </TouchableOpacity>
      </View>

      {/* OPCIONES */}
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={s.sectionLabel}>MÓDULOS DE GESTIÓN</Text>
        
        {ADMIN_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={s.optionCard}
            onPress={() => router.push(option.route)}
            activeOpacity={0.8}
          >
            <View style={[s.optionIcon, { backgroundColor: option.color + '20' }]}>
              <Ionicons name={option.icon} size={24} color={option.color} />
            </View>
            <View style={s.optionContent}>
              <Text style={s.optionLabel}>{option.label}</Text>
              <Text style={s.optionSubtitle}>{option.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={T3} />
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    paddingHorizontal: 20, 
    paddingTop: 60, 
    paddingBottom: 20, 
    gap: 12 
  },
  adminBadge: { 
    flexDirection: 'row', 
    alignSelf: 'flex-start', 
    backgroundColor: ACCENT, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8, 
    marginBottom: 8, 
    gap: 4, 
    alignItems: 'center' 
  },
  adminBadgeText: { fontSize: 10, fontWeight: '800', color: BG, letterSpacing: 0.5 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: T1, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 13, color: T2, marginTop: 4 },
  logoutBtn: { 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    backgroundColor: RED + '15', 
    borderWidth: 1, 
    borderColor: RED + '40', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  scrollContent: { paddingHorizontal: 20 },
  sectionLabel: { 
    fontSize: 10, 
    fontWeight: '700', 
    letterSpacing: 2, 
    color: T3, 
    textTransform: 'uppercase', 
    marginBottom: 12 
  },
  optionCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: SURFACE, 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 10, 
    borderWidth: 1, 
    borderColor: BORDER, 
    gap: 14 
  },
  optionIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  optionContent: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '700', color: T1, marginBottom: 2 },
  optionSubtitle: { fontSize: 12, color: T3, fontWeight: '500' },
});