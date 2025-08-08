import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Dimensions,
    ActivityIndicator,
    KeyboardAvoidingView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { auth, db } from "@/firebase";
import GroupPost from "@/components/GroupPost";
import GroupMessage from "@/components/GroupMessage";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import firestore from '@react-native-firebase/firestore';

const { width, height } = Dimensions.get("window");

type PostType = {
    id: string;
    content: string;
    caption: string;
    mode: string;
    userID: string;
    displayName: string;
    pfp: string;
    timestamp: FirebaseFirestoreTypes.Timestamp;
};

type groupMemberInformation = {
    firstName: string;
    lastName: string;
    pfp: string;
    displayName: string;
};

const Index = () => {
    const { groupID, groupName } = useLocalSearchParams();
    const groupIDString = String(groupID);
    const groupNameString = String(groupName);
    const router = useRouter();
    const user = auth().currentUser;
    const [posts, setPosts] = useState<PostType[]>([]);
    const [groupMemberCache, setGroupMemberCache] = useState<Record<string, groupMemberInformation>>({});
    const [cacheReady, setCacheReady] = useState(false);  // NEW: to track cache readiness
    const [message, setMessage] = useState("");
    const [loadingMore, setLoadingMore] = useState(false);
    const [membersLoading, setMembersLoading] = useState(true);
    const [initialLoad, setInitialLoad] = useState(true);
    const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [totalMessageCount, setTotalMessageCount] = useState<number | null>(null);

    const lastVisibleRef = useRef<FirebaseFirestoreTypes.Timestamp | null>(null);
    const isInitialLoadRef = useRef(true);

    const fetchTotalMessageCount = useCallback(async () => {
        if (!groupIDString) return;
        try {
            const countSnapshot = await db
                .collection("groups")
                .doc(groupIDString)
                .collection("messages")
                .count()
                .get();

            setTotalMessageCount(countSnapshot.data().count);
        } catch (error) {
            console.error("Failed to fetch total message count:", error);
        }
    }, [groupIDString]);

    useEffect(() => {
        const fetchGroupMembers = async () => {
            try {
                setCacheReady(false);
                setMembersLoading(true);

                const membersReferences = await db
                    .collection("groups")
                    .doc(groupIDString)
                    .collection("users")
                    .get();

                const memberIDs = membersReferences.docs.map(doc => doc.id);

                const userPromises = memberIDs.map(async (id) => {
                    const userDoc = await db
                        .collection("users")
                        .doc(id)
                        .get();

                    const data = userDoc.data();
                    if (!data) return null;
                    return {
                        id,
                        userInfo: {
                            firstName: data.firstName,
                            lastName: data.lastName,
                            pfp: data.photoURL,
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
                setCacheReady(true);
            } catch (error) {
                console.error("Error loading group members:", error);
                setMembersLoading(false);
                setCacheReady(false);
            }
        };

        fetchGroupMembers().catch(err => console.error(err));
    }, [groupIDString]);

    useEffect(() => {
        if (!user || !cacheReady) return;

        fetchTotalMessageCount().catch(err => console.error("Failed to fetch total message count:", err));

        const unsubscribe = db
            .collection("groups")
            .doc(groupIDString)
            .collection("messages")
            .orderBy("timestamp", "desc")
            .limit(20)
            .onSnapshot((snapshot) => {
                if (snapshot.empty) {
                    setPosts([]);
                    setHasMoreMessages(false);
                    setInitialLoad(false);
                    setTotalMessageCount(0);
                    return;
                }

                const documentReferences = snapshot.docs;
                const fetchedPosts = documentReferences.map(doc => {
                    const senderID = doc.data().sender_id;
                    return {
                        id: doc.id,
                        content: doc.data().content,
                        caption: doc.data().caption,
                        mode: doc.data().mode,
                        userID: senderID,
                        displayName: groupMemberCache[senderID]?.displayName ?? "Unknown",
                        pfp: groupMemberCache[senderID]?.pfp ?? "",
                        timestamp: doc.data().timestamp,
                    };
                });

                lastVisibleRef.current = documentReferences[documentReferences.length - 1].data().timestamp;

                if (isInitialLoadRef.current) {
                    setPosts(fetchedPosts);
                    setInitialLoad(false);
                    isInitialLoadRef.current = false;
                    setHasMoreMessages(documentReferences.length >= 20);

                    if (documentReferences.length < 20) {
                        setTotalMessageCount(documentReferences.length);
                        setHasMoreMessages(false);
                    }
                } else {
                    setPosts(prevPosts => {
                        const allPosts = [...fetchedPosts, ...prevPosts];
                        const seen = new Set();
                        const deduped: PostType[] = [];

                        for (const post of allPosts) {
                            if (!seen.has(post.id)) {
                                seen.add(post.id);
                                deduped.push(post);
                            }
                        }

                        return deduped;
                    });

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
    }, [groupIDString, user, cacheReady]);

    const fetchMorePosts = async () => {
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

            const snapshot = await db
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
                const newPosts = snapshot.docs.map(doc => {
                    const senderID = doc.data().sender_id;
                    return {
                        id: doc.id,
                        content: doc.data().content,
                        caption: doc.data().caption,
                        mode: doc.data().mode,
                        userID: senderID,
                        displayName: groupMemberCache[senderID]?.displayName ?? "Unknown",
                        pfp: groupMemberCache[senderID]?.pfp ?? "",
                        timestamp: doc.data().timestamp,
                    };
                });

                lastVisibleRef.current = snapshot.docs[snapshot.docs.length - 1].data().timestamp;

                setPosts(prev => {
                    const allPosts = [...prev, ...newPosts];
                    const seen = new Set();
                    const deduped: PostType[] = [];

                    for (const post of allPosts) {
                        if (!seen.has(post.id)) {
                            seen.add(post.id);
                            deduped.push(post);
                        }
                    }

                    return deduped;
                });

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
            await db
                .collection("groups")
                .doc(groupIDString)
                .collection("messages")
                .add({
                    sender_id: user.uid,
                    mode: "text",
                    content: message.trim(),
                    timestamp: firestore.FieldValue.serverTimestamp(),
                    caption: -1,
                    thumbnail: -1,
                });

            setMessage("");
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeletePost = (deletedPostID: string) => {
        setPosts(prev => prev.filter(p => p.id !== deletedPostID));
        setTotalMessageCount(prevCount =>
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
                        <MaterialIcons name="arrow-back-ios-new" size={height/40} color="#D3D3FF" />
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
                    <AntDesign name="adduser" size={height/35} color="#D3D3FF" />
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
                keyExtractor={(item) => `${item.id}-${item.timestamp?.seconds ?? Math.random()}`}
                renderItem={({ item }) => (
                    <View
                        style={[
                            styles.messageContainer,
                            {
                                alignSelf:
                                    user?.uid === item.userID ? "flex-end" : "flex-start",
                            },
                        ]}>
                        {item.mode !== "text" ? (
                            <GroupPost post={item} groupMember={groupMemberCache[item.userID]} />
                        ) : (
                            <GroupMessage
                                post={item}
                                groupMember={groupMemberCache[item.userID]}
                                onDelete={handleDeletePost}
                            />
                        )}
                    </View>
                )}
                onEndReached={fetchMorePosts}
                onEndReachedThreshold={0.1}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
            />

            <KeyboardAvoidingView style={styles.textBar}>
                <TextInput
                    style={styles.input}
                    placeholder="message"
                    value={message}
                    onChangeText={setMessage}
                    inputMode={"search"}
                    placeholderTextColor={"black"}
                />
                <TouchableOpacity onPress={pushTextMessage}>
                    <Text style={styles.text}> send </Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
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
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: width / 20,
        borderBottomWidth: height / 1000,
        borderBottomColor: "grey",
        alignItems: "center",
        height: height / 18,
    },
    topBarText: {
        color: "#D3D3FF",
        fontSize: height / 50,
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
        marginLeft: width / 50,
    },
    input: {
        flex: 1,
        marginLeft: width / 10,
        borderRadius: width / 100,
        backgroundColor: "grey",
        padding: height / 100,
        color: "black",
        fontSize: height * 0.02,
    },
    separator: {
        height: height / 33,
    },
});

export default Index;
