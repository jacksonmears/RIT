import {View, Text, Button, StyleSheet, FlatList, Touchable, ScrollView, TouchableOpacity, Pressable} from "react-native";
import {Link, useLocalSearchParams, useRouter} from "expo-router";
import React, { useEffect, useState } from "react";
import {doc, getDoc, getDocs, updateDoc, arrayUnion, collection, query, orderBy, limit} from "firebase/firestore";
import { auth, db } from "@/firebase";
import PostComp from "@/components/PostComp"; // Import reusable component
import {Checkbox} from "react-native-paper";

const Index = () => {
    // const { id } = useLocalSearchParams(); // Get the dynamic group ID from the URL
    const { groupID } = useLocalSearchParams();
    const groupIDString = String(groupID);
    const router = useRouter();
    const [group, setGroup] = useState(null);
    const user = auth.currentUser;
    const [friends, setFriends] = useState<{ id: string, name: string}[] | null>(null);
    const [posts, setPosts] = useState<{ id: string }[] | null>(null);
    const [postContents, setPostContents] = useState<{ groupID: string, id: string, content: string, caption: string, userName: string }[] | null>(null);

    useEffect(() => {
        getPostIds()
    }, [groupIDString]);

    useEffect(() => {
        getPostContent()
    }, [posts]);

    useEffect(() => {
        const fetchGroup = async () => {
            try {
                const usersDocs = await getDocs(collection(db, "groups", groupIDString, "users"));

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
        if (!user) return;

        try {
            const q = query(
                collection(db, "groups", groupIDString, "posts"),
                orderBy("createdAt", "desc"), // Retrieves newest posts first (LIFO)
                limit(20)
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
                    const userID = postSnap.data().user;
                    const displayName = await getDoc(doc(db, "users", userID));
                    let userName = ''
                    if (displayName.exists()) {
                        userName = displayName.data().displayName;
                    }

                    return { groupID: groupIDString, id: post.id, content: postSnap.data().content, caption: postSnap.data().caption, userName: userName };
                } else {
                    return { groupID: groupIDString, id: post.id, content: "Content not found", caption: "failed", userName: "failed" };
                }
            }));

            setPostContents(postContents);
        } catch (error) {
            console.error("Error fetching post content:", error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.addFriendButton} onPress={() => router.push(`/groups/${groupID}/addFriends`)}>
                    <Text style={styles.buttonText}>Add Friend</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                inverted
                style={styles.groups}
                data={postContents}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    // <TouchableOpacity
                    //     onPress={() => router.push({
                    //         pathname: '/(tabs)/groups/[groupID]/post',
                    //         params: { groupID: groupID as string, idT: item.id, contentT: item.content, captionT: item.caption, userNameT: item.userName }
                    //     })}
                    // >
                    <PostComp post={item} />
                    // <Text>testing</Text>
                    // </TouchableOpacity>
                )}
                contentContainerStyle={styles.flatListContentContainer}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#121212",
        padding: 10,
    },
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 15,
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1,
        paddingHorizontal: 20,
    },
    goBackButton: {
        backgroundColor: "#28a745",
        padding: 10,
        borderRadius: 8,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    addFriendButton: {
        backgroundColor: "#007bff",
        padding: 10,
        borderRadius: 8,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontSize: 16,
    },
    groups: {
        flex: 1,
        marginTop: 80,
    },
    separator: {
        height: 20,
    },
    flatListContentContainer: {
        paddingTop: 0, // Ensures the last items are visible, even if there's a footer
    },
});

export default Index;
