import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="scanner" options={{ title: 'Scan QR Code', presentation: 'modal' }} />
      <Stack.Screen name="dashboard" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="manual-entry" options={{ headerShown: false, presentation: 'modal' }} />
    </Stack>
  );
}