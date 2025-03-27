import {View, Text, Button, StyleSheet, Animated, TextInput, Pressable, TouchableOpacity, FlatList} from 'react-native';
import React, { useEffect, useState } from "react";
import { db, auth } from "@/firebase"
import {Link, useRouter} from 'expo-router';
import {
    collection,
    addDoc,
    getDoc,
    doc,
    getDocs,
    orderBy,
    limit,
    setDoc,
    onSnapshot,
    serverTimestamp, updateDoc, arrayRemove
} from 'firebase/firestore';
import {Integer} from "@firebase/webchannel-wrapper/bloom-blob";
import add = Animated.add;

const Page = () => {
    const [groupRequest, setGroupRequest] = useState([]);
    const user = auth.currentUser;
    const router = useRouter();


    useEffect(() => {
        if (user) {
            const docRef = doc(db, "users", user.uid);

            const unsubscribe = onSnapshot(docRef, (docSnap) => {
                const userData = docSnap.data();
                if (userData?.groupRequests) {
                    setGroupRequest(userData.groupRequests);
                }
            });

            return () => unsubscribe();
        }
    }, [groupRequest]);

    const acceptGroupInvite = async (groupId: string) => {
        if (!user) return;
        try {
            const groupNameRef = doc(db, "groups", groupId);
            const docSnap = await getDoc(groupNameRef);
            if (docSnap.exists()) {
                const groupName = docSnap.data().name;
                addGroupUserSide(groupId, groupName);
                addGroupCollectionSide(groupId);
                removeGroupInvite(groupId);
                console.log("group added successfully.");
            }
            else {
                console.log("group adding failed.");
            }

        } catch (err) {
            console.error(err);
        }

    }



    const addGroupUserSide = async (groupID: string, groupName: string) => {
        if (!auth.currentUser) return;

        const docRef = doc(db, "users", auth.currentUser.uid, "groups", groupID);

        try {
            await setDoc(docRef, {
                name: groupName,
            });

            console.log(`Group ${groupID} added to user ${auth.currentUser.uid}`);
        } catch (error) {
            console.log(`Group ${groupID} already exists.`);
        }
    };

    const addGroupCollectionSide = async (groupID: string) => {
        if (!user) return;

        const colRef = collection(db, "groups", groupID, "users");
        try {
            await setDoc(doc(colRef, user.uid), {
                name: user.displayName,
            });
            console.log(`User ${user.uid} added to group ${groupID}`);
        } catch (error) {
            console.log(`user in ${groupID} already exists.`);

        }

    };


    const removeGroupInvite = async (groupID: string) => {
        if (user) {
            const docRef = doc(db, "users", user.uid);

            try {
                await updateDoc(docRef, {
                    groupRequests: arrayRemove(groupID)
                });

                console.log(`Removed group request from ${groupID}`);
            } catch (error) {
                console.error("Error removing group request: ", error);
            }
        }
    };


    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text>go back</Text>
            </TouchableOpacity>
            <FlatList
                data={groupRequest}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.friendContainer}>
                        <View style={styles.friendComponent}>
                            <Text style={styles.text}>{item}</Text>

                            <Pressable onPress={() => acceptGroupInvite(item)} style={styles.acceptButton}>
                                <Text>Accept</Text>
                            </Pressable>
                            <Pressable onPress={() => removeGroupInvite(item)} style={styles.declineButton}>
                                <Text>Decline</Text>
                            </Pressable>
                        </View>
                    </View>
                )}
            />
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
    backButton: {
        position: "absolute",
        top: 0,
        right: 10,
        backgroundColor: "green",
    },
    text: {
        fontSize: 18,
        color: "white",
    },
    button: {
        backgroundColor: "gold"
    },
    friendContainer: {
        alignItems: "center",
        justifyContent: "center",
        width: "100%", // Ensures it takes full width
    },
    friendComponent: {
        flexDirection: "row", // Places items in a row
        justifyContent: "space-between", // Pushes name left, button right
        alignItems: "center",
        padding: 10,
        width: "90%", // Adjust width as needed
        borderBottomWidth: 1,
    },
    acceptButton: {
        backgroundColor: "green",
        borderRadius: 7,
    },
    declineButton: {
        backgroundColor: "red",
        borderRadius: 7,
    }

})

export default Page;
