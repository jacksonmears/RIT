import { View, Text, Button, StyleSheet } from 'react-native';
import React, { useEffect, useState } from "react";
import { db, auth } from "@/firebase"
import {Link, useRouter} from 'expo-router';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';

const Page = () => {
    const [userData, setUserData] = useState<Record<string, any> | null>(null);
    const user = auth.currentUser;
    const router = useRouter();

    useEffect(() => {
        console.log(user?.displayName);
        const checking = async() => {
            if (!user?.displayName) return;
            try {
                const docRef = doc(db, "displayName", user?.displayName);
                const docSnap = await getDoc(docRef);
                if (!user?.displayName || !docSnap.exists() || docSnap.data()?.uid !== user.uid){
                    router.push('/(tabs)/home/createAccount');
                }
            }
            catch (error) {
                console.error('Error updating profile', error);
            }
        }
        checking();
    }, [user]);



    return (
        <View>
            <Text>Welcome back {userData?.displayName}</Text>
            <Text>Welcome back {user?.uid}</Text>
            <Link href="/(tabs)/home/friendRequests">
                <Text style={styles.text}>check friend requests</Text>
            </Link>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
        alignItems: "center",
        justifyContent: "center",
    },
    text: {
        fontSize: 20,
        fontWeight: "bold",
        color: "gold",
    }
})

export default Page;
