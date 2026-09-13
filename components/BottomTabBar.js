// src/components/BottomTabBar.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import { colors as c } from '../lib/theme';

const TABS = [
  { name: 'Inicio', path: '/home', icon: '🏠' },
  { name: 'Explorar', path: '/explore', icon: '🧭' },
  { name: 'Coach IA', path: '/coach', icon: '🤖' },
  { name: 'Perfil', path: '/profile', icon: '👤' },
];

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: c.bg2,
    borderTopWidth: 1,
    borderTopColor: c.border,
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
    backgroundColor: c.accent + '20',
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
    color: c.t3,
    fontWeight: '600',
    marginTop: 2,
    zIndex: 1,
  },
  labelActive: {
    color: c.accent,
    fontWeight: '800',
  },
  dot: {
    position: 'absolute',
    bottom: 4,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: c.accent,
  },
});

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const isActive = tab.path === '/home'
          ? pathname === '/home' || pathname === '/(tabs)'
          : pathname === tab.path;

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabItem}
            onPress={() => {
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