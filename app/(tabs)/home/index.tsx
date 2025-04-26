import {View, Text, Button, StyleSheet, ScrollView, StatusBar, TouchableOpacity, FlatList} from 'react-native';
import React, { useEffect, useState } from "react";
import { db, auth } from "@/firebase"
import {Link, useRouter} from 'expo-router';
import {collection, addDoc, getDoc, doc, query, orderBy, limit, getDocs} from 'firebase/firestore';
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import MainPost from "@/components/MainPost";

const Page = () => {
    const [friends, setFriends] = useState<string[]>([]);
    const [postIds, setPostIds] = useState<string[]>([]);
    const user = auth.currentUser;
    const router = useRouter();
    const [postContents, setPostContents] = useState<{ id: string, content: string, caption: string, userName: string, timestamp:string, pfp: string, type: string }[] | null>(null);
    const [refreshing, setRefreshing] = useState(false);


    // useEffect(() => {
    //     console.log(friends);
    //     console.log(postIds)
    // }, [postIds]);



    const fetchFriendIds = async () => {
        if (!user) return;

        const friendSnap = await getDocs(collection(db, "users", user.uid, "friends"));
        let friendIds: string[] = [];

        friendSnap.forEach((doc) => {
            friendIds.push(doc.id);
        });
        setFriends(friendIds);
    }

    const fetchPosts = async () => {
        if (!user) return;
        const postIds: string[] = [];

        for (const friendId of friends) {
            const q = query(
                collection(db, "users", friendId, "posts"),
                orderBy("timestamp", "desc"),
                limit(1)
            );

            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                postIds.push(snapshot.docs[0].id);
            }
        }
        setPostIds(postIds);
    };


    const getTimeAgo = (timestampDate: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - timestampDate.getTime();

        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
        if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
        return `${years} year${years !== 1 ? 's' : ''} ago`;
    };




    const fetchPostContent = async () => {
        if (!postIds || !user) return;

        try {
            const postContents = await Promise.all(postIds.map(async (post) => {
                const postRef = doc(db, "posts", post);
                const postSnap = await getDoc(postRef);

                if (postSnap.exists()) {
                    const userID = postSnap.data().sender_id;
                    const type = postSnap.data().type;
                    const userInfo = await getDoc(doc(db, "users", userID));
                    let userName = ''
                    let pfp = ''
                    if (userInfo.exists()) {
                        userName = userInfo.data().displayName;
                        pfp = userInfo.data().photoURL;
                    }



                    // let timestamp = postSnap.data().timestamp.toDate().toDateString();

                    let timestamp = "Unknown date";

                    const rawTimestamp = postSnap.data().timestamp;
                    if (rawTimestamp && typeof rawTimestamp.toDate === "function") {
                        try {
                            const dateObj = rawTimestamp.toDate();
                            timestamp = getTimeAgo(dateObj);
                        } catch (error) {
                            console.error("Error converting timestamp:", error);
                        }
                    } else {
                        console.warn("Timestamp missing or invalid for post:", postSnap.id, rawTimestamp);
                    }

                    console.log("Raw timestamp:", postSnap.data().timestamp);





                    return { id: post, content: postSnap.data().content, caption: postSnap.data().caption, userName: userName, timestamp: timestamp, pfp: pfp, type: type };
                } else {
                    return { id: post, content: "Content not found", caption: "failed", userName: "failed", timestamp: "failed", pfp: "failed", type: "failed" };
                }
            }));

            setPostContents(postContents);
        } catch (error) {
            console.error("Error fetching post content:", error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchFriendIds(); // this will automatically trigger fetchPosts → fetchPostContent via useEffect
        setRefreshing(false);
    };


    useEffect(() => {
        fetchFriendIds();
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [friends]);

    useEffect(() => {
        fetchPostContent();
    }, [postIds]);


    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <View style={styles.titleCardView}>
                    <Text style={styles.titleTextRECAP}>Recap</Text>
                    <Text style={styles.titleTextIT}>It</Text>
                </View>
                <TouchableOpacity style={styles.friendRequestButtonContainer} onPress={() => router.push('/(tabs)/home/friendRequests')}>
                    <Text style={styles.friendRequestText}>friend</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                style={styles.groups}
                data={postContents}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <MainPost post={item} />}
                contentContainerStyle={styles.flatListContentContainer}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                keyboardShouldPersistTaps="handled"
                refreshing={refreshing}              // 👈 NEW
                onRefresh={onRefresh}                // 👈 NEW
            />

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        padding: 5
    },
    titleTextRECAP: {
        color: 'white',
        fontWeight: 'bold',
    },
    titleTextIT: {
        color: '#D3D3FF',
        fontWeight: 'bold',
    },
    friendRequestButtonContainer: {

    },
    friendRequestText: {
        color: 'white'
    },
    groups: {
        flex: 1,
    },
    separator: {
        height: 20,
    },
    flatListContentContainer: {
        paddingTop: 10,
        paddingBottom: 100, // or however much is needed to fully see bottom captions
    },
    titleCardView: {
        flexDirection: 'row',
    }

})

export default Page;
