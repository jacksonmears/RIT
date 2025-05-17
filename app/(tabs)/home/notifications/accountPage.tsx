import React, { useState, useEffect } from 'react';
import {View, Text, StyleSheet, Image, Dimensions, FlatList, TouchableOpacity} from 'react-native';
import { auth, db } from '@/firebase';
import { useLocalSearchParams, useRouter} from 'expo-router'
import {doc, getDoc, getDocs, collection, query, orderBy, setDoc} from "firebase/firestore";
import AccountPost from "../../../../components/AccountPost";
import Feather from "@expo/vector-icons/Feather";

type Post = {
    id: string;
    content: string;
    mode: string;
    userID: string;
}

type PostID = {
    id: string;
}


const { width, height } = Dimensions.get('window');

const Page = () => {
    const user = auth.currentUser;
    const [numPosts, setNumPosts] = useState(0);
    const [numFriends, setNumFriends] = useState(0);
    const [bio, setBio] = useState('');
    const [postContents, setPostContents] = useState<Post[] | []>([]);
    const [posts, setPosts] = useState<PostID[] | []>([]);
    const {friendID} = useLocalSearchParams();
    const friend = String(friendID);
    const router = useRouter();
    const [friendStatus, setFriendStatus] = useState<boolean>(false);
    const [requestStatus, setRequestStatus] = useState<boolean>(false);
    const [pfp, setPfp] = useState<string>('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    useEffect(() => {
        getBioInfo().catch((err) => {
            console.error("error fetching Bio info", err);
        });
        fetchFriendStatus().catch((err) => {
            console.error("Error fetching data:", err);
        });
    }, []);

    useEffect(() => {
        getPostContent().catch((err) => {
            console.error("error fetching data:", err);
        })
    }, [posts]);

    useEffect(() => {
        fetchUserPosts().catch((err) => {
            console.error("Error fetching data:", err);
        });
    }, [friend]);



    const fetchUserPosts = async () => {
        if (!friend) return;
        try {
            const postsRef = collection(db, "users", friend, "posts");
            const orderedQuery = query(postsRef, orderBy("timestamp", "asc")); // or "asc"
            const usersDocs = await getDocs(orderedQuery);

            if (usersDocs.empty) return;

            try {
                const postList = usersDocs.docs.map((doc) => ({
                    id: doc.id,
                    timestamp: doc.data().timestamp,
                    mode: doc.data().mode,
                }));

                setPosts(postList);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    };

    const fetchFriendStatus = async () => {
        if (!user || !friend) return;
        const friendsRef = await getDoc(doc(db, "users", user.uid, "friends", friend));
        if (friendsRef.exists()) {
            setFriendStatus(true);
        }
        else if (user.uid === friend) setFriendStatus(true);
        else {
            const friendReqRef = await getDoc(doc(db, "users", friend));
            if (friendReqRef.exists()) {
                if (friendReqRef.data().friendRequests.includes(user.uid)) setRequestStatus(true);
            }
        }
    };

    const getBioInfo = async () => {
        if (!friend) return;
        const getInfo = await getDoc(doc(db,"users", friend));
        if (getInfo.exists()){
            setBio(getInfo.data().bio);
            setPfp(getInfo.data().photoURL);
            setFirstName(getInfo.data().firstName);
            setLastName(getInfo.data().lastName);
        }
        const fetchFriendCount = await getDocs(collection(db, "users", friend, "friends"));
        const fetchPostCount = await getDocs(collection(db, "users", friend, "posts"));

        setNumFriends(fetchFriendCount.size);
        setNumPosts(fetchPostCount.size);

    }


    const sendRequest = async () => {
        if (!user) return;
        try {
            if (friend === '' || user.uid === friend) return;
            const docRef = doc(db, "users", friend);
            const docSnap = await getDoc(docRef);
            const friendRequests = docSnap.data()?.friendRequests || [];
            if (docSnap.exists()) {
                await setDoc(docRef, { friendRequests: [...friendRequests, user.uid] }, { merge: true });
            } else {
                await setDoc(docRef, { friendRequests: [user.uid] });
            }
            setRequestStatus(true);
        }
        catch (error) {
            console.error(error);
        }
    }


    const getPostContent = async () => {
        if (!posts) return;
        try {
            const raw = await Promise.all(posts.map(async (post) => {
                const postRef = doc(db, "posts", post.id);
                const postSnap = await getDoc(postRef);

                if (postSnap.exists()) {

                    return { id: post.id, content: postSnap.data().content, mode: postSnap.data().mode };
                }
            }));
            const validPosts = raw.filter((p): p is Post => p !== null);
            setPostContents(validPosts.reverse());

        } catch (error) {
            console.error("Error fetching post content:", error);
        }
    };


    return (


        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Feather name="x" size={height/45} color="#D3D3FF" />
                <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.infoContainer}>
                <View style={styles.pfpAndInfo}>
                    <View>
                        <Image source={{ uri: pfp }} style={styles.pfp} />
                    </View>
                    <View style={styles.nameAndInfo}>
                        <Text style={styles.nameText}>{firstName} {lastName}</Text>
                        <View style={styles.info}>
                            <View>
                                <Text style={styles.infoNumber}>{numPosts}</Text>
                                <Text style={styles.infoText}>posts</Text>
                            </View>
                            <View style={styles.friendsBox}>
                                <Text style={styles.infoNumber}>{numFriends}</Text>
                                <Text style={styles.infoText}>friends</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <Text style={styles.bioText}>{bio}</Text>
            </View>

            <View style={styles.buttonContainer}>
                {friendStatus ? (
                    <View style={styles.followButton}>
                        <Text style={styles.followText}>friends</Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.notFollowedButton}
                        onPress={sendRequest}
                    >
                        <Text style={styles.notFollowedText}>{requestStatus ? "request pending" : "request"}</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                style={styles.groups}
                data={postContents}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <View style={styles.itemContainer}>
                        <AccountPost post={item} index={index}/>
                    </View>
                )}
                numColumns={3}
            />

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'black',
        flex: 1,
    },
    backButton: {
        padding: width/50,
        borderRadius: width/50,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        width: width/6,
        left: width/40,
        top: height/90,

    },
    backButtonText: {
        color: "#D3D3FF"
    },
    infoContainer: {
        marginTop: height/20,
        marginHorizontal: width/10,
    },
    pfpAndInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pfp: {
        backgroundColor: 'white',
        borderRadius: 999,
        width: width/4,
        height: width/4,
    },
    nameAndInfo: {
        marginLeft: width/20

    },
    nameText: {
        color: "gold",
        fontWeight: 'bold',
    },
    info: {
        flexDirection: 'row',
    },
    infoText: {
        color: "white",
    },
    infoNumber: {
        marginLeft: width/30,
        color: "white",
    },
    friendsBox: {
        marginLeft: width/20,
    },
    bioText: {
        color: "white",
        marginVertical: height/50
    },
    groups: {
        flex: 1,
        marginTop: height/50,
        marginHorizontal: width/150
    },
    itemContainer: {
        flex: 1 / 3,
    },

    buttonContainer: {
        flexDirection: "row",
        marginHorizontal: width/10,
    },
    followButton: {
        flex: 1,
        alignItems: "center",
        borderWidth: width/200,
        borderColor: "#D3D3FF",
        borderRadius: width/100,
    },
    followText: {
        color: "white",
    },
    notFollowedButton: {
        flex: 1,
        backgroundColor: "#D3D3FF",
        alignItems: "center",
        borderRadius: width/100,
        padding: width/100

    },
    notFollowedText: {
        color: "black",
    },
});

export default Page;
