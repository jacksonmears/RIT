import { View, Text, Button, StyleSheet, ScrollView, StatusBar } from 'react-native';
import React, { useEffect, useState } from "react";
import { db, auth } from "@/firebase"
import {Link, useRouter} from 'expo-router';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";

const Page = () => {
    const [userData, setUserData] = useState<Record<string, any> | null>(null);
    const user = auth.currentUser;
    const router = useRouter();



    return (


        // <SafeAreaProvider>
        //     <SafeAreaView style={styles.container} edges={['top']}>
        //         <ScrollView style={styles.scrollView}>
        //             <Text style={styles.text}>
        //                 Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
        //                 eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
        //                 minim veniam, quis nostrud exercitation ullamco laboris nisi ut
        //                 aliquip ex ea commodo consequat. Duis aute irure dolor in
        //                 reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
        //                 pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
        //                 culpa qui officia deserunt mollit anim id est laborum.
        //             </Text>
        //         </ScrollView>
        //     </SafeAreaView>
        // </SafeAreaProvider>
        <ScrollView style={styles.scrollView}>
            <Text style={styles.t}>Welcome back {userData?.displayName}</Text>
            <Text>Welcome back {user?.uid}</Text>
            <Link href="/(tabs)/home/friendRequests">
                <Text style={styles.text}>check friend requests</Text>
            </Link>
        </ScrollView>



    )
}

const styles = StyleSheet.create({
    // container: {
    //     flex: 1,
    //     backgroundColor: "black",
    //     alignItems: "center",
    //     justifyContent: "center",
    // },
    // text: {
    //     fontSize: 20,
    //     fontWeight: "bold",
    //     color: "gold",
    // },
    // t: {
    //     position: "absolute",
    //     top: 100,
    // }

    container: {
        flex: 1,
        paddingTop: StatusBar.currentHeight,
    },
    scrollView: {
        backgroundColor: 'white',
    },
    text: {
        fontSize: 20,
        padding: 12,
        color: 'gold',
    },
    t: {
        fontSize: 20,
        padding: 12,
        color: 'black'
    }
})

export default Page;
