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
    addDoc, serverTimestamp
} from "firebase/firestore";
import { auth, db } from "@/firebase";
import GroupPost from "@/components/GroupPost"; // Import reusable component
import GroupMessage from "@/components/GroupMessage"; // Import reusable component
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AntDesign from '@expo/vector-icons/AntDesign';

import {Checkbox} from "react-native-paper";

const Index = () => {
    // const { id } = useLocalSearchParams(); // Get the dynamic group ID from the URL
    const { groupID, groupName } = useLocalSearchParams();
    const groupIDString = String(groupID);
    const groupNameString = String(groupName);
    const router = useRouter();
    const user = auth.currentUser;
    const [posts, setPosts] = useState<{ id: string, type: string }[] | null>(null);
    const [messageContents, setMessageContents] = useState<{ groupID: string, id: string, content: string, caption: string, userName: string, pfp: string, type: string, firstName: string, lastName: string }[] | null>(null);
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
                type: doc.data().type,
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
                if (post.type === "text"){
                    const postSnap = await getDoc(doc(db, "groups", groupIDString, "messages", post.id));
                    if (postSnap.exists()) {
                        const userID = postSnap.data().sender_id;
                        const content = postSnap.data().content;
                        const type = postSnap.data().type;
                        const friendDoc = await getDoc(doc(db, "users", userID));
                        let userName = ''
                        let pfp = ''
                        let firstName = ''
                        let lastName = ''
                        if (friendDoc.exists()) {
                            userName = friendDoc.data().displayName;
                            pfp = friendDoc.data().photoURL;
                            firstName = friendDoc.data().firstName;
                            lastName = friendDoc.data().lastName;
                        }

                        // let timestamp = "Unknown date";
                        //
                        // const rawTimestamp = postSnap.data().timestamp;
                        // if (rawTimestamp && typeof rawTimestamp.toDate === "function") {
                        //     try {
                        //         const dateObj = rawTimestamp.toDate();
                        //         timestamp = dateObj.toDate();
                        //     } catch (error) {
                        //         console.error("Error converting timestamp:", error);
                        //     }
                        // } else {
                        //     console.warn("Timestamp missing or invalid for post:", postSnap.id, rawTimestamp);
                        // }

                        return { groupID: groupIDString, id: post.id, content: content, caption: "null", userName: userName, pfp: pfp, type: type, firstName: firstName, lastName: lastName };
                    } else {
                        return { groupID: groupIDString, id: post.id, content: "Content not found", caption: "failed", userName: "failed", pfp: "failed", type: "failed", firstName: '', lastName: '' };
                    }
                }
                else {
                    const postRef = doc(db, "posts", post.id);
                    const postSnap = await getDoc(postRef);

                    if (postSnap.exists()) {
                        const userID = postSnap.data().sender_id;
                        const type = postSnap.data().type;
                        const content = postSnap.data().content;
                        const friendDoc = await getDoc(doc(db, "users", userID));
                        let userName = ''
                        let pfp = ''
                        let firstName = ''
                        let lastName = ''
                        if (friendDoc.exists()) {
                            userName = friendDoc.data().displayName;
                            pfp = friendDoc.data().photoURL;
                            firstName = friendDoc.data().firstName;
                            lastName = friendDoc.data().lastName;
                        }

                        return { groupID: groupIDString, id: post.id, content: content, caption: postSnap.data().caption, userName: userName, pfp: pfp, type: type, firstName: firstName, lastName: lastName };
                    } else {
                        return { groupID: groupIDString, id: post.id, content: "Content not found", caption: "failed", userName: "failed", pfp: "failed", type: "failed", firstName: '', lastName: '' };
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
            type: "text",
            content: message,
            timestamp: serverTimestamp(),
        });

        setMessage(""); // Clear the input after sending

        await getPostIds(); // Refresh messages
    }

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                {/*<TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>*/}
                {/*    <Text style={styles.buttonText}>Go Back</Text>*/}
                {/*</TouchableOpacity>*/}

                {/*<TouchableOpacity style={styles.addFriendButton} onPress={() => router.push(`/groups/${groupID}/addFriends`)}>*/}
                {/*    <Text style={styles.buttonText}>Add Friend</Text>*/}
                {/*</TouchableOpacity>*/}
                <View style={styles.backArrowName}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <MaterialIcons name="arrow-back-ios-new" size={18} color="#D3D3FF" />
                    </TouchableOpacity>
                    <Text style={styles.topBarText}>{groupNameString}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push({pathname: "/groups/[groupID]/addFriends", params: {groupID: groupIDString, groupName: groupNameString}})}>
                    <AntDesign name="adduser" size={18} color="#D3D3FF" />
                </TouchableOpacity>
            </View>

            <FlatList
                inverted
                style={styles.groups}
                data={messageContents}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={[styles.messageContainer, {alignSelf: user?.displayName === item.userName ? "flex-end" : "flex-start",},]}>
                        {item.type !== "text" ? (
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
        // padding: 10,
        // marginHorizontal: 20,
        maxWidth: "70%",
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        padding: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: "grey",
    },
    topBarText: {
        color: "#D3D3FF",
    },
    backArrowName: {
        flexDirection: 'row',
        alignItems: "center",
    }

});

export default Index;
