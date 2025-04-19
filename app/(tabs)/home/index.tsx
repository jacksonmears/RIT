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
    const [postContents, setPostContents] = useState<{ id: string, content: string, caption: string, userName: string }[] | null>(null);


    useEffect(() => {
        console.log(postIds)
    }, [postIds]);


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


    const fetchPostContent = async () => {
        if (!postIds || !user) return;

        try {
            const postContents = await Promise.all(postIds.map(async (post) => {
                const postRef = doc(db, "posts", post);
                const postSnap = await getDoc(postRef);

                if (postSnap.exists()) {
                    const userID = postSnap.data().sender_id;
                    const displayName = await getDoc(doc(db, "users", userID));
                    let userName = ''
                    if (displayName.exists()) {
                        userName = displayName.data().displayName;
                    }

                    return { id: post, content: postSnap.data().content, caption: postSnap.data().caption, userName: userName };
                } else {
                    return { id: post, content: "Content not found", caption: "failed", userName: "failed" };
                }
            }));

            setPostContents(postContents);
        } catch (error) {
            console.error("Error fetching post content:", error);
        }
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
                <Text style={styles.titleText}>Recap It</Text>
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
        // backgroundColor: '#222222',
        padding: 5
    },
    titleText: {
        color: 'gold',
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
        paddingTop: 0,
        paddingBottom: 100, // or however much is needed to fully see bottom captions
    },


})

export default Page;
