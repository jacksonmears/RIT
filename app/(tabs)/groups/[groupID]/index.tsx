import {View, Text, Button, StyleSheet, FlatList, Touchable, TouchableOpacity, Pressable} from "react-native";
import {Link, useLocalSearchParams, useRouter} from "expo-router";
import React, { useEffect, useState } from "react";
import {doc, getDoc, getDocs, updateDoc, arrayUnion, collection, query, orderBy} from "firebase/firestore";
import { auth, db } from "@/firebase";
import GroupCard from "@/components/GroupCard";
import {Checkbox} from "react-native-paper";

const Index = () => {
    // const { id } = useLocalSearchParams(); // Get the dynamic group ID from the URL
    const { groupID } = useLocalSearchParams();
    const router = useRouter();
    const [group, setGroup] = useState(null);
    const user = auth.currentUser;
    const [friends, setFriends] = useState<{ id: string, name: string}[] | null>(null);
    const [posts, setPosts] = useState<{ id: string }[] | null>(null);
    const [postContents, setPostContents] = useState<{ id: string, content: string }[] | null>(null);

    useEffect(() => {
        getPostIds()
    }, [groupID]);

    useEffect(() => {
        getPostContent()
    }, [posts]);

    useEffect(() => {
        const fetchGroup = async () => {
            try {
                if (typeof groupID !== "string") return;

                const usersDocs = await getDocs(collection(db, "groups", groupID, "users"));

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
    }, []);

    const getPostIds = async () => {
        if (!user || typeof groupID !== "string") return;

        try {
            const q = query(
                collection(db, "groups", groupID, "posts"),
                orderBy("createdAt", "desc") // Retrieves newest posts first (LIFO)
            );

            const querySnapshot = await getDocs(q);
            const postsRef = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setPosts(postsRef);

        } catch (error) {
            console.error("Error retrieving posts:", error);
        }
    };

    const getPostContent = async () => {
        if (!posts) return;

        try {
            const postContents = await Promise.all(posts.map(async (post) => {
                const postRef = doc(db, "posts", post.id);
                const postSnap = await getDoc(postRef);

                if (postSnap.exists()) {
                    return { id: post.id, content: postSnap.data().content };
                } else {
                    return { id: post.id, content: "Content not found" };
                }
            }));

            setPostContents(postContents);
        } catch (error) {
            console.error("Error fetching post content:", error);
        }
    };

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

            <FlatList
                data={postContents}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.friendContainer}>
                        <View style={styles.friendComponent}>
                            <Text style={styles.text}>{item.content}</Text>

                            <Pressable  style={styles.acceptButton}>
                                <Text>Accept</Text>
                            </Pressable>
                            <Pressable style={styles.declineButton}>
                                <Text>Decline</Text>
                            </Pressable>
                        </View>
                    </View>
                )}
            />

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
    },
    text: {
        fontSize: 18,
        color: "white",
    },
});

export default Index;
