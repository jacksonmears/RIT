import { Tabs } from "expo-router";
import { useState, useEffect } from "react";
import { auth } from "@/firebase";
import { User } from "firebase/auth";
import { setUserId } from "firebase/analytics"; // Make sure you're using the correct analytics package

const TabsLayout = () => {
    const [initializing, setInitializing] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    // The correct function signature for onAuthStateChanged
    const onAuthStateChanged = (user: User | null) => {
        console.log('onAuthStateChanged', user);
        setUser(user);
        if (user) {
            setUserId(auth, user.uid); // Set user ID for analytics when the user is authenticated
        }
        if (initializing) setInitializing(false);
    };

    useEffect(() => {
        // Listen to the authentication state
        const unsubscribe = auth.onAuthStateChanged(onAuthStateChanged);

        // Cleanup on unmount
        return () => unsubscribe();
    }, [initializing]);

    if (initializing) {
        return null; // Optionally render a loading spinner or placeholder while initializing
    }

    return (
        <Tabs>
            <Tabs.Screen name="Index" />
            {/*<Tabs.Screen name="users/[id]" />*/}
        </Tabs>
    );
};

export default TabsLayout;
