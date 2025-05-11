import {
    View,
    Text,
    Button,
    TouchableWithoutFeedback,
    StyleSheet,
    Dimensions,
    ScrollView,
    StatusBar,
    TouchableOpacity,
    Modal,
    FlatList,
    RefreshControl,
    Image
} from 'react-native';
import React, { useEffect, useState } from "react";
import { db, auth } from "@/firebase"
import {Link, useRouter, } from 'expo-router';
import {collection, addDoc, getDoc, doc, query, orderBy, limit, getDocs, onSnapshot} from 'firebase/firestore';
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import MainPost from "@/components/MainPost";
import Ionicons from '@expo/vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';


const Page = () => {
    const [friends, setFriends] = useState<string[]>([]);
    const [postIds, setPostIds] = useState<string[]>([]);
    const user = auth.currentUser;
    const router = useRouter();
    const [postContents, setPostContents] = useState<{ id: string, content: string, caption: string, userName: string, timestamp:string, pfp: string, mode: string }[] | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [friendNotis, setFriendNotis] = useState<number>(0);
    const [groupNotis, setGroupsNotis] = useState<number>(0);
    const isFocused = useIsFocused();
    const [sheetVisible, setSheetVisible] = useState(false);
    const screenHeight = Dimensions.get('window').height;

    // useEffect(() => {
    //     console.log(friends);
    //     console.log(postIds)
    // }, [postIds]);

    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
                console.log("Snapshot triggered", docSnap.data());
                getNotis(); // your function to update UI
            });

            return () => unsubscribe();
        }
    }, [user]);



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


    const getNotis = async () => {
        if (!user) return;
        const userInfo = await getDoc(doc(db, "users", user.uid));
        if (userInfo.exists()){
            setFriendNotis(userInfo.data().friendRequests.length);
            setGroupsNotis(userInfo.data().groupRequests.length);
        }
    }

    useEffect(() => {
        getNotis()
    }, []);

    useEffect(() => {
        console.log(friendNotis, groupNotis);
    }, [friendNotis, groupNotis]);


    const getTimeAgo = (timestampDate: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - timestampDate.getTime();

        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const weeks = Math.floor(days/ 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (seconds < 60) return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
        if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;
        if (days < 30) return `${weeks} day${weeks !== 1 ? 's' : ''} ago`;
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
                    const mode = postSnap.data().mode;
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





                    return { id: post, content: postSnap.data().content, caption: postSnap.data().caption, userName: userName, timestamp: timestamp, pfp: pfp, mode: mode };
                } else {
                    return { id: post, content: "Content not found", caption: "failed", userName: "failed", timestamp: "failed", pfp: "failed", mode: "failed" };
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
        await getNotis()
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

    // const postPanel = () => {
    //     return (
    //         <View style={styles.postPanelContainer}>
    //             <Text>wassgood</Text>
    //         </View>
    //     )
    // }


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => router.push('/home/practiceFile')} style={styles.titleCardView}>
                        <Text style={styles.titleTextRECAP}>Recap</Text>
                        <Text style={styles.titleTextIT}>It</Text>
                    </TouchableOpacity>
                <TouchableOpacity style={styles.friendRequestButtonContainer} onPress={() => router.push('/(tabs)/home/notifications')}>
                    <Ionicons name="notifications-outline" size={24} color="#D3D3FF" />
                    {friendNotis+groupNotis>0 &&
                        <View style={styles.redCircle}>
                            <Text style={styles.redCircleText}>{friendNotis+groupNotis}</Text>
                        </View>
                    }
                </TouchableOpacity>
            </View>
            <Modal
                visible={sheetVisible}
                animationType="slide"
                transparent={true}                   // <–– make the modal background transparent
                onRequestClose={() => setSheetVisible(false)}
            >
                {/* 1) overlay to catch taps outside the panel */}
                <TouchableWithoutFeedback onPress={() => setSheetVisible(false)}>
                    <View style={styles.overlay} />
                </TouchableWithoutFeedback>

                {/* 2) the actual panel */}
                <View style={[styles.panel, { height: screenHeight * 0.66 }]}>
                    <Text style={styles.panelTitle}>Your Options Here</Text>
                    {/* … your checkboxes, buttons, etc. … */}
                    <TouchableOpacity onPress={() => setSheetVisible(false)}>
                        <Text style={styles.closeText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
            <FlatList
                style={styles.groups}
                data={postContents}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) =>
                    (
                    <View>
                        {/*<View style={styles.topBarPost}>*/}
                        {/*    <View style={styles.leftSideTopBar}>*/}
                        {/*        <View style={styles.pfpBox}>*/}
                        {/*            <View style={styles.avatarContainer}>*/}
                        {/*                {item.pfp? (*/}
                        {/*                    <Image source={{ uri: item.pfp }} style={styles.avatar} />*/}
                        {/*                ) : (*/}
                        {/*                    <View style={[styles.avatar, styles.placeholder]}>*/}
                        {/*                        <Text style={styles.placeholderText}>No Photo</Text>*/}
                        {/*                    </View>*/}
                        {/*                )}*/}
                        {/*            </View>*/}
                        {/*        </View>*/}
                        {/*        <Text style={styles.username}>{item.userName}</Text>*/}
                        {/*    </View>*/}
                        {/*    <TouchableOpacity onPress={() => setSheetVisible(true)}>*/}
                        {/*        <Text style={styles.username}>...</Text>*/}
                        {/*    </TouchableOpacity>*/}
                        {/*</View>*/}
                        <MainPost post={item} />
                    </View>

                    )
            }
                contentContainerStyle={styles.flatListContentContainer}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                keyboardShouldPersistTaps="handled"
                refreshControl={(
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                )}
            />

            {/*<View style={styles.postPanelContainer}>*/}
            {/*    <Text>Your Options Here</Text>*/}
            {/*</View>*/}


        </SafeAreaView>
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
        padding: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: "grey",
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
        flexDirection: 'row',
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
    },
    redCircle: {
        position: 'absolute',
        right: -5,    // move it slightly to the right
        backgroundColor: 'red',
        borderRadius: 10,
        width: 15,
        height: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    redCircleText: {
        fontSize: 10,
        color: "white",
    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',     // invisible—but catches taps
    },
    panel: {
        width: '100%',
        backgroundColor: '#222',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        padding: 16,
    },
    panelTitle: {
        color: '#fff',
        fontSize: 18,
        marginBottom: 12,
    },
    closeText: {
        color: '#D3D3FF',
        marginTop: 20,
        textAlign: 'center',
    },
    leftSideTopBar: {
        flexDirection: "row",
        alignItems: "center",

    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 60,
    },
    pfpBox: {

    },
    username: {
        color: "#D3D3FF",
        paddingHorizontal: 10
    },
    avatarContainer: {
        alignItems: 'center',
        // marginBottom: 20,
    },
    placeholder: {
        backgroundColor: '#444',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: 'white',
    },
    topBarPost: {
        padding: 5,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
})

export default Page;
