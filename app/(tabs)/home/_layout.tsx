import { Stack } from 'expo-router';
import React from 'react';

const Layout = () => {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" /> {/* Handles the account home page */}
            <Stack.Screen name="createAccount" /> {/* Handles the display name change */}
            <Stack.Screen name="friendRequests" />
        </Stack>
    );
};

export default Layout;
