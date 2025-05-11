import React, {useEffect, useRef, useState} from 'react';
import {
    Dimensions,
    StyleSheet,
    View,
    Text, TouchableOpacity, TouchableWithoutFeedback,
} from 'react-native';
import AccountPost from "@/components/AccountPost";
import {auth, db} from "@/firebase";
import {useRouter} from "expo-router";
import {useIsFocused} from "@react-navigation/native";
import {collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query} from "firebase/firestore";
import MainPost from "@/components/MainPost";
import {AnimatedPost} from "@/components/AnimatedPost";

import { Gesture, GestureDetector, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    withTiming,
    useAnimatedStyle,
    withDecay
} from 'react-native-reanimated';
import Ionicons from "@expo/vector-icons/Ionicons";

const { height, width } = Dimensions.get('window');


export default function CardStack() {
const [friends, setFriends] = useState<string[]>([]);
    const [postIds, setPostIds] = useState<string[]>([]);
    const user = auth.currentUser;
    const router = useRouter();
    const [postContents, setPostContents] = useState<{ id: string, content: string, caption: string, userName: string, timestamp:string, pfp: string, mode: string }[] | []>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [friendNotis, setFriendNotis] = useState<number>(0);
    const [groupNotis, setGroupsNotis] = useState<number>(0);
    const isFocused = useIsFocused();

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
        await fetchFriendIds();
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



    const posts = Array.from({ length: postContents.length }); // Replace with real data later
    const BOX_HEIGHT   = 650;
    const MAX_POSITION = 0;
    const MIN_POSITION = - ( (postContents.length - 1) * BOX_HEIGHT );

    const position   = useSharedValue(0);
    const startY     = useSharedValue(0);

    const panGesture = Gesture.Pan()
        .onStart(() => {
            startY.value = position.value;
        })
        .onUpdate((event) => {
            let newPosition = startY.value + event.translationY;
            // Clamp to screen bounds
            newPosition = Math.max(MIN_POSITION, Math.min(MAX_POSITION, newPosition));
            position.value = newPosition;
        })
        .onEnd((event) => {
            position.value = withDecay({
                velocity: event.velocityY,
                deceleration: 0.997,
                clamp: [MIN_POSITION, MAX_POSITION],
            });
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: position.value }],
    }));

    const renderTopBar = () => (
        <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.titleCardView}>
                <Text style={styles.titleTextRECAP}>FAKE</Text>
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
    )


    return (
        <View style={styles.superContainer}>
            {renderTopBar()}
            <GestureDetector gesture={panGesture} >
                <View >
                    {postContents.map((post, index) => (
                        <AnimatedPost
                            key={post.id}
                            post={post}
                            index={index}
                            scrollY={position}
                            boxHeight={BOX_HEIGHT}
                        />
                    ))}
                </View>
            </GestureDetector>
        </View>
    );



}

const styles = StyleSheet.create({
    superContainer: {
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
});



{/*/!** 1) Invisible ScrollView underneath *!/*/}
{/*<Animated.ScrollView*/}
{/*    style={StyleSheet.absoluteFill}*/}
{/*    contentContainerStyle={{ height: CARD_HEIGHT * NUM_CARDS }}*/}
{/*    onScroll={Animated.event(*/}
{/*        [{ nativeEvent: { contentOffset: { y: scrollY } } }],*/}
{/*        { useNativeDriver: true }*/}
{/*    )}*/}
{/*    scrollEventThrottle={16}*/}
{/*/>*/}

{/*/!** 2) Overlay cards container *!/*/}
{/*<View style={StyleSheet.absoluteFill} pointerEvents="box-none">*/}
{/*    {postContents?.slice(0, NUM_CARDS).map((post, i) => {*/}
{/*        const translateY = scrollY.interpolate({*/}
{/*            inputRange: [0, i * CARD_HEIGHT],*/}
{/*            outputRange: [i * CARD_HEIGHT, 0],*/}
{/*            extrapolate: 'clamp',*/}
{/*        });*/}

{/*        return (*/}
{/*            <GestureHandlerRootView key={post.id}>*/}
{/*                <GestureDetector gesture={panGesture}>*/}
{/*                    <Reanimated.View*/}
{/*                        pointerEvents="box-none" // Don’t catch touches here*/}
{/*                        style={[styles.card, { transform: [{ translateY }] }]}*/}
{/*                    >*/}
{/*                        <View style={StyleSheet.absoluteFill}>*/}
{/*                            <MainPost post={post} />*/}
{/*                        </View>*/}
{/*                    </Reanimated.View>*/}
{/*                </GestureDetector>*/}
{/*            </GestureHandlerRootView>*/}
{/*        );*/}
{/*    })}*/}
{/*</View>*/}
