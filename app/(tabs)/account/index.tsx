import React, { useState, useEffect } from 'react';
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
    ActivityIndicator
} from 'react-native';
import { auth, db } from '@/firebase';
import { updateProfile } from '@firebase/auth';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Link, useRouter } from 'expo-router'
import {doc, getDoc, getDocs, collection, query, orderBy, limit, serverTimestamp} from "firebase/firestore";
import AccountPost from "../../../components/AccountPost";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from '@expo/vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

const Page = () => {
    const user = auth.currentUser;
    const [numPosts, setNumPosts] = useState(0);
    const [numFriends, setNumFriends] = useState(0);
    const [pfp, setPfp] = useState<string>('');
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [bio, setBio] = useState('');
    const [postContents, setPostContents] = useState<{ id: string, content: string, caption:string, mode: string, userID: string }[] | null>(null);
    const [posts, setPosts] = useState<{ id: string }[] | null>(null);
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

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


    useEffect(() => {
        getBioInfo()
    }, []);



    useEffect(() => {
        fetchUserPosts();
    }, []);

    useEffect(() => {
        getPostContent()
    }, [posts]);



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

    const onRefresh = () => {
        setPostContents(null);
        setNumPosts(0);
        setNumFriends(0);
        setBio('');
        fetchUserPosts();
        getBioInfo()
    }




    const handleLogout = async () => {
        auth.signOut();
    }



    return (


        <View style={styles.container}>
            <View style={styles.topBar}>
                {/*<TouchableOpacity style={styles.refreshButton} onPress={refresh}>*/}
                {/*    <Text style={styles.text}>refresh</Text>*/}
                {/*</TouchableOpacity>*/}



                <View style={styles.backArrowName}>
                    {/*<TouchableOpacity onPress={() => router.back()}>*/}
                    {/*    <MaterialIcons name="arrow-back-ios-new" size={18} color="#D3D3FF" />*/}
                    {/*</TouchableOpacity>*/}
                    <Text style={styles.topBarText}>{user?.displayName}</Text>
                </View>
                <View style={styles.logout}>
                    <Button title="Logout" onPress={handleLogout} />
                </View>
            </View>


            <View style={styles.infoBar}>
                <View style={styles.pfpAndInfo}>
                    <TouchableOpacity onPress={() => router.push("/account/editProfile")}>
                        <View style={styles.avatarContainer}>
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
                        <View style={styles.name}>
                            <Text style={styles.nameText}>{firstName} {lastName}</Text>
                        </View>
                        <View style={styles.info}>
                            <View style={styles.postsInfo}>
                                <Text style={styles.genericText}>{numPosts}</Text>
                                <Text style={styles.genericText}>posts</Text>
                            </View>
                            <View style={styles.pfpSeparator}></View>
                            <View style={styles.friendInfo}>
                                <Text style={styles.genericText}>{numFriends}</Text>
                                <Text style={styles.genericText}>friends</Text>
                            </View>
                        </View>

                    </View>
                </View>
                <View style={styles.bioBox}>
                    <Text style={styles.genericText}>{bio}</Text>
                </View>
                <TouchableOpacity style={styles.editContainer}>
                    <Text style={styles.nameText}>Edit profile</Text>
                </TouchableOpacity>
            </View>





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

    infoBar: {
        marginTop: 50,
        marginHorizontal: 40,
    },
    pfpAndInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pfpSeparator: {
        width: 20

    },
    infoBox: {

    },
    name: {
    },
    nameText: {
        color: "#D3D3FF",
        fontWeight: 'bold',
    },
    info: {
        flexDirection: 'row',
    },
    postsInfo: {

    },
    friendInfo: {

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
    separator: {
        height: 20,
    },
    flatListContentContainer: {
        paddingTop: 0,
    },
    itemContainer: {
        flex: 1 / 3, // One third of the row
        paddingVertical: 0.5, // Optional: adds spacing between items
        paddingHorizontal: 0.5,
    },
    logout: {
        // position: 'absolute',
        // top: 0,
        // right: 0,
    },
    postContainer: {
        flex: 1,
    },
    refreshButton: {
        // position: "absolute",
        // top: 0,
        // left: 10,
        backgroundColor: "green",
    },
    text: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#D3D3FF",
    },
    avatarContainer: {
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
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
        top: 85,
        left: 80

    },
    editContainer: {
        marginVertical: 20,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 5,
        borderWidth: 1,
        borderColor: "#D3D3FF",
    }
});

export default Page;
