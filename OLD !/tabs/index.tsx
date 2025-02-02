// app/tabs/index.tsx

import React from 'react';
import { View, Text, Button } from 'react-native';
import { Link } from 'expo-router';

const HomeScreen = () => {
  return (
    <View>
      <Text>Welcome to the Home Screen!</Text>
      <Link href="/tabs/test">
        <Button title="Go to Test Screen" />
      </Link>
    </View>
  );
};

export default HomeScreen;
