import {View, Text, Button, StyleSheet, FlatList, Touchable, TouchableOpacity} from "react-native";
import {Link, useLocalSearchParams, useRouter} from "expo-router";
import React, { useEffect, useState } from "react";
import { doc, getDoc, getDocs, updateDoc, arrayUnion, collection } from "firebase/firestore";
import { auth, db } from "@/firebase";
import GroupCard from "@/components/GroupCard";

const Index = () => {
    // const { id } = useLocalSearchParams(); // Get the dynamic group ID from the URL
    const { groupID } = useLocalSearchParams();
    const router = useRouter();
    const [group, setGroup] = useState(null);
    const user = auth.currentUser;
    const [friends, setFriends] = useState<{ id: string, name: string}[] | null>(null);


    useEffect(() => {
        console.log("here")
        const fetchGroup = async () => {
            try {
                if (typeof groupID !== "string") return;

                const usersDocs = await getDocs(collection(db, "groups", groupID, "users"));

                const usersList = usersDocs.docs.map((doc) => ({
                    id: doc.id, // User's UID is the document ID
                    name: doc.data().name, // Assuming "name" is the field in each user document
                }));
                console.log(usersList);

                setFriends(usersList);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchGroup();
    }, []);



    return (
        <View style={styles.container}>
            <Text style={styles.test}> Welcome! </Text>
            <Text>{groupID}</Text>
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
            <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
                <Text>go back</Text>
            </TouchableOpacity>


            <TouchableOpacity style={styles.addFriendButton} onPress={() => router.push(`/groups/${groupID}/addFriends`)}>
                <Text>add friend</Text>
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
    goBackButton: {
        position: "absolute",
        top: 0,
        right: 10,
        backgroundColor: "green",
    },
    addFriendButton: {
        position: "absolute",
        top: 0,
        left: 10,
        backgroundColor: "green",
    },
    test:{
        color: "white",
        fontSize: 16,
        position: "absolute",
        top: 50,
        left: 50
    }
});

export default Index;
