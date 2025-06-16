import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Dimensions,
    ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "@/firebase";
import GroupPost from "@/components/GroupPost";
import GroupMessage from "@/components/GroupMessage";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import firestore from '@react-native-firebase/firestore';

const { width, height } = Dimensions.get("window");

type PostType = {
    groupID: string;
    id: string;
    mode: string;
    content: string;
    caption: string;
    sender_id: string;
    timestamp: FirebaseFirestoreTypes.Timestamp;
    thumbnail: string;
};

type groupMemberInformation = {
    firstName: string;
    lastName: string;
    photoURL: string;
    displayName: string;
}

const Index = () => {
    const { groupID, groupName } = useLocalSearchParams();
    const groupIDString = String(groupID);
    const groupNameString = String(groupName);
    const router = useRouter();
    const user = auth().currentUser;
    const [posts, setPosts] = useState<PostType[]>([]);
    const [groupMemberCache, setGroupMemberCache] = useState<Record<string, groupMemberInformation>>({});
    const [message, setMessage] = useState("");
    const [loadingMore, setLoadingMore] = useState(false);
    const [membersLoading, setMembersLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);

    // New state to track total messages count in Firestore
    const [totalMessageCount, setTotalMessageCount] = useState<number | null>(null);

    // Keep track of last visible doc for pagination
    const lastVisibleRef = useRef<FirebaseFirestoreTypes.Timestamp | null>(null);

    // Flag to avoid double loading on real-time updates
    const isInitialLoadRef = useRef(true);

    // Fetch total message count when groupID changes
    const fetchTotalMessageCount = async () => {
        try {
            const countSnapshot = await db()
                .collection("groups")
                .doc(groupIDString)
                .collection("messages")
                .count()
                .get();

            setTotalMessageCount(countSnapshot.data().count);
        } catch (error) {
            console.error("Failed to fetch total message count:", error);
        }
    };

    useEffect(() => {
        const fetchGroupMembers = async () => {
            try {
                const membersSnapshot = await db()
                    .collection("groups")
                    .doc(groupIDString)
                    .collection("users")
                    .get();

                const memberIDs = membersSnapshot.docs.map(doc => doc.id);

                const userPromises = memberIDs.map(async (id) => {
                    const userDoc = await db().collection("users").doc(id).get();
                    const data = userDoc.data();
                    if (!data) return null;
                    return {
                        id,
                        userInfo: {
                            firstName: data.firstName,
                            lastName: data.lastName,
                            photoURL: data.photoURL,
                            displayName: data.displayName,
                        },
                    };
                });

                const users = await Promise.all(userPromises);
                const userMap: Record<string, groupMemberInformation> = {};
                users.forEach((entry) => {
                    if (entry) userMap[entry.id] = entry.userInfo;
                });

                setGroupMemberCache(userMap);
                setMembersLoading(false);

            } catch (error) {
                console.error("Error loading group members:", error);
            }
        };

        fetchGroupMembers();
    }, [groupIDString]);

    useEffect(() => {
        if (!user) return;

        // Fetch total count on mount or group change
        fetchTotalMessageCount();

        // Listen for new messages in real-time (newer than the newest in posts)
        const unsubscribe = db()
            .collection("groups")
            .doc(groupIDString)
            .collection("messages")
            .orderBy("timestamp", "desc")
            .limit(20)
            .onSnapshot((snapshot) => {
                if (snapshot.empty) {
                    // No messages in group
                    setPosts([]);
                    setHasMoreMessages(false);
                    setInitialLoad(false);
                    setTotalMessageCount(0);
                    return;
                }

                const docs = snapshot.docs;
                const fetchedPosts = docs.map(doc => ({
                    groupID: groupIDString,
                    id: doc.id,
                    mode: doc.data().mode,
                    content: doc.data().content,
                    caption: doc.data().caption,
                    sender_id: doc.data().sender_id,
                    timestamp: doc.data().timestamp,
                    thumbnail: doc.data().thumbnail,
                }));

                // Set lastVisible for pagination to the last doc's timestamp
                lastVisibleRef.current = docs[docs.length - 1].data().timestamp;

                if (isInitialLoadRef.current) {
                    // Initial load: set posts
                    setPosts(fetchedPosts);
                    setInitialLoad(false);
                    isInitialLoadRef.current = false;
                    setHasMoreMessages(docs.length >= 20);

                    // If fewer than 20 posts fetched, update totalMessageCount to match
                    if (docs.length < 20) {
                        setTotalMessageCount(docs.length);
                        setHasMoreMessages(false);
                    }
                } else {
                    // Subsequent updates - new messages that are newer than existing posts
                    setPosts(prevPosts => {
                        // Filter out duplicates (messages already in prevPosts)
                        const existingIds = new Set(prevPosts.map(p => p.id));
                        const newMessages = fetchedPosts.filter(p => !existingIds.has(p.id));
                        if (newMessages.length === 0) return prevPosts;

                        // Insert new messages at the front since list is inverted
                        return [...newMessages, ...prevPosts];
                    });

                    // Increment total count by number of new messages received
                    setTotalMessageCount(prevCount =>
                        prevCount !== null ? prevCount + fetchedPosts.length : null
                    );
                }
            });

        return () => {
            unsubscribe();
            isInitialLoadRef.current = true;
            lastVisibleRef.current = null;
        };
    }, [groupIDString, user]);

    const getMorePosts = async () => {
        if (
            !posts.length ||
            loadingMore ||
            !hasMoreMessages ||
            !lastVisibleRef.current ||
            (totalMessageCount !== null && posts.length >= totalMessageCount)
        ) return;

        try {
            setLoadingMore(true);
            setShowLoadingIndicator(true);

            const snapshot = await db()
                .collection("groups")
                .doc(groupIDString)
                .collection("messages")
                .orderBy("timestamp", "desc")
                .startAfter(lastVisibleRef.current)
                .limit(20)
                .get();

            if (snapshot.empty) {
                setHasMoreMessages(false);
            } else {
                const newPosts = snapshot.docs.map(doc => ({
                    groupID: groupIDString,
                    id: doc.id,
                    mode: doc.data().mode,
                    content: doc.data().content,
                    caption: doc.data().caption,
                    sender_id: doc.data().sender_id,
                    timestamp: doc.data().timestamp,
                    thumbnail: doc.data().thumbnail,
                }));

                // Update lastVisible for next pagination
                lastVisibleRef.current = snapshot.docs[snapshot.docs.length - 1].data().timestamp;

                // Append older posts at the end of the list
                setPosts(prev => [...prev, ...newPosts]);

                // If fewer than limit, no more messages
                if (snapshot.docs.length < 20) setHasMoreMessages(false);
            }
        } catch (error) {
            console.error("Error retrieving more posts:", error);
        } finally {
            setLoadingMore(false);
            setTimeout(() => setShowLoadingIndicator(false), 1000);
        }
    };

    const pushTextMessage = async () => {
        if (!user || message.trim().length === 0) return;

        try {
            await db()
                .collection("groups")
                .doc(groupIDString)
                .collection("messages")
                .add({
                    sender_id: user.uid,
                    mode: "text",
                    content: message.trim(),
                    timestamp: firestore.FieldValue.serverTimestamp(),
                    caption: -1,
                    thumbnail:-1
                });

            setMessage("");
        } catch (error) {
            console.error(error);
        }
    };

    // Remove deleted post from state and decrement totalMessageCount
    const handleDelete = (deletedPostId: string) => {
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== deletedPostId));
        setTotalMessageCount((prevCount) =>
            prevCount !== null ? prevCount - 1 : null
        );
    };

    if (membersLoading || initialLoad) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#D3D3FF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <View style={styles.backArrowName}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <MaterialIcons name="arrow-back-ios-new" size={18} color="#D3D3FF" />
                    </TouchableOpacity>
                    <Text style={styles.topBarText}>{groupNameString}</Text>
                </View>
                <TouchableOpacity
                    onPress={() =>
                        router.push({
                            pathname: "/groups/[groupID]/addFriends",
                            params: { groupID: groupIDString, groupName: groupNameString },
                        })
                    }>
                    <AntDesign name="adduser" size={18} color="#D3D3FF" />
                </TouchableOpacity>
            </View>

            {showLoadingIndicator && (
                <Text style={{ color: "white", textAlign: "center", margin: 10 }}>
                    Loading previous messages...
                </Text>
            )}

            <FlatList
                inverted
                style={styles.groups}
                data={posts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View
                        style={[
                            styles.messageContainer,
                            {
                                alignSelf:
                                    user?.uid === item.sender_id
                                        ? "flex-end"
                                        : "flex-start",
                            },
                        ]}>
                        {item.mode !== "text" ? (
                            <GroupPost post={item} groupMember={groupMemberCache[item.sender_id]} />
                        ) : (
                            <GroupMessage
                                post={item}
                                groupMember={groupMemberCache[item.sender_id]}
                                onDelete={handleDelete} // pass down here
                            />
                        )}
                    </View>
                )}
                onEndReached={getMorePosts}
                onEndReachedThreshold={0.1}
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
                <TouchableOpacity onPress={pushTextMessage}>
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
        paddingBottom: height / 20,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: width / 20,
        borderBottomWidth: height / 1000,
        borderBottomColor: "grey",
        alignItems: 'center',
        height: height / 20
    },
    topBarText: {
        color: "#D3D3FF",
    },
    backArrowName: {
        flexDirection: "row",
        alignItems: "center",
    },
    groups: {
        flex: 1,
    },
    messageContainer: {
        borderRadius: height / 100,
        maxWidth: width * 0.7,
    },
    textBar: {
        flexDirection: "row",
        padding: height / 40,
        alignItems: "center",
    },
    text: {
        marginRight: width / 10,
        color: "white",
    },
    input: {
        flex: 1,
        marginLeft: width / 10,
        borderRadius: width / 100,
        backgroundColor: "grey",
        padding: height / 100,
    },
    separator: {
        height: height / 33,
    },
});

export default Index;
