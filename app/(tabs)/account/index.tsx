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


const { width, height } = Dimensions.get('window');

const Page = () => {
    const user = auth.currentUser;
    const [name, setName] = useState('');
    const [numPosts, setNumPosts] = useState(0);
    const [numFriends, setNumFriends] = useState(0);
    const [pfp, setPfp] = useState<string>('');
    const [bio, setBio] = useState('');
    const [postContents, setPostContents] = useState<{ id: string, content: string }[] | null>(null);
    const [posts, setPosts] = useState<{ id: string }[] | null>(null);
    const router = useRouter();

    const getBioInfo = async () => {
        if (!user) return;
        const getInfo = await getDoc(doc(db,"users", user.uid));
        if (getInfo.exists()){
            setName(getInfo.data().displayName);
            setBio(getInfo.data().bio);
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
        if (!posts) return;
        try {
            const postContents = await Promise.all(posts.map(async (post) => {
                const postRef = doc(db, "posts", post.id);
                const postSnap = await getDoc(postRef);

                if (postSnap.exists()) {

                    return { id: post.id, content: postSnap.data().content };
                } else {
                    return { id: post.id, content: "Content not found"};
                }
            }));

            setPostContents(postContents.reverse());
        } catch (error) {
            console.error("Error fetching post content:", error);
        }
    };

    const refresh = () => {
        setPostContents(null);
        setName('')
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
                <TouchableOpacity style={styles.refreshButton} onPress={refresh}>
                    <Text style={styles.text}>refresh</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.refreshButton} onPress={() => router.push("/account/editProfile")}>
                    <Text style={styles.text}>edit profile</Text>
                </TouchableOpacity>

                <View style={styles.logout}>
                    <Button title="Logout" onPress={handleLogout} />
                </View>
            </View>


            <View style={styles.infoBar}>
                <View style={styles.pfpAndInfo}>
                    <View style={styles.avatarContainer}>
                        {pfp ? (
                            <Image source={{ uri: pfp }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.placeholder]}>
                                <Text style={styles.placeholderText}>No Photo</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.pfpSeparator}></View>
                    <View style={styles.infoBox}>
                        <View style={styles.name}>
                            <Text style={styles.nameText}>{name}</Text>
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
            </View>



            <View style={styles.postContainer}>
                <FlatList
                    style={styles.groups}
                    data={postContents}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.itemContainer}>
                            <AccountPost post={item} />
                        </View>
                    )}
                    // contentContainerStyle={styles.flatListContentContainer}
                    // ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    infoBar: {
        paddingTop: 100,
        paddingLeft: 40,

    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    pfpAndInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pfp: {
        // backgroundColor: 'white',
        borderRadius: 999,
        width: 100,
        height: 100,
        borderWidth: 1,
        borderColor: 'white',
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
        paddingLeft: 15,
        paddingTop: 20,
    },
    genericText: {
        color: 'white',
    },
    groups: {
        flex: 1,
        marginTop: 20,
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
        paddingBottom: 55,
        paddingHorizontal: 20,
        paddingTop: 30
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
        alignItems: 'center',
        marginBottom: 20,
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
});

export default Page;
