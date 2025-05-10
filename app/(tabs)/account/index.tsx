import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
    View,
    Text,
    Button,
    StyleSheet,
    TextInput,
    Image,
    Dimensions,
    FlatList,
    TouchableOpacity,
    ActivityIndicator, Animated
} from 'react-native';
import { auth, db } from '@/firebase';
import { useFocusEffect} from '@react-navigation/native';
import { updateProfile } from '@firebase/auth';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Link, useRouter } from 'expo-router'
import {doc, getDoc, getDocs, collection, query, orderBy, limit, serverTimestamp} from "firebase/firestore";
import AccountPost from "../../../components/AccountPost";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, {G, Defs, Text as SvgText, Path, TextPath, TSpan, Line, Circle} from 'react-native-svg';

const { width, height } = Dimensions.get('window');


const Page = () => {
    const user = auth.currentUser;
    const [numPosts, setNumPosts] = useState(0);
    const [numFriends, setNumFriends] = useState(0);
    const [pfp, setPfp] = useState<string>('');
    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>('');
    const [bio, setBio] = useState('');
    const [postContents, setPostContents] = useState<{ id: string, content: string, caption:string, mode: string, userID: string }[] | null>(null);
    const [posts, setPosts] = useState<{ id: string }[] | null>(null);
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [animatedValues, setAnimatedValues] = useState<Animated.Value[]>([]);
    const [totalCharacters, setTotalCharacters] = useState<string>("");


    useEffect(() => {
        const getInfo = async () => {
            await getBioInfo()
            await fetchUserPosts();
        }
        getInfo();
    }, []);

    useEffect(() => {
        getPostContent()
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
            const orderedQuery = query(postsRef, orderBy("timestamp", "asc")); // or "asc"
            const usersDocs = await getDocs(orderedQuery);

            const userPfpRef = await getDoc(doc(db, "users", user.uid));
            if (userPfpRef.exists()) {
                setPfp(userPfpRef.data().photoURL)
            }

            const postList = usersDocs.docs.map((doc) => ({
                id: doc.id,
                timestamp: serverTimestamp(),
            }));

            setPosts(postList);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };


    const getBioInfo = async () => {
        if (!user) return;
        const getInfo = await getDoc(doc(db,"users", user.uid));
        if (getInfo.exists()){
            setBio(getInfo.data().bio);
            setFirstName(getInfo.data().firstName);
            setLastName(getInfo.data().lastName);
        }
        const fetchFriendCount = await getDocs(collection(db, "users", user.uid, "friends"));
        const fetchPostCount = await getDocs(collection(db, "users", user.uid, "posts"));

        setNumFriends(fetchFriendCount.size);
        setNumPosts(fetchPostCount.size);

    }


    const getPostContent = async () => {
        if (!posts || !user) return;
        try {
            const postContents = await Promise.all(posts.map(async (post) => {
                const postRef = doc(db, "posts", post.id);
                const postSnap = await getDoc(postRef);

                if (postSnap.exists()) {

                    return { id: post.id, content: postSnap.data().content, caption: postSnap.data().caption, mode: postSnap.data().mode, userID: user.uid };
                } else {
                    return { id: post.id, content: "Content not found", caption: "failed", mode: "failed", userID: "failed"};
                }
            }));

            setPostContents(postContents.reverse());
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
        auth.signOut();
    }

    const renderTopBar = () => (
        <View style={styles.topBar}>
            <View style={styles.backArrowName}>
                <Text style={styles.topBarText}>{user?.displayName}</Text>
            </View>
            <View>
                <Button title="Logout" onPress={handleLogout} />
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
                        <Ionicons name="add-circle" size={24} color="white" />
                    </View>
                </View>
            </TouchableOpacity>
            <View style={styles.pfpSeparator}></View>
            <View style={styles.infoBox}>
                <View style={styles.info}>
                    <View style={styles.postsInfo}>
                        <Text style={styles.infoText}>{numPosts}</Text>
                        <Text style={styles.genericText}> posts</Text>
                    </View>
                    <View style={styles.pfpSeparator}></View>
                    <View style={styles.friendInfo}>
                        <Text style={styles.infoText}>{numFriends}</Text>
                        <Text style={styles.genericText}> friends</Text>
                    </View>
                </View>

            </View>
        </View>
    )

    const renderBio = () => (
        <View style={styles.bioAndButtonBox}>
            <View style={styles.bioBox}>
                <Text style={styles.genericText}>{bio}</Text>
            </View>
            <TouchableOpacity style={styles.editContainer} onPress={() => router.push("/account/editProfile")}>
                <Text style={styles.nameText}>Edit profile</Text>
            </TouchableOpacity>

        </View>

    )

    const renderFlatList = () => (
        <View style={styles.postContainer}>
            <FlatList
                style={styles.groups}
                data={postContents}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => router.push({pathname: '/account/post', params: {idT: user?.uid, contentT: item.content, captionT: item.caption, userNameT: user?.displayName, mode: item.mode, photoURL: encodeURIComponent(pfp)}})}>
                        <View style={styles.itemContainer}>
                            <AccountPost post={item} />
                        </View>
                    </TouchableOpacity>

                )}
                // contentContainerStyle={styles.flatListContentContainer}
                // ItemSeparatorComponent={() => <View style={styles.separator} />}
                refreshing={refreshing}              // 👈 NEW
                onRefresh={onRefresh}                // 👈 NEW
                numColumns={3}
            />
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
        paddingHorizontal: 15,
        padding: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: "grey",
    },
    pfpBox: {
        marginTop: 30,
        marginBottom: 15
    },
    infoBar: {
        marginTop: 30,
        marginHorizontal: 40,

        alignItems: "center",
    },
    pfpAndInfo: {
        alignItems: 'center',
        marginBottom: 30,
    },
    pfpSeparator: {
        width: 50
    },
    infoBox: {
        alignItems: 'center',
    },
    nameText: {
        color: "#D3D3FF",
        fontWeight: 'bold',
    },
    info: {
        flexDirection: 'row',
    },
    postsInfo: {
        flexDirection: 'row',
    },
    friendInfo: {
        flexDirection: 'row',
    },
    bioBox: {
        marginTop: 10
    },
    genericText: {
        color: 'white',
    },
    groups: {
        flex: 1,
        paddingTop: 20
    },
    itemContainer: {
        flex: 1 / 3,
        paddingVertical: 0.5,
        paddingHorizontal: 0.5,
    },
    postContainer: {
        flex: 1,
    },
    avatar: {
        width: 150,
        height: 150,
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

    topBarText: {
        color: "#D3D3FF",
    },
    backArrowName: {
        flexDirection: 'row',
        alignItems: "center",
    },
    changePfp: {
        backgroundColor: "black",
        borderRadius: 999,
        padding: 3,
        position: 'absolute',
        top: 110,
        left: 110

    },
    editContainer: {
        marginVertical: 20,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 5,
        borderWidth: 1,
        borderColor: "#D3D3FF",
    },
    containerName: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25,
    },
    char: {
        fontSize: 20,
        color: "#D3D3FF",
    },
    bioAndButtonBox: {
        marginHorizontal: 50,
    },
    infoText: {
        color: "#D3D3FF",
    }

});

export default Page;
