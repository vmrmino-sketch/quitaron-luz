
import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FAF7FF' },
        headerTintColor: '#242238',
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="mapa" options={{ title: 'Mapa y Consenso 3/3' }} />
      <Stack.Screen name="reportar" options={{ title: 'Nuevo Reporte' }} />
      <Stack.Screen name="chat-barrio" options={{ title: 'Chat por Barrio' }} />
    </Stack>
  );
}