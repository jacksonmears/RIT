import {View, Text, Button, StyleSheet, Animated, TextInput, Pressable, TouchableOpacity} from 'react-native';
import React, { useEffect, useState } from "react";
import { db, auth } from "@/firebase"
import {Link, useRouter} from 'expo-router';
import { collection, addDoc, getDoc, doc, getDocs, orderBy, limit, setDoc, serverTimestamp } from 'firebase/firestore';
import {Integer} from "@firebase/webchannel-wrapper/bloom-blob";
import add = Animated.add;

const Page = () => {
    const [userData, setUserData] = useState<Record<string, any> | null>(null);
    const [groupName, setGroupName] = useState("");
    const user = auth.currentUser;
    const router = useRouter();


    const createGroup = async (groupName: string) => {
        try {
            const docRef = await addDoc(collection(db, "groups"), {
                name: groupName,              // Store the group name
                timestamp: serverTimestamp(),        // Optional metadata
                createdBy: auth.currentUser?.uid // Track the creator if logged in
            });

            if (docRef) {
                await addGroupUserSide(docRef.id, groupName);
                await addGroupCollectionSide(docRef.id, groupName);
            }

            console.log("Group created with ID:", docRef.id);
        } catch (error) {
            console.error("Error creating group:", error);
        }
    }

    const addGroupUserSide = async (groupID: string, groupName: string) => {
        if (!auth.currentUser) return;

        const docRef = doc(db, "users", auth.currentUser.uid, "groups", groupID);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            await setDoc(docRef, {
                name: groupName,
            });

            console.log(`Group ${groupID} added to user ${auth.currentUser.uid}`);
        } else {
            console.log(`Group ${groupID} already exists.`);
        }
    };

    const addGroupCollectionSide = async (groupID: string, groupName: string) => {
        if (!user) return;

        const colRef = collection(db, "groups", groupID, "users");
        const docSnaps = await getDocs(colRef);

        if (docSnaps.empty) {
            await setDoc(doc(colRef, user.uid), {
                name: user.displayName,
                timestamp: serverTimestamp(),
            });

            console.log(`User ${user.uid} added to group ${groupID}`);
        }
        else {
            console.log(`user in ${groupID} already exists.`);
        }
    };




    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="group name"
                placeholderTextColor="#ccc"
                value={groupName}
                onChangeText={setGroupName}
            />
            <Pressable style={styles.button} onPress={() => createGroup(groupName)}>
                <Text style={styles.text}>create group</Text>
            </Pressable>
            <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.text}>cancel</Text>
            </TouchableOpacity>

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
        color: "white",
    },
    back: {
        position: "absolute",
        top: 0,
        right: 0,
    },
    input: {
        position: "absolute",
        top: 50,
        marginVertical: 4,
        marginHorizontal: 40,
        borderWidth: 1,
        borderRadius: 4,
        padding: 20,
        backgroundColor: "white",
        fontSize: 20,
    },
    button: {
        position: "absolute",
        backgroundColor: "red",
        marginVertical: 4,
        marginHorizontal: 40,
        borderRadius: 4,
        top: 50,
        left: 0,
    },
})

export default Page;
