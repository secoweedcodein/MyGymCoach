// src/components/BottomTabBar.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router, usePathname } from 'expo-router';

const ACCENT = '#C0FF3E';
const SURFACE = '#161616';
const T1 = '#FFFFFF';
const T3 = '#555555';

const TABS = [
  { name: 'Inicio', path: '/', icon: '🏠' },
  { name: 'Explorar', path: '/explore', icon: '🧭' },
  { name: 'Coach IA', path: '/coach', icon: '🤖' },
  { name: 'Perfil', path: '/profile', icon: '👤' },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        // Detectar si estamos en la ruta activa (maneja tanto '/' como '/(tabs)')
        const isActive = pathname === tab.path || (tab.path === '/' && (pathname === '/' || pathname === '/(tabs)'));
        
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => {
              // ✅ CORRECCIÓN: Solo navegar si NO estamos ya en esa pestaña
              // ✅ CORRECCIÓN: Usar 'replace' en lugar de 'push' para no apilar pantallas
              if (!isActive) {
                router.replace(tab.path);
              }
            }}
            activeOpacity={0.7}
          >
            {isActive && <View style={styles.activeBg} />}
            
            <Text style={[styles.icon, isActive && styles.iconActive]}>
              {tab.icon}
            </Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.name}
            </Text>
            {isActive && <View style={styles.dot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: SURFACE,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeBg: {
    position: 'absolute',
    top: -2,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: ACCENT + '20',
  },
  icon: {
    fontSize: 22,
    zIndex: 1,
  },
  iconActive: {
    fontSize: 26,
  },
  label: {
    fontSize: 10,
    color: T3,
    fontWeight: '600',
    marginTop: 2,
    zIndex: 1,
  },
  labelActive: {
    color: ACCENT,
    fontWeight: '800',
  },
  dot: {
    position: 'absolute',
    bottom: 4,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: ACCENT,
  },
});