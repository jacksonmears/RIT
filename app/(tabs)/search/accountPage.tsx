import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, Image, Dimensions, FlatList, TouchableOpacity} from 'react-native';
import { auth, db } from '@/firebase';
import { useLocalSearchParams, useRouter} from 'expo-router'
import AccountPost from "../../../components/AccountPost";
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

    const { friendID } = useLocalSearchParams();
    const user = auth().currentUser;
    const [numberOfPosts, setNumberOfPosts] = useState(0);
    const [numberOfFriends, setNumberOfFriends] = useState(0);
    const [bio, setBio] = useState('');
    const [postContents, setPostContents] = useState<Post[] | []>([]);
    const [posts, setPosts] = useState<PostID[] | []>([]);
    const friendIDString = String(friendID);
    const [friendStatus, setFriendStatus] = useState<boolean>(false);
    const [requestStatus, setRequestStatus] = useState<boolean>(false);
    const [pfp, setPfp] = useState<string>('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const router = useRouter();





    const fetchUserPosts = useCallback(async () => {
        if (!friendIDString) return;
        try {
            const postsReference = db
                .collection("users")
                .doc(friendIDString)
                .collection("posts");

            const orderedQuery = await postsReference
                .orderBy("timestamp", "asc")
                .get();

            if (orderedQuery.empty) return;

            try {
                const postList = orderedQuery.docs.map((doc) => ({
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
    }, [friendIDString]);



    const getPostContent = useCallback(async () => {
        if (!posts) return;
        try {
            const raw = await Promise.all(posts.map(async (post) => {
                const postRef = db.collection("posts").doc(post.id);
                const postSnap = await postRef.get();
                const data = postSnap.data();

                if (!postSnap.exists() || !data) return;
                return { id: post.id, content: data.content, mode: data.mode };

            }));
            const validPosts = raw.filter((p): p is Post => p !== null);
            setPostContents(validPosts.reverse());

        } catch (error) {
            console.error("Error fetching post content:", error);
        }
    }, [posts]);


    const fetchFriendInformation = useCallback(async () => {
        if (!user || !friendIDString) return;

        const usersFriendReference = await db
            .collection("users")
            .doc(user.uid)
            .collection("friends")
            .doc(friendIDString)
            .get();


        const friendReference = await db
            .collection("users")
            .doc(friendIDString)
            .get();

        const data = friendReference.data();
        if (!friendReference.exists() || !data) return;


        if (usersFriendReference.exists() || user.uid === friendIDString) setFriendStatus(true);
        else if (data.friendRequests.includes(user.uid)) setRequestStatus(true);


        setBio(data.bio);
        setPfp(data.photoURL);
        setFirstName(data.firstName);
        setLastName(data.lastName);


        const fetchFriendCount = await db
            .collection("users")
            .doc(friendIDString)
            .collection("friends")
            .get();

        const fetchPostCount = await db
            .collection("users")
            .doc(friendIDString)
            .collection("posts")
            .get();

        setNumberOfFriends(fetchFriendCount.size);
        setNumberOfPosts(fetchPostCount.size);

    }, [user, friendIDString]);

    // const getBioInfo = useCallback(async () => {
    //     if (!friendIDString) return;
    //
    //     const getInfo = await db
    //         .collection("users")
    //         .doc(friendIDString)
    //         .get();
    //
    //     const data = getInfo.data()
    //
    //     if (!getInfo.exists() || !data) return;
    //
    //     setBio(data.bio);
    //     setPfp(data.photoURL);
    //     setFirstName(data.firstName);
    //     setLastName(data.lastName);
    //
    //     const fetchFriendCount = await db.collection("users").doc(friendIDString).collection("friends").get();
    //     const fetchPostCount = await db.collection("users").doc(friendIDString).collection("posts").get();
    //
    //     setNumberOfFriends(fetchFriendCount.size);
    //     setNumberOfPosts(fetchPostCount.size);
    //
    // },[friendIDString]);


    const sendRequest = async () => {
        if (!user || !friendIDString || user.uid === friendIDString) return;
        try {
            const friendReference = db
                .collection("users")
                .doc(friendIDString);

            const friendSnapshot = await friendReference.get();
            const friendData = friendSnapshot.data();

            if (!friendSnapshot.exists || !friendData) return;

            const friendRequests = friendData.friendRequests || [];

            if (friendSnapshot.exists()) {
                await friendReference.set({ friendRequests: [...friendRequests, user.uid] }, { merge: true });
            } else {
                await friendReference.set({ friendRequests: [user.uid] });
            }
            setRequestStatus(true);
        }
        catch (error) {
            console.error(error);
        }
    }




    useEffect(() => {
        fetchFriendInformation().catch((err) => {
            console.error("error fetching Bio info", err);
        });
    }, [fetchFriendInformation]);

    useEffect(() => {
        getPostContent().catch((err) => {
            console.error("error fetching data:", err);
        })
    }, [getPostContent]);

    useEffect(() => {
        fetchUserPosts().catch((err) => {
            console.error("Error fetching data:", err);
        });
    }, [fetchUserPosts]);


    return (


        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Feather name="x" size={height/45} color="#D3D3FF" />
                <Text style={styles.backButtonText}>
                    Back
                </Text>
            </TouchableOpacity>

            <View style={styles.infoContainer}>
                <View style={styles.pfpAndInfo}>
                    <View>
                        {pfp && <Image source={{ uri: pfp }} style={styles.pfp} />}
                    </View>
                    <View style={styles.nameAndInfo}>
                        <Text style={styles.nameText}>
                            {firstName} {lastName}
                        </Text>
                        <View style={styles.info}>
                            <View>
                                <Text style={styles.infoNumber}>
                                    {numberOfPosts}
                                </Text>
                                <Text style={styles.infoText}>
                                    posts
                                </Text>
                            </View>
                            <View style={styles.friendsBox}>
                                <Text style={styles.infoNumber}>
                                    {numberOfFriends}
                                </Text>
                                <Text style={styles.infoText}>
                                    friends
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
                <Text style={styles.bioText}>{bio}</Text>
            </View>

            <View style={styles.buttonContainer}>
                {friendStatus ? (
                    <View style={styles.followButton}>
                        <Text style={styles.followText}>
                            friends
                        </Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.notFollowedButton}
                        onPress={sendRequest}
                    >
                        <Text style={styles.notFollowedText}>
                            {requestStatus ? "request pending" : "request"}
                        </Text>
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
        marginHorizontal: width/150,
        marginBottom: height/17,
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
