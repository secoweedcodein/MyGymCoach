import React from 'react';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
	return (
		<Tabs screenOptions={{ headerShown: false }}>
			<Tabs.Screen name="index" />
			<Tabs.Screen name="explore" />
			<Tabs.Screen name="coach" />
			<Tabs.Screen name="profile" />
		</Tabs>
	);
}
