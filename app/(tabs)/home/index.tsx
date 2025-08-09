import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {auth, db} from "@/firebase";
import {useRouter} from "expo-router";
import {AnimatedPost} from "@/components/AnimatedPost";
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {runOnJS, useAnimatedStyle, useSharedValue, withDecay} from 'react-native-reanimated';
import Ionicons from "@expo/vector-icons/Ionicons";
import { useConsent } from '@/hooks/useConsent';

const { height, width } = Dimensions.get('window');

type PostType = {
    id: string;
    content: string;
    caption: string;
    displayName: string;
    timestamp: string;
    pfp: string;
    mode: string;
    thumbnail: string;
};





const Page = () => {
    const user = auth().currentUser;
    const router = useRouter();
    const [friendIDs, setFriendIDs] = useState<string[]>([]);
    const [postIDs, setPostIDs] = useState<string[]>([]);
    const [postContents, setPostContents] = useState<PostType[] | []>([]);
    const [friendNotifications, setFriendNotifications] = useState<number>(0);
    const [groupNotifications, setGroupsNotifications] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isRefreshingPosts, setIsRefreshingPosts] = useState<boolean>(false);
    const personalizedAds = useConsent();


    const REFRESH_TRIGGER_HEIGHT = 100;
    const MAX_PULL_DOWN_HEIGHT = 101;
    const POST_HEIGHT   = height*0.7;
    const AD_HEIGHT = height/2;
    const MAX_POSITION = 0;
    const MIN_POSITION = - ((postContents.length - 1) * POST_HEIGHT + (postContents.length - 1) * AD_HEIGHT);
    const pullDownOffset = useSharedValue(0);
    const isRefreshing = useSharedValue(false);
    const position   = useSharedValue(0);
    const startY     = useSharedValue(0);



    useEffect(() => {
        if (!user) return;

        const userSnapshot = db
            .collection("users")
            .doc(user.uid)
            .onSnapshot(() => {
            getNotifications().catch((err) => {
                console.error("Error fetching notifications:", err);
            });
        });

        return () => userSnapshot();

    }, [user]);

    useEffect(() => {
        fetchFriendIDs().catch((err) => {
            console.error("Error fetching friendIds:", err);
        });
    }, []);

    useEffect(() => {
        fetchPosts().catch((err) => {
            console.error("Error fetching posts:", err);
        });
    }, [friendIDs]);

    useEffect(() => {
        fetchPostContent().catch((err) => {
            console.error("Error fetching postContent:", err);
        });
    }, [postIDs]);

    const feed = React.useMemo(() => {
        const items: ({ type: 'post'; post: PostType } | { type: 'ad'; id: string })[] = [];
        postContents.forEach((post) => {
            items.push({type: 'post', post});
            items.push({type: 'ad', id: `ad-${post.id}`});
        });
        return items;
    },[postContents]);



    useEffect(() => {
        getNotifications().catch((err) => {
            console.error("Error fetching notifications:", err);
        });
    }, []);



    const fetchTimeOfPost = (timestampDate: Date): string => {
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


    const fetchFriendIDs = async () => {
        if (!user) return;

        try {
            const userFriendReference = await db
                .collection("users")
                .doc(user.uid)
                .collection("friends")
                .get();

            let friendIDs: string[] = [];

            userFriendReference.forEach((doc) => {
                friendIDs.push(doc.id);
            });

            setFriendIDs(friendIDs);
        } catch (err) {
            console.error(err);
        }
    }

    const fetchPosts = async () => {
        if (!user) return;
        const postIDs: string[] = [];

        try  {
            for (const friendID of friendIDs) {
                const postQuery = db
                    .collection("users")
                    .doc(friendID)
                    .collection("posts")
                    .orderBy("timestamp", "desc")
                    .limit(1);

                const postQueryData = await postQuery.get();

                if (!postQueryData.empty) {
                    postIDs.push(postQueryData.docs[0].id);
                }
            }
            setPostIDs(postIDs);
        } catch (err) {
            console.error(err);
        }
    };



    const getNotifications = async () => {
        if (!user) return;

        const userReference = await db
            .collection("users")
            .doc(user.uid)
            .get();

        const userData = userReference.data();
        if (!userReference.exists() || !userData) return;



        setFriendNotifications(userData.friendRequests.length);
        setGroupsNotifications(userData.groupRequests.length);
    }





    const fetchPostContent = async () => {
        if (!postIDs.length || !user) return;

        try {
            isRefreshingPosts && setIsLoading(true);
            const rawPosts = await Promise.all(
                postIDs.map(async (post) => {

                const postReference = db
                    .collection("posts")
                    .doc(post);

                const postSnapshot = await postReference.get();
                const postData = postSnapshot.data();

                if (!postSnapshot.exists() || !postData) return null;


                const posterID = postData.sender_id;
                const posterReference = await db
                    .collection("users")
                    .doc(posterID)
                    .get();

                const posterData = posterReference.data()
                if (!posterReference.exists() || !posterData) return;

                let timestamp = "Unknown date";
                const rawTimestamp = postData.timestamp;
                if (rawTimestamp && typeof rawTimestamp.toDate === "function") {
                    try {
                        const dateObj = rawTimestamp.toDate();
                        timestamp = fetchTimeOfPost(dateObj);
                    } catch (error) {
                        console.error("Error converting timestamp:", error);
                    }
                }



                return {
                    id: post,
                    content: postData.content,
                    caption: postData.caption,
                    displayName: posterData.displayName,
                    timestamp: timestamp,
                    pfp: posterData.photoURL,
                    mode: postData.mode,
                    thumbnail: postData.thumbnail
                };
            }))

            const validPosts = rawPosts.filter((p): p is PostType => p !== null);
            setPostContents(validPosts)

            isRefreshingPosts && setIsLoading(false);
        } catch (error) {
            console.error("Error fetching post content:", error);
        }
    };

    const onRefresh = async () => {
        setIsRefreshingPosts(true)
        await fetchFriendIDs();
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


    if (personalizedAds === null) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }


    const renderTopBar = () => (
        <View style={styles.topBar}>
            <View style={styles.titleCardView}>
                <Text style={styles.titleTextIT}>R</Text>
                <Text style={styles.titleTextRECAP}>ecap</Text>
                <Text style={styles.titleTextIT}>IT</Text>
            </View>
            <TouchableOpacity style={styles.friendRequestButtonContainer} onPress={() => router.push('/(tabs)/home/notifications')}>
                <Ionicons name="notifications-outline" size={width/15} color="#D3D3FF" />
                {friendNotifications+groupNotifications>0 &&
                    <View style={styles.redCircle}>
                        <Text style={styles.redCircleText}>
                            {friendNotifications+groupNotifications}
                        </Text>
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
                <GestureDetector gesture={panGesture}>
                    <View>
                        {feed.map((item, idx) => (
                            <AnimatedPost
                                key={item.type === 'post' ? item.post!.id : item.id!}
                                post={item.type === 'post' ? item.post : ''}
                                index={idx}
                                scrollY={position}
                                postHeight={POST_HEIGHT}
                                adHeight={AD_HEIGHT}
                                personalizedAds={personalizedAds}
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
        borderBottomWidth: height/1000,
        borderBottomColor: "grey",
        alignItems: 'center',
        height: height/18
    },
    titleTextRECAP: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: height/50
    },
    titleTextIT: {
        color: '#D3D3FF',
        fontWeight: 'bold',
        fontSize: height/50
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
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

});

export default Page;
