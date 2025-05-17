import { Stack, useRouter, useSegments } from "expo-router";
import {useEffect, useState} from "react";
import {User} from "firebase/auth";
import {auth} from "@/firebase";
import { View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const RootLayout = () => {
    const [initializing, setInitializing] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();
    const segments = useSegments();


    const onAuthStateChanged = (user: User | null) => {
        setUser(user);
        if (initializing) setInitializing(false);
    };

    useEffect(() => {
        return auth.onAuthStateChanged(onAuthStateChanged);
    }, []);

    useEffect(() => {
        if (initializing) return;

        const inAuthGroup = segments[0] === '(tabs)';


        if (user && !inAuthGroup && user.emailVerified) {
            router.replace('/(tabs)/home');
        } else if (!user && inAuthGroup) {
            router.replace('/');
        }

    }, [user, initializing, segments]);

    if (initializing)
        return (
            <View
                style={{
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                }}>
                <ActivityIndicator size="large" />
            </View>
        );


    return (
        <GestureHandlerRootView>
            <Stack screenOptions={{ headerShown: false }}>
                {/*<Stack.Screen name="index" options={{headerShown: false}} />*/}
                {/*<Stack.Screen name="signUp" options={{ headerShown: false }} />*/}
                {/*<Stack.Screen name="forgotPassword" options={{ headerShown: false }} />*/}
                {/*<Stack.Screen name="(tabs)" options={{headerShown: false}} />*/}
            </Stack>
        </GestureHandlerRootView>

    )

};

export default RootLayout;
