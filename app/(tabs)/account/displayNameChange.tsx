import React, {useEffect, useState} from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { db, auth } from "@/firebase"
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { Link } from 'expo-router'

const Page = () => {

    const [userData, setUserData] = useState<Record<string, any> | null>(null); // Stores full document



    useEffect(() => {
        const fetchData = async () => {
            if (!auth.currentUser?.uid) {
                console.error("User not logged in.");
                return;
            }
            const docRef = doc(db, "users", auth.currentUser.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                // console.log(docSnap.data())
                setUserData(docSnap.data());
            } else {
                console.log("Document not found or access denied.");
            }
        }
        fetchData();
    }, []);






    return (
        <View style={styles.container}>
            <Text style={styles.text}>{userData?.displayName}</Text>
            <Text style={styles.text}>{userData?.bio}</Text>
            <Link href="/(tabs)/account">
                <Text style={styles.text}>back to profile</Text>
            </Link>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: 'white',
    }
});

export default Page;
