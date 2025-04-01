import { Stack, useRouter, useSegments, Link } from "expo-router";
import {useEffect, useState} from "react";
import {User} from "firebase/auth";
import {auth} from "@/firebase";
import { setUserId } from "firebase/analytics";
import { View, ActivityIndicator } from "react-native";

const RootLayout = () => {
    const [initializing, setInitializing] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();
    const segments = useSegments();


    const onAuthStateChanged = (user: User | null) => {
        console.log('onAuthStateChanged', user);
        setUser(user);
        if (user) setUserId(auth, user.uid);
        if (initializing) setInitializing(false);
    };

    useEffect(() => {
        const subscriber = auth.onAuthStateChanged(onAuthStateChanged);

        return subscriber;
    }, []);

    useEffect(() => {
        if (initializing) return;

        const inAuthGroup = segments[0] === '(tabs)';


        if (user && !inAuthGroup) {
            console.log("user logged in")
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
        <Stack>
            <Stack.Screen name="index" options={{headerShown: false}} />
            <Stack.Screen name="signUp" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{headerShown: false}} />
        </Stack>
    )

};

export default RootLayout;
