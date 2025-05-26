(globalThis as any).RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;



import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import auth from '@react-native-firebase/auth';

const RootLayout = () => {
    const [initializing, setInitializing] = useState(true);
    const [user, setUser] = useState<import('@react-native-firebase/auth').FirebaseAuthTypes.User | null>(null);
    const router = useRouter();
    const segments = useSegments();

    // Subscribe to auth state changesF
    useEffect(() => {
        return auth().onAuthStateChanged(u => {
            setUser(u);
            if (initializing) setInitializing(false);
        });
    }, []);

    // Redirect logic
    useEffect(() => {
        if (initializing) return;
        const inAuthGroup = segments[0] === "(tabs)";

        if (user && !inAuthGroup && user.emailVerified) {
            router.replace("/(tabs)/home");
        } else if (!user && inAuthGroup) {
            router.replace("/");
        }
    }, [user, initializing, segments]);

    // Loading indicator
    if (initializing) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }} />
        </GestureHandlerRootView>
    );
};

export default RootLayout;
