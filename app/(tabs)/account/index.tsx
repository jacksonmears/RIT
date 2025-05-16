import React, {useState, useEffect, useCallback} from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
    FlatList,
    TouchableOpacity,
    Animated
} from 'react-native';
import { auth, db } from '@/firebase';
import { useFocusEffect} from '@react-navigation/native';
import { useRouter } from 'expo-router'
import {doc, getDoc, getDocs, collection, query, orderBy, serverTimestamp} from "firebase/firestore";
import AccountPost from "../../../components/AccountPost";
import Ionicons from '@expo/vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

type PostType = {
    id: string;
    content: string;
    caption: string;
    mode: string;
    userID: string;
}

const Page = () => {
    const user = auth.currentUser;
    const router = useRouter();
    const [numPosts, setNumPosts] = useState(0);
    const [numFriends, setNumFriends] = useState(0);
    const [pfp, setPfp] = useState<string>('');
    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>('');
    const [bio, setBio] = useState('');
    const [postContents, setPostContents] = useState<PostType[] | []>([]);
    const [posts, setPosts] = useState<{ id: string }[] | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [animatedValues, setAnimatedValues] = useState<Animated.Value[]>([]);
    const [totalCharacters, setTotalCharacters] = useState<string>("");


    useEffect(() => {
        const getInfo = async () => {
            await getBioInfo()
            await fetchUserPosts();
        }
        getInfo().catch((err) => {
            console.error(err);
        });
    }, []);

    useEffect(() => {
        getPostContent().catch((err) => {
            console.error(err);
        })
    }, [posts]);


    useEffect(() => {
        const values = Array.from({ length: totalCharacters.length}, () => new Animated.Value(0));
        setAnimatedValues(values);
    }, [totalCharacters]);

    useEffect(() => {
        setTotalCharacters(firstName+' '+lastName);
    }, [firstName, lastName]);

    const runAnimation = useCallback(() => {
        if (animatedValues.length === 0) return;

        const animations = animatedValues.map((val) =>
            Animated.sequence([
                Animated.timing(val, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(val, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ])
        );

        Animated.stagger(100, animations).start();
    }, [animatedValues]);

    useFocusEffect(
        useCallback(() => {
            runAnimation();
        }, [runAnimation])
    );

    useEffect(() => {
        if (!refreshing) {
            runAnimation();
        }
    }, [refreshing, runAnimation]);



    const fetchUserPosts = async () => {
        if (!user) return;

        try {
            const postsRef = collection(db, "users", user.uid, "posts");
            const orderedQuery = query(postsRef, orderBy("timestamp", "asc"));
            const usersDocs = await getDocs(orderedQuery);

            try {
                const userPfpRef = await getDoc(doc(db, "users", user.uid));
                if (userPfpRef.exists()) setPfp(userPfpRef.data().photoURL)


                const postList = usersDocs.docs.map((doc) => ({
                    id: doc.id,
                    timestamp: serverTimestamp(),
                }));

                setPosts(postList);
            } catch (error) {
                console.error(error);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };


    const getBioInfo = async () => {
        if (!user) return;

        const getInfo = await getDoc(doc(db,"users", user.uid));
        if (! getInfo.exists()) return;

        try {
            setBio(getInfo.data().bio);
            setFirstName(getInfo.data().firstName);
            setLastName(getInfo.data().lastName);

            const fetchFriendCount = await getDocs(collection(db, "users", user.uid, "friends"));
            const fetchPostCount = await getDocs(collection(db, "users", user.uid, "posts"));

            setNumFriends(fetchFriendCount.size);
            setNumPosts(fetchPostCount.size);
        } catch (error) {
            console.error(error);
        }
    }


    const getPostContent = async () => {
        if (!posts || !user) return;

        try {
            const raw = await Promise.all(posts.map(async (post) => {
                const postRef = doc(db, "posts", post.id);
                const postSnap = await getDoc(postRef);

                if (!postSnap.exists()) return;

                return { id: post.id, content: postSnap.data().content, caption: postSnap.data().caption, mode: postSnap.data().mode, userID: user.uid };
            }));
            const validPosts = raw.filter((p): p is PostType => p !== null)
            setPostContents(validPosts.reverse());

        } catch (error) {
            console.error("Error fetching post content:", error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUserPosts();
        await getBioInfo()
        setRefreshing(false);
    }


    const handleLogout = async () => {
        await auth.signOut();
    }

    const renderTopBar = () => (
        <View style={styles.topBar}>
            <View style={styles.backArrowName}>
                {user && <Text style={styles.topBarText}>{user.displayName}</Text>}
            </View>
            <View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text>Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
    )

    const renderAnimatedName = () => (
        <View style={styles.containerName}>
            {totalCharacters.split('').map((char, index) => {
                const val = animatedValues[index];
                if (!val) return null;

                const scale = val.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.4],
                });

                const colorScale = val.interpolate({
                    inputRange: [0, 0.5],
                    outputRange: ["#D3D3FF", "white"],
                });

                return (
                    <Animated.Text
                        key={index}
                        style={[styles.char, { transform: [{ scale }], color: colorScale}]}
                    >
                        {char}
                    </Animated.Text>
                );
            })}
        </View>
    )

    const renderPfp = () => (
        <View style={styles.pfpAndInfo}>
            <TouchableOpacity style={styles.pfpBox} onPress={() => router.push("/account/editPfp")}>
                <View>
                    {pfp ? (
                        <Image source={{ uri: pfp }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, styles.placeholder]}>
                            <Text style={styles.placeholderText}>No Photo</Text>
                        </View>
                    )}
                    <View style={styles.changePfp}>
                        <Ionicons name="add-circle" size={height/33} color="white" />
                    </View>
                </View>
            </TouchableOpacity>
            <View style={{alignItems: "center"}}>
                <View style={styles.flexDirectionRow}>
                    <View style={styles.flexDirectionRow}>
                        <Text style={styles.infoText}>{numPosts}</Text>
                        <Text style={styles.numberText}> posts</Text>
                    </View>
                    <View style={styles.flexDirectionRow}>
                        <Text style={styles.infoText}>{numFriends}</Text>
                        <Text style={styles.numberText}> friends</Text>
                    </View>
                </View>

            </View>
        </View>
    )

    const renderBio = () => (
        <View style={styles.bioAndButtonBox}>
            <View style={styles.bioBox}>
                <Text style={styles.bioText}>{bio}</Text>
            </View>
            <TouchableOpacity style={styles.editContainer} onPress={() => router.push("/account/editProfile")}>
                <Text style={styles.nameText}>Edit profile</Text>
            </TouchableOpacity>

        </View>

    )

    const renderFlatList = () => (
        <View style={styles.postContainer}>
            {user && <FlatList
                style={styles.groups}
                data={postContents}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <TouchableOpacity onPress={() => router.push({pathname: '/account/post', params: {rawID: user.uid, rawContent: item.content, rawCaption: item.caption, rawUsername: user.displayName, rawMode: item.mode, rawPhotoURL: encodeURIComponent(pfp)}})}>
                        <AccountPost post={item} index={index} />
                    </TouchableOpacity>

                )}
                refreshing={refreshing}
                onRefresh={onRefresh}
                numColumns={3}
            />}
        </View>
    )

    return (


        <View style={styles.container}>
            {renderTopBar()}
            {renderAnimatedName()}
            {renderPfp()}
            {renderBio()}
            {renderFlatList()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'black',
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: width/20,
        paddingVertical: height/90,
        borderBottomWidth: height/1000,
        borderBottomColor: "grey",
    },
    logoutButton: {
        backgroundColor: "#D3D3FF",
        borderRadius: width/100,
        padding: width/100
    },
    backArrowName: {
        flexDirection: 'row',
        alignItems: "center",
    },
    topBarText: {
        color: "#D3D3FF",
    },
    containerName: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: height/50,
    },
    char: {
        fontSize: height/33,
        color: "#D3D3FF",
    },
    pfpAndInfo: {
        alignItems: 'center',
        marginBottom: height/50,
    },
    pfpBox: {
        marginTop: height/50,
        marginBottom: height/70
    },
    avatar: {
        width: width/2.8,
        height: width/2.8,
        borderRadius: 999,
    },
    placeholder: {
        backgroundColor: '#444',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: 'white',
    },
    changePfp: {
        backgroundColor: "black",
        borderRadius: 999,
        padding: width/200,
        position: 'absolute',
        top: height/8.6,
        left: width/3.8
    },
    flexDirectionRow: {
        flexDirection: 'row',
    },
    infoText: {
        color: "#D3D3FF",
        marginLeft: width/50,
    },
    numberText: {
        color: "white",
    },
    bioAndButtonBox: {
        marginHorizontal: width/10,
    },
    bioBox: {
        marginTop: width/100
    },
    bioText: {
        color: 'white',
    },
    editContainer: {
        marginVertical: height/50,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: width/75,
        borderWidth: height/1000,
        borderColor: "#D3D3FF",
    },
    nameText: {
        color: "#D3D3FF",
        fontWeight: 'bold',
    },
    postContainer: {
        flex: 1,
        marginHorizontal: width/200,
        marginTop: height/100
    },
    groups: {
        flex: 1,
    },
});

export default Page;
