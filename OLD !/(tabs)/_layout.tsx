// /app/tabs/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function TabsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="test"
        component={require('./TestScreen').default} // Import the TestScreen.js file directly
        options={{ headerShown: false }} // Optionally hide the header
      />
    </Stack>
  );
}
