import {View, Text, Button, StyleSheet, FlatList, Touchable, TouchableOpacity} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { doc, getDoc, getDocs, updateDoc, arrayUnion, collection } from "firebase/firestore";
import { auth, db } from "@/firebase";
import GroupCard from "@/components/GroupCard";

const GroupPage = () => {
    const { id } = useLocalSearchParams(); // Get the dynamic group ID from the URL
    const router = useRouter();
    const [group, setGroup] = useState(null);
    const user = auth.currentUser;
    const [friends, setFriends] = useState<{ id: string, name: string}[] | null>(null);


    useEffect(() => {
        const fetchGroup = async () => {
            try {
                if (typeof id !== "string") return;

                const usersDocs = await getDocs(collection(db, "groups", id, "users"));

                const usersList = usersDocs.docs.map((doc) => ({
                    id: doc.id, // User's UID is the document ID
                    name: doc.data().name, // Assuming "name" is the field in each user document
                }));

                setFriends(usersList);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchGroup();
    }, [id]); // Re-fetch when the ID changes

    // const handleJoinGroup = async () => {
    //     if (!user || !group) return;
    //     const groupRef = doc(db, "groups", id);
    //     await updateDoc(groupRef, {
    //         members: arrayUnion(user.uid), // Add user to the group members array
    //     });
    //     alert("You have joined the group!");
    // };
    //
    // if (!group) {
    //     return <Text>Loading group...</Text>;
    // }

    return (
        <View style={styles.container}>
            <Text> Welcome! </Text>
            <Text>{id}</Text>
            {friends ? (
                <FlatList
                    style={styles.groups}
                    data={friends}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <Text style={styles.friendText}>{item.name}</Text>
                    )}
                    contentContainerStyle={styles.listContent}
                />
            ) : (
                <Text>Loading users...</Text>
            )}
            {/*<FlatList*/}
            {/*    style={styles.groups}*/}
            {/*    data={friends}*/}
            {/*    keyExtractor={(item) => item.id}*/}
            {/*    renderItem={({ item }) => <GroupCard group={item} />}*/}
            {/*    contentContainerStyle={styles.listContent} // Adds padding*/}
            {/*/>*/}
            {/*<Text style={styles.title}>{group.name}</Text>*/}
            {/*<Text style={styles.description}>{group.description}</Text>*/}
            {/*<Button title="Join Group" onPress={handleJoinGroup} />*/}
            <TouchableOpacity style={styles.button} onPress={() => router.back()}>
                <Text>go back</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "gold",
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        color: "gray",
        marginBottom: 20,
    },
    groups: {
        flex: 1, // Allows FlatList to take up remaining space
    },
    listContent: {
        paddingBottom: 80, // Prevents overlap with "Create Group" button
    },
    friendText: {
        color: "white", // Change to whatever color you want for the user names
        fontSize: 18,
        marginVertical: 5,
    },
    button: {
        position: "absolute",
        top: 0,
        right: 10,
        backgroundColor: "green",
    }
});

export default GroupPage;
