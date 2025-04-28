import React, { useState, useEffect } from 'react';
import {View, Text, Button, StyleSheet, TextInput, Image, Dimensions, FlatList, TouchableOpacity} from 'react-native';
import { auth, db } from '@/firebase';
import { updateProfile } from '@firebase/auth';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import {Link, useLocalSearchParams, useRouter} from 'expo-router'
import {doc, getDoc, getDocs, collection, query, orderBy, limit, setDoc} from "firebase/firestore";
import AccountPost from "../../../components/AccountPost";
import {string} from "prop-types";
import friendRequests from "@/app/(tabs)/home/friendRequests";


const { width, height } = Dimensions.get('window');

const Page = () => {
    const user = auth.currentUser;
    const [name, setName] = useState('');
    const [numPosts, setNumPosts] = useState(0);
    const [numFriends, setNumFriends] = useState(0);
    const [bio, setBio] = useState('');
    const [postContents, setPostContents] = useState<{ id: string, content: string }[] | null>(null);
    const [posts, setPosts] = useState<{ id: string }[] | null>(null);
    const {friendID} = useLocalSearchParams();
    const friend = String(friendID);
    const router = useRouter();
    const [friendStatus, setFriendStatus] = useState<boolean>(false);
    const [requestStatus, setRequestStatus] = useState<boolean>(false);
    const [pfp, setPfp] = useState<string>('');


    useEffect(() => {
        const fetchUserPosts = async () => {
            if (!friend) return;
            try {
                const postsRef = collection(db, "users", friend, "posts");
                const orderedQuery = query(postsRef, orderBy("createdAt", "asc")); // or "asc"
                const usersDocs = await getDocs(orderedQuery);

                const postList = usersDocs.docs.map((doc) => ({
                    id: doc.id,
                    timestamp: doc.data().timestamp,
                }));

                setPosts(postList);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchUserPosts();
    }, []);

    useEffect(() => {
        getBioInfo()
    }, []);

    useEffect(() => {
        const fetchMyFriends = async () => {
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
        fetchMyFriends();
    }, []);

    useEffect(() => {
        console.log(friendStatus);
    }, [friendStatus]);



    useEffect(() => {
        getPostContent()
    }, [posts]);



    const getBioInfo = async () => {
        if (!friend) return;
        const getInfo = await getDoc(doc(db,"users", friend));
        if (getInfo.exists()){
            setName(getInfo.data().displayName);
            setBio(getInfo.data().bio);
            setPfp(getInfo.data().photoURL);
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
            // const friendCheck = await getDoc(doc(db, "users", user.uid, "friends", friend));
            //
            // if (friendRequests.includes(user.uid)){
            //     console.log("Friend request already sent!");
            //     return;
            // }
            //
            // else if (friendCheck.exists()){
            //     console.log("already friends!");
            //     return;
            // }

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


    // const [followers, setFollowers] = useState(auth.currentUser);
    // const [newDisplayName, setNewDisplayName] = useState('');
    // const [photoUrl, setPhotoUrl] = useState<string | undefined>(auth.currentUser?.photoURL || undefined);

    // const uploadImageToStorage = async (pickerResult: ImagePicker.ImagePickerResult, userId: string) => {
    //     try {
    //         const storage = getStorage();
    //         const storageRef = ref(storage, `profilePics/${userId}`);
    //
    //         // 1) Extract the local URI from the picker result
    //         if (pickerResult.assets?.length) {
    //             const assetUri = pickerResult.assets[0].uri;
    //             // 2) Fetch the file data and convert it to a Blob
    //             const response = await fetch(assetUri);
    //             const blob = await response.blob();
    //
    //             // 3) Upload the Blob to Firebase Storage
    //             await uploadBytes(storageRef, blob);
    //
    //             // 4) Get the public download URL
    //             const url = await getDownloadURL(storageRef);
    //             return url;
    //         }
    //
    //     } catch (error) {
    //         console.error('Error uploading image to Storage:', error);
    //         throw error;
    //     }
    // };




    // const handleUpdateDisplayName = async () => {
    //     try {
    //         if (auth.currentUser) {
    //             await updateProfile(auth.currentUser, { displayName: newDisplayName });
    //             console.log('Profile updated successfully');
    //         } else {
    //             console.error('No user is logged in');
    //         }
    //     } catch (error) {
    //         console.error('Error updating profile', error);
    //     }
    // };

    const handleLogout = async () => {
        auth.signOut();
    }

    // const handleUpdatePhotoURl = async () => {
    //     try {
    //         if (!auth.currentUser) {
    //             console.log('No user logged in');
    //             return;
    //         }
    //
    //         const result = await ImagePicker.launchImageLibraryAsync({
    //             // Better to specify the correct enum for images only:
    //             mediaTypes: ImagePicker.MediaTypeOptions.Images,
    //             allowsEditing: true,
    //             aspect: [4, 3],
    //             quality: 1,
    //         });
    //
    //         // Log the entire result for debugging
    //         console.log('ImagePicker result:', result);
    //
    //         // Check if the user canceled or if we have valid assets
    //         if (!result.canceled && result.assets) {
    //             // Upload the image and update the profile
    //             const url = await uploadImageToStorage(result, auth.currentUser.uid);
    //             await updateProfile(auth.currentUser, { photoURL: url });
    //             setPhotoUrl(url); // Update state so we can display it immediately
    //             console.log('Profile URL updated successfully');
    //         } else {
    //             console.log('URL not updated (picker canceled or no assets)');
    //         }
    //     } catch (error) {
    //         console.error('Error in handleUpdatePhotoURL:', error);
    //     }
    // };

    return (


        <View style={styles.container}>
            <View style={styles.topBar}>
                <View style={styles.backContainer}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.infoBar}>
                <View style={styles.pfpAndInfo}>
                    <View>
                        <Image source={{ uri: pfp }} style={styles.pfp} />
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

            <View style={styles.buttonContainer}>
                {/*<TouchableOpacity*/}
                {/*    style={friendStatus ? styles.followingButton : styles.followButton}*/}
                {/*>*/}
                {/*    <Text style={styles.followText}>*/}
                {/*        {friendStatus ? "friends" : "request"}*/}
                {/*    </Text>*/}
                {/*</TouchableOpacity>*/}

                {friendStatus ? (
                    <TouchableOpacity
                        style={styles.followButton}
                        // onPress={handleUnfollow} // do something when unfollowing
                    >
                        <Text style={styles.followText}>friends</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.followButton}
                        onPress={sendRequest} // do something when following
                    >
                        <Text style={styles.followText}>{requestStatus ? "request pending" : "request"}</Text>
                    </TouchableOpacity>
                )}

                <View style={styles.separator}></View>
                <TouchableOpacity style={styles.messageButton}>
                    <Text style={styles.messageText}>message</Text>
                </TouchableOpacity>
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
        paddingTop: 60,
        paddingLeft: 40,

    },
    pfpAndInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pfp: {
        backgroundColor: 'white',
        borderRadius: 999,
        width: 100,
        height: 100,
    },
    pfpSeparator: {
        width: 20
    },
    infoBox: {

    },
    name: {
    },
    nameText: {
        color: "gold",
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
    itemContainer: {
        flex: 1 / 3, // One third of the row
        paddingVertical: 0.5, // Optional: adds spacing between items
        paddingHorizontal: 0.5,
    },
    postContainer: {
        flex: 1,
        paddingBottom: 55,
        paddingHorizontal: 20,
    },
    topBar: {

    },
    backContainer: {
        width: 60
    },
    backButton: {
        backgroundColor: "#28a745",
        padding: 10,
        borderRadius: 8,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    backButtonText: {
        color: "white"
    },
    followText: {
        color: "white",
    },
    messageText: {
        color: "white",
    },
    buttonContainer: {
        flexDirection: "row",
        paddingHorizontal: 40,
        justifyContent: "space-between",
        paddingTop: 20,
        paddingBottom: 10

    },
    followButton: {
        flex: 1,
        backgroundColor: "blue",
        alignItems: "center",
        padding: 4,
        borderRadius: 2,
    },
    followingButton: {
        flex: 1,
        backgroundColor: "blue",
        alignItems: "center",
        padding: 4,
        borderRadius: 2,
    },
    messageButton: {
        flex: 1,
        backgroundColor: "green",
        alignItems: "center",
        borderRadius: 2,
        padding: 4
    },
    separator: {
        width: 20,
    },
});

export default Page;
