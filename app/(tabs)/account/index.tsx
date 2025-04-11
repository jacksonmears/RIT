import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TextInput, Image, Dimensions } from 'react-native';
import { auth, db } from '@/firebase';
import { updateProfile } from '@firebase/auth';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Link, useRouter } from 'expo-router'
import {doc, getDoc, getDocs, collection } from "firebase/firestore";


const { width, height } = Dimensions.get('window');

const Page = () => {
    const user = auth.currentUser;
    const [name, setName] = useState('');
    const [numPosts, setNumPosts] = useState(0);
    const [numFriends, setNumFriends] = useState(0);
    const [bio, setBio] = useState('');

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
        console.log(name, numPosts, numFriends, bio)
        console.log("cher")
    }, [name, numPosts, numFriends, bio]);

    useEffect(() => {
        getBioInfo()
    }, []);

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
            {/*<Text style={styles.t}>Account Page!</Text>*/}
            {/*<Text style={styles.t}>{auth.currentUser?.email}</Text>*/}
            {/*<Text style={styles.t}>{auth.currentUser?.phoneNumber}</Text>*/}
            {/*<Text style={styles.t}>{auth.currentUser?.displayName}</Text>*/}
            {/*<Text style={styles.t}>Followers: </Text>*/}

            {/*/!* Display the user's photo if available *!/*/}
            {/*{photoUrl ? (*/}
            {/*    <Image source={{ uri: photoUrl }} style={{ width: 200, height: 200 }} />*/}
            {/*) : (*/}
            {/*    <Text style={styles.t}>No profile picture available</Text>*/}
            {/*)}*/}

            {/*<View style={styles.nameChange}>*/}
            {/*    <TextInput*/}
            {/*        style={styles.t}*/}
            {/*        value={newDisplayName}*/}
            {/*        onChangeText={setNewDisplayName}*/}
            {/*        placeholder="New Username"*/}
            {/*        placeholderTextColor="gray"*/}
            {/*    />*/}
            {/*    <Link href="/(tabs)/account/displayNameChange">*/}
            {/*        <Text style={styles.t}>Change Display Name</Text>*/}
            {/*    </Link>*/}



            {/*    /!*<Button title="Update Display Name" onPress={navigateDisplayNameChange} />*!/*/}

            {/*</View>*/}

            {/*<View style={styles.photoChange}>*/}
            {/*    <Button title="Update Photo" onPress={handleUpdatePhotoURl} />*/}
            {/*</View>*/}







            {/*<View style={styles.infoName}>*/}
                {/*    <Text style={styles.infoBarText}>name</Text>*/}
                {/*</View>*/}
                {/*<View style={styles.topInfo}>*/}
                {/*    <View style={styles.circle}>*/}
                {/*        <Text style={styles.circleText}>pfp</Text>*/}
                {/*    </View>*/}
                {/*    <View style={styles.separatorPFP}></View>*/}
                {/*    <View style={styles.box}>*/}
                {/*        <Text style={styles.infoBarText}>5</Text>*/}
                {/*        <Text style={styles.infoBarText}>posts</Text>*/}
                {/*    </View>*/}
                {/*    <View style={styles.separatorInfo}></View>*/}
                {/*    <View style={styles.box}>*/}
                {/*        <Text style={styles.infoBarText}>6</Text>*/}
                {/*        <Text style={styles.infoBarText}>friends</Text>*/}
                {/*    </View>*/}
                {/*</View>*/}
                {/*<View style={styles.separatorBio}></View>*/}
                {/*<View style={styles.bioBox}>*/}
                {/*    <Text style={styles.infoBarText}>Bio</Text>*/}
                {/*</View>*/}

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
        position: 'absolute',
            top: 100,
            left: 50,
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
        left: 15,
        top: 20,
    },
    genericText: {
        color: 'white',
    },
    logout: {
        position: 'absolute',
        top: height / 1.35,
        left: width / 4,
    },

    // t: {
    //     color: 'white',
    //     marginBottom: 10,
    // },
    // image: {
    //     width: 200,
    //     height: 200,
    //     borderRadius: 100,
    //     marginVertical: 20,
    // },
    // nameChange: {
    //     position: 'absolute',
    //     top: height / 2.2,
    //     left: width / 4,
    // },
    // photoChange: {
    //     position: 'absolute',
    //     top: height / 1.5,
    //     left: width / 4,
    // },

    // circleText: {
    //     color: 'black'
    // },
    // topInfo: {
    //     flexDirection: 'row',
    //
    //     alignItems: 'center',
    // },

    // box: {
    //     justifyContent: 'center',
    // },
    // separatorPFP: {
    //     width: 117
    // },
    // separatorInfo: {
    //     width: 20
    // },
    // separatorBio: {
    //     height: 50,
    // },
    // infoBar: {
    //     flex:1,
    //     position: 'absolute',
    //     top: 100,
    //     left: 50,
    // },
    // infoName: {
    //     height: 30,
    //     left: 125
    // },
    // bioBox: {
    //     left: 10
    // }

});

export default Page;
