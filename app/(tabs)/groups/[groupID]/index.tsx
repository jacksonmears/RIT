import {
    View,
    Text,
    Button,
    StyleSheet,
    FlatList,
    Touchable,
    ScrollView,
    TouchableOpacity,
    Pressable,
    TextInput
} from "react-native";
import {Link, useLocalSearchParams, useRouter} from "expo-router";
import React, { useEffect, useState } from "react";
import {
    doc,
    getDoc,
    getDocs,
    updateDoc,
    arrayUnion,
    collection,
    query,
    orderBy,
    limit,
    setDoc,
    addDoc
} from "firebase/firestore";
import { auth, db } from "@/firebase";
import GroupPost from "@/components/GroupPost"; // Import reusable component
import GroupMessage from "@/components/GroupMessage"; // Import reusable component

import {Checkbox} from "react-native-paper";

const Index = () => {
    // const { id } = useLocalSearchParams(); // Get the dynamic group ID from the URL
    const { groupID } = useLocalSearchParams();
    const groupIDString = String(groupID);
    const router = useRouter();
    const [group, setGroup] = useState(null);
    const user = auth.currentUser;
    const [friends, setFriends] = useState<{ id: string, name: string}[] | null>(null);
    const [posts, setPosts] = useState<{ id: string, message_type: string }[] | null>(null);
    // const [videoContents, setVideoContents] = useState<{ groupID: string, id: string, content: string, caption: string, userName: string }[] | null>(null);
    // const [messageContents, setMessageContents] = useState<{ content: string, userName: string }[] | null>(null);
    const [messageContents, setMessageContents] = useState<{ message_type: string, groupID: string, id: string, content: string, caption: string, userName: string }[] | null>(null);

    const [message, setMessage] = useState("");

    useEffect(() => {
        getPostIds()
    }, [groupIDString]);

    useEffect(() => {
        getPostContent()
    }, [posts]);




    // useEffect(() => {
    //     const fetchGroup = async () => {
    //         try {
    //             const usersDocs = await getDocs(collection(db, "groups", groupIDString, "users"));
    //
    //             const usersList = usersDocs.docs.map((doc) => ({
    //                 id: doc.id, // User's UID is the document ID
    //                 name: doc.data().name, // Assuming "name" is the field in each user document
    //             }));
    //
    //             setFriends(usersList);
    //         } catch (error) {
    //             console.error("Error fetching data:", error);
    //         }
    //     };
    //
    //     fetchGroup();
    // }, []);

    const getPostIds = async () => {
        if (!user) return;

        try {
            const q = query(
                collection(db, "groups", groupIDString, "messages"),
                orderBy("timestamp", "desc"),
                limit(20)
            );

            const querySnapshot = await getDocs(q);

            const postsRef = querySnapshot.docs.map(doc => ({
                id: doc.id,
                message_type: doc.data().message_type,
                // ...doc.data()
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
                if (post.message_type === "text"){
                    const postSnap = await getDoc(doc(db, "groups", groupIDString, "messages", post.id));
                    if (postSnap.exists()) {
                        const userID = postSnap.data().sender_id;
                        const displayName = await getDoc(doc(db, "users", userID));
                        let userName = ''
                        if (displayName.exists()) {
                            userName = displayName.data().displayName;
                        }

                        return { message_type: post.message_type, groupID: groupIDString, id: post.id, content: postSnap.data().content, caption: "null", userName: userName };
                    } else {
                        return { message_type: post.message_type, groupID: groupIDString, id: post.id, content: "Content not found", caption: "failed", userName: "failed" };
                    }
                }
                else {
                    const postRef = doc(db, "posts", post.id);
                    const postSnap = await getDoc(postRef);

                    if (postSnap.exists()) {
                        const userID = postSnap.data().sender_id;
                        const displayName = await getDoc(doc(db, "users", userID));
                        let userName = ''
                        if (displayName.exists()) {
                            userName = displayName.data().displayName;
                        }

                        return { message_type: post.message_type, groupID: groupIDString, id: post.id, content: postSnap.data().content, caption: postSnap.data().caption, userName: userName };
                    } else {
                        return { message_type: post.message_type, groupID: groupIDString, id: post.id, content: "Content not found", caption: "failed", userName: "failed" };
                    }
                }
            }));

            setMessageContents(postContents);
        } catch (error) {
            console.error("Error fetching post content:", error);
        }
    };

    const pushTextMessage = async () => {
        if (!user || message.length < 1) return;
        await addDoc(collection(db, "groups", groupIDString, "messages"), {
            sender_id: user.uid,
            message_type: "text",
            content: message,
            timestamp: new Date().toISOString(),
        });

        setMessage(""); // Clear the input after sending

        await getPostIds(); // Refresh messages
    }

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
                data={messageContents}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={[styles.messageContainer, {alignSelf: user?.displayName === item.userName ? "flex-end" : "flex-start",},]}>
                        {item.message_type === "video" ? (
                        <GroupPost post={item} />
                        ) : (
                        <GroupMessage post={item} />
                        )}
                    </View>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />

            <View style={styles.textBar}>
                <TextInput
                    style={styles.input}
                    placeholder="message"
                    value={message}
                    onChangeText={setMessage}
                    inputMode={"search"}
                />
                <TouchableOpacity onPress={() => pushTextMessage()}>
                    <Text style={styles.text}> send </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#121212",
        paddingBottom: 55
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
        // marginTop: 20,
    },
    separator: {
        height: 20,
    },
    // flatListContentContainer: {
    //     paddingTop: 10, // Ensures the last items are visible, even if there's a footer
    // },
    textBar: {
        flexDirection: "row",
        padding: 20,
        alignItems: "center",
    },
    text: {
        marginRight: 40,
        color: "white",
    },
    input: {
        flex: 1,
        marginLeft: 40,
        borderRadius: 4,
        backgroundColor: "grey",
        padding: 10,
    },
    messageText: {
        color: "red",
    },
    messageContainer: {
        borderRadius: 8,
        padding: 10,
        marginHorizontal: 20,
        maxWidth: "70%",
    }

});

export default Index;
