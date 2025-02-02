// app/tabs/_layout.tsx

import React from 'react';
import { View, Text } from 'react-native';
import { Slot } from 'expo-router';

const TabsLayout = () => {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 20, padding: 10, backgroundColor: '#f3f3f3' }}>
        Tabs Layout
      </Text>
      {/* This Slot will render the screen for the current /tabs route */}
      <Slot />
    </View>
  );
};

export default TabsLayout;
