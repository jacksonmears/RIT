import React, {useEffect, useState} from 'react';
import {
    Dimensions,
    StyleSheet,
    View,
    Text, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import {auth, db} from "@/firebase";
import {useRouter} from "expo-router";
import {collection, doc, getDoc, getDocs, limit, onSnapshot, orderBy, query} from "firebase/firestore";
import {AnimatedPost} from "@/components/AnimatedPost";
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withDecay, runOnJS
} from 'react-native-reanimated';
import Ionicons from "@expo/vector-icons/Ionicons";

const { height, width } = Dimensions.get('window');
type PostType = {
    id: string;
    content: string;
    caption: string;
    userName: string;
    timestamp: string;
    pfp: string;
    mode: string;
};


const Page = () => {
    const [friends, setFriends] = useState<string[]>([]);
    const [postIds, setPostIds] = useState<string[]>([]);
    const user = auth().currentUser;
    const router = useRouter();
    const [postContents, setPostContents] = useState<PostType[] | []>([]);
    const [friendNotifications, setFriendNotifications] = useState<number>(0);
    const [groupNotifications, setGroupsNotifications] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isRefreshingPosts, setIsRefreshingPosts] = useState<boolean>(false);
    const pullDownOffset = useSharedValue(0);
    const isRefreshing = useSharedValue(false);
    const REFRESH_TRIGGER_HEIGHT = 100;
    const MAX_PULL_DOWN_HEIGHT = 101;
    const BOX_HEIGHT   = 650;
    const MAX_POSITION = 0;
    const MIN_POSITION = - ((postContents.length - 1) * BOX_HEIGHT );
    const position   = useSharedValue(0);
    const startY     = useSharedValue(0);


    useEffect(() => {
        if (user && user.uid) {
            const snapshot = onSnapshot(doc(db, "users", user.uid), () => {
                getNotifications().catch((err) => {
                    console.error("Error fetching notifications:", err);
                });
            });
            return () => snapshot();
        }
    }, [user]);

    useEffect(() => {
        fetchFriendIds().catch((err) => {
            console.error("Error fetching friendIds:", err);
        });
    }, []);

    useEffect(() => {
        fetchPosts().catch((err) => {
            console.error("Error fetching posts:", err);
        });
    }, [friends]);

    useEffect(() => {
        fetchPostContent().catch((err) => {
            console.error("Error fetching postContent:", err);
        });
    }, [postIds]);


    useEffect(() => {
        getNotifications().catch((err) => {
            console.error("Error fetching notifications:", err);
        });
    }, []);



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


    const fetchFriendIds = async () => {
        if (!user) return;

        try {
            const friendSnap = await getDocs(collection(db, "users", user.uid, "friends"));
            let friendIds: string[] = [];

            friendSnap.forEach((doc) => {
                friendIds.push(doc.id);
            });
            setFriends(friendIds);
        } catch (err) {
            console.error(err);
        }
    }

    const fetchPosts = async () => {
        if (!user) return;
        const postIds: string[] = [];

        try  {
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
        } catch (err) {
            console.error(err);
        }
    };


    const getNotifications = async () => {
        if (!user) return;
        const userInfo = await getDoc(doc(db, "users", user.uid));
        if (userInfo.exists()){
            setFriendNotifications(userInfo.data().friendRequests.length);
            setGroupsNotifications(userInfo.data().groupRequests.length);
        }
    }





    const fetchPostContent = async () => {
        if (!postIds.length || !user) return;

        try {
            isRefreshingPosts && setIsLoading(true);
            const raw = await Promise.all(postIds.map(async (post) => {
                const postRef = doc(db, "posts", post);
                const postSnap = await getDoc(postRef);
                if (!postSnap.exists()) return null;


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
                }


                return { id: post, content: postSnap.data().content, caption: postSnap.data().caption, userName: userName, timestamp: timestamp, pfp: pfp, mode: mode };
            }))
            const validPosts = raw.filter((p): p is PostType => p !== null);
            setPostContents(validPosts)

            isRefreshingPosts && setIsLoading(false);
        } catch (error) {
            console.error("Error fetching post content:", error);
        }
    };

    const onRefresh = async () => {
        setIsRefreshingPosts(true)
        await fetchFriendIds();
        await getNotifications()
        isRefreshing.value = false;
        pullDownOffset.value = 0;
        setIsRefreshingPosts(false);
    };






    const panGesture = Gesture.Pan()
        .onStart(() => {
            startY.value = position.value;
        })
        .onUpdate((event) => {
            let newPosition = startY.value + event.translationY;

            if (newPosition > MAX_POSITION) {
                pullDownOffset.value = Math.min(event.translationY, MAX_PULL_DOWN_HEIGHT);
                newPosition = MAX_POSITION;
            } else {
                pullDownOffset.value = 0;
            }

            newPosition = Math.max(MIN_POSITION, Math.min(MAX_POSITION, newPosition));
            position.value = newPosition;
        })
        .onEnd((event) => {
            if (pullDownOffset.value >= REFRESH_TRIGGER_HEIGHT && !isRefreshing.value) {
                isRefreshing.value = true;
                runOnJS(onRefresh)();
            } else {
                pullDownOffset.value = 0;
            }

            position.value = withDecay({
                velocity: event.velocityY,
                deceleration: 0.997,
                clamp: [MIN_POSITION, MAX_POSITION],
            });
        });


    const animatedRefreshStyle = useAnimatedStyle(() => ({
        height: pullDownOffset.value,
        opacity: pullDownOffset.value > 10 ? 1 : 0,
    }));



    const renderTopBar = () => (
        <View style={styles.topBar}>
            <View style={styles.titleCardView}>
                <Text style={styles.titleTextRECAP}>Recap</Text>
                <Text style={styles.titleTextIT}>It</Text>
            </View>
            <TouchableOpacity style={styles.friendRequestButtonContainer} onPress={() => router.push('/(tabs)/home/notifications')}>
                <Ionicons name="notifications-outline" size={width/20} color="#D3D3FF" />
                {friendNotifications+groupNotifications>0 &&
                    <View style={styles.redCircle}>
                        <Text style={styles.redCircleText}>{friendNotifications+groupNotifications}</Text>
                    </View>
                }
            </TouchableOpacity>
        </View>
    )


    return (
        <View style={styles.superContainer}>
            {renderTopBar()}
            <Animated.View style={[{ justifyContent: 'center', alignItems: 'center' }, animatedRefreshStyle]}>
                <ActivityIndicator size="small" color="#888" />
            </Animated.View>

            {isLoading || isRefreshingPosts ?
                <ActivityIndicator size="small" style={styles.loader} />
            :
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
            }

        </View>
    );



}

const styles = StyleSheet.create({
    superContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    loader: {
        margin: height * 0.05,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: width/20,
        paddingVertical: height/90,
        borderBottomWidth: height/1000,
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
        right: -(width/100),
        backgroundColor: 'red',
        borderRadius: width/40,
        width: width/30,
        height: width/30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    redCircleText: {
        fontSize: height/100,
        color: "white",
    },
});

export default Page;
