import React, { useState, useEffect } from 'react';
import {View, Text, Button, StyleSheet, TextInput, Image, Dimensions, FlatList, TouchableOpacity} from 'react-native';
import { auth, db } from '@/firebase';
import { updateProfile } from '@firebase/auth';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Link, useRouter } from 'expo-router'
import {doc, getDoc, getDocs, collection, query, orderBy, limit} from "firebase/firestore";
import AccountPost from "../../../components/AccountPost";


const { width, height } = Dimensions.get('window');

const Page = () => {
    const user = auth.currentUser;
    const [name, setName] = useState('');
    const [numPosts, setNumPosts] = useState(0);
    const [numFriends, setNumFriends] = useState(0);
    const [bio, setBio] = useState('');
    const [postContents, setPostContents] = useState<{ id: string, content: string }[] | null>(null);
    const [posts, setPosts] = useState<{ id: string }[] | null>(null);

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

            const postList = usersDocs.docs.map((doc) => ({
                id: doc.id,
                timestamp: doc.data().timestamp,
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
            <TouchableOpacity style={styles.refreshButton} onPress={refresh}>
                <Text style={styles.text}>refresh</Text>
            </TouchableOpacity>

            <View style={styles.infoBar}>
                <View style={styles.pfpAndInfo}>
                    <View style={styles.pfp}></View>
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

            <View style={styles.logout}>
                <Button title="Logout" onPress={handleLogout} />
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
        position: 'absolute',
        top: 0,
        right: 0,
    },
    postContainer: {
        flex: 1,
        paddingBottom: 55,
        paddingHorizontal: 20,
        paddingTop: 30
    },
    refreshButton: {
        position: "absolute",
        top: 0,
        left: 10,
        backgroundColor: "green",
    },
    text: {
        fontSize: 18,
        fontWeight: "bold",
        color: "gold",
    },
});

export default Page;
