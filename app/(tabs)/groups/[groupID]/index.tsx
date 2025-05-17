import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Dimensions,
} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import React, { useEffect, useState } from "react";
import {
    doc,
    getDoc,
    getDocs,
    collection,
    query,
    orderBy,
    limit,
    addDoc, serverTimestamp, onSnapshot, startAfter, Timestamp
} from "firebase/firestore";
import { auth, db } from "@/firebase";
import GroupPost from "@/components/GroupPost";
import GroupMessage from "@/components/GroupMessage";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AntDesign from '@expo/vector-icons/AntDesign';
import type { DocumentData } from "firebase/firestore";
// import DocumentData = firebase.firestore.DocumentData;

const { width, height } = Dimensions.get("window");

type PostType = {
    id: string;
    mode: string;
}

type MessageType = {
    groupID: string;
    id: string;
    content: string;
    caption: string;
    userName: string;
    pfp: string;
    mode: string;
    firstName: string;
    lastName: string;
    timestamp: Timestamp;
}


const Index = () => {
    const { groupID, groupName } = useLocalSearchParams();
    const groupIDString = String(groupID);
    const groupNameString = String(groupName);
    const router = useRouter();
    const user = auth.currentUser;
    const [posts, setPosts] = useState<PostType[] | []>([]);
    const [messageContents, setMessageContents] = useState<MessageType[] | []>([]);
    const [message, setMessage] = useState("");
    const [loadingMore, setLoadingMore] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "groups", groupIDString, "messages"), async () => {
            await getPostIds();
        });

        return () => {
            unsubscribe();
        };
    }, [groupIDString]);


    useEffect(() => {
        getPostContent().catch((err) => {
            console.error(err);
        })
    }, [posts]);



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
                mode: doc.data().mode,
            }));
            setPosts(postsRef);

        } catch (error) {
            console.error("Error retrieving posts:", error);
        }
    };

    const getMorePosts = async () => {
        if (!messageContents || loadingMore) return;
        const lastVisible = messageContents[messageContents.length - 1];
        if (!lastVisible) return;

        try {
            setLoadingMore(true);
            const nextQuery = query(
                collection(db, "groups", groupIDString, "messages"),
                orderBy("timestamp", "desc"),
                startAfter(lastVisible.timestamp),
                limit(20)
            );
            const querySnapshot = await getDocs(nextQuery);
            const postsRef = querySnapshot.docs.map(doc => ({
                id: doc.id,
                mode: doc.data().mode,
            }));

            setPosts(prevPosts => {
                const safePrevPosts = prevPosts ?? [];
                return [...safePrevPosts, ...postsRef];
            });
            setLoadingMore(false);
        } catch (error) {
            console.error("Error retrieving extra posts:", error);
        }

    };


    const getMessage = async (post: PostType, postSnap: DocumentData) => {
        try {
            const userID = postSnap.data().sender_id;
            const friendDoc = await getDoc(doc(db, "users", userID));
            if (!friendDoc.exists()) return;

            return { groupID: groupIDString, id: post.id, content: postSnap.data().content, caption: postSnap.data().caption, userName: friendDoc.data().displayName, pfp: friendDoc.data().photoURL, mode: postSnap.data().mode, firstName: friendDoc.data().firstName, lastName: friendDoc.data().lastName, timestamp: postSnap.data().timestamp };
        } catch (error) {
            console.error(error);
        }

    }


    const getPostContent = async () => {
        if (!posts) return;

        try {
            const raw = await Promise.all(posts.map(async (post) => {
                const postSnap = (post.mode === "text") ? await getDoc(doc(db, "groups", groupIDString, "messages", post.id)) : await getDoc(doc(db, "posts", post.id));
                if (!postSnap.exists()) return;

                return await getMessage(post, postSnap);

            }));
            const validPosts = raw.filter((m): m is MessageType => m !== null);

            setMessageContents(validPosts);
        } catch (error) {
            console.error("Error fetching post content:", error);
        }
    };


    const pushTextMessage = async () => {
        if (!user || message.length < 1) return;

        try {
            await addDoc(collection(db, "groups", groupIDString, "messages"), {
                sender_id: user.uid,
                mode: "text",
                content: message,
                timestamp: serverTimestamp(),
            });
            setMessage("");
        } catch (error) {
            console.error(error);
        }
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
                <TouchableOpacity onPress={() => router.push({pathname: "/groups/[groupID]/addFriends", params: {groupID: groupIDString, groupName: groupNameString}})}>
                    <AntDesign name="adduser" size={18} color="#D3D3FF" />
                </TouchableOpacity>
            </View>

            {user &&
                <FlatList
                    inverted
                    style={styles.groups}
                    data={messageContents}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View
                            style={[styles.messageContainer, {alignSelf: user.displayName === item.userName ? "flex-end" : "flex-start",},]}>
                            {item.mode !== "text" ? (
                                <GroupPost post={item}/>
                            ) : (
                                <GroupMessage post={item}/>
                            )}
                        </View>
                    )}
                    onEndReached={getMorePosts}
                    onEndReachedThreshold={0.00001}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            }


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
        paddingBottom: height/20
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: width/20,
        paddingVertical: height/90,
        borderBottomWidth: height/1000,
        borderBottomColor: "grey",
    },
    topBarText: {
        color: "#D3D3FF",
    },
    backArrowName: {
        flexDirection: 'row',
        alignItems: "center",
    },
    goBackButton: {
        backgroundColor: "#28a745",
        padding: height/100,
        borderRadius: height/100,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    groups: {
        flex: 1,
    },
    messageContainer: {
        borderRadius: height/100,
        maxWidth: width*0.7,
    },
    textBar: {
        flexDirection: "row",
        padding: height/40,
        alignItems: "center",
    },
    text: {
        marginRight: width/10,
        color: "white",
    },
    input: {
        flex: 1,
        marginLeft: width/10,
        borderRadius: width/100,
        backgroundColor: "grey",
        padding: height/100,
    },
    separator: {
        height: height/33,
    },


});

export default Index;
