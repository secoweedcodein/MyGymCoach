import React from 'react';
import { Tabs } from 'expo-router';

// La tab bar nativa de Expo Router se oculta: la app usa su propio
// BottomTabBar (components/BottomTabBar.js), renderizado dentro de cada pantalla.
export default function TabsLayout() {
	return (
		<Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
			<Tabs.Screen name="home" />
			<Tabs.Screen name="explore" />
			<Tabs.Screen name="coach" />
			<Tabs.Screen name="profile" />
		</Tabs>
	);
}