import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { PastelColors } from '@/shared/theme/pastelColors';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: PastelColors.lavanda,
          },
          headerTintColor: PastelColors.textoPrincipal,
          headerTitleStyle: {
            fontWeight: '900',
            fontSize: 16,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: PastelColors.fondo,
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: '🏘️ Socialízate Quito' }} />
        <Stack.Screen name="alertas" options={{ title: '🗺️ Mapa y Consenso 3/3' }} />
        <Stack.Screen name="reportar" options={{ title: '✨ Nuevo Reporte 3D' }} />
        <Stack.Screen name="juegos" options={{ title: '🎮 Salón de Juegos 3D' }} />
        <Stack.Screen name="perfil" options={{ title: '🪪 Credencial 3D del Vecino' }} />
        <Stack.Screen name="eventos" options={{ title: '📅 Agenda de Eventos 3D' }} />
        <Stack.Screen name="emprende" options={{ title: '🛍️ Vecino Emprende 3D' }} />
        <Stack.Screen name="chat" options={{ title: '💬 Chat del Sector' }} />
        <Stack.Screen name="zonas" options={{ title: '📍 Zonas de Quito' }} />
      </Stack>
    </>
  );
}