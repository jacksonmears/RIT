import {View, Text, Pressable, StyleSheet, TextInput, TouchableOpacity} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { auth, db, } from '@/firebase';
import { Camera, getCameraDevice, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';
import { doc, setDoc, addDoc, collection, query, orderBy, getDocs } from "firebase/firestore";
import { Link, useRouter, useLocalSearchParams } from "expo-router";

const Page = () => {
    const user = auth.currentUser;
    const cameraRef = useRef<Camera>(null);
    const [snapshotPath, setSnapshotPath] = useState<string | null>(null);
    const [device, setDevice] = useState<any>(null);
    const { hasPermission: cameraHasPermission, requestPermission: requestCameraPermission } = useCameraPermission();
    const { hasPermission: micHasPermission, requestPermission: requestMicPermission } = useMicrophonePermission();
    const [content, setContent] = useState('');
    const router = useRouter();
    const { groups } = useLocalSearchParams();

    // Parse JSON string back into an array
    // const parsedGroupsObject = groups ? JSON.parse(groups as string) : {};
    // const parsedGroups = Object.keys(parsedGroupsObject)
    //     .filter((groupId) => parsedGroupsObject[groupId]) // Only keep selected groups (true)
    //     .map((groupId) => ({ id: groupId })); // Convert to array format
    //
    // useEffect(() => {
    //     console.log(parsedGroups);
    // }, []);

    // useEffect(() => {
    //     const fetchDevices = async () => {
    //         if (!cameraHasPermission || !micHasPermission) {
    //             const permission1 = await requestCameraPermission();
    //             const permission2 = await requestMicPermission();
    //             if (!permission1 || !permission2) {
    //                 console.error('Camera permission not granted.');
    //                 return;
    //             } else {
    //                 console.log('Camera permission granted.');
    //             }
    //         }
    //         const availableDevices = await Camera.getAvailableCameraDevices();
    //         const backDevice = getCameraDevice(availableDevices, 'back');
    //         if (!backDevice) {
    //             console.error('No back camera found.');
    //         }
    //         setDevice(backDevice);
    //     };
    //
    //     fetchDevices();
    // }, [cameraHasPermission, requestCameraPermission, micHasPermission, requestMicPermission]);



    // const createPost = async (content: string) => {
    //     if (!user || !Array.isArray(parsedGroups) || (!parsedGroups || Object.keys(parsedGroups).length === 0 || Object.values(parsedGroups).every(value => value === false))) {
    //         console.log("not parsed groups")
    //         return;
    //     }
    //     try {
    //
    //         const postRef = await addDoc(collection(db, "posts"), {
    //             content: content
    //         });
    //
    //         const postID = postRef.id
    //         console.log("post created with: ", postID)
    //
    //         const userRef = await setDoc(doc(db, "users", user.uid, "posts", postID), {
    //             createdAt: new Date().toISOString(),
    //         });
    //
    //         await addPostToGroups(db, parsedGroups, postID);
    //
    //
    //     } catch (error) {
    //         console.error(error);
    //     }
    // }
    //
    //
    // const addPostToGroups = async (db: any, parsedGroups: { id: string }[], postID: string) => {
    //     try {
    //         await Promise.all(
    //             parsedGroups.map(async (group) => {
    //                 await setDoc(doc(db, "groups", group.id, "posts", postID), {
    //                     createdAt: new Date().toISOString(),
    //                 });
    //             })
    //         );
    //         console.log("Post added to all selected groups");
    //     } catch (error) {
    //         console.error("Error adding post to groups:", error);
    //     }
    // };



    const assignPostGroup = async (postId: string) => {

    }





    // const takePhoto = async () => {
    //     if (!cameraRef.current) {
    //         console.error('Camera ref is not available');
    //         return;
    //     }
    //     try {
    //         const photo = await cameraRef.current.takePhoto({});
    //         console.log('Snapshot saved to:', photo.path);
    //         setSnapshotPath(photo.path);
    //     } catch (error) {
    //         console.error('Error taking snapshot:', error);
    //     }
    // };
    //
    // if (!device) {
    //     return (
    //         <View style={styles.container}>
    //             <Text>Loading camera device...</Text>
    //         </View>
    //     );
    // }

    return (
        <View style={styles.container}>
            {/*<Camera*/}
            {/*    ref={cameraRef}*/}
            {/*    device={device}*/}
            {/*    isActive={true}*/}
            {/*    photo={true}*/}
            {/*    style={StyleSheet.absoluteFill}*/}
            {/*/>*/}
            {/*<Pressable style={styles.permissionButton} onPress={takePhoto}>*/}
            {/*    <Text style={styles.text}>Take Image</Text>*/}
            {/*</Pressable>*/}
            {/*{snapshotPath && <Text>Photo saved at: {snapshotPath}</Text>}*/}

            <Text style={styles.t}> Create Page ! </Text>
            <TextInput
                style={styles.input}
                placeholder="create a post"
                placeholderTextColor="#ccc"
                value={content}
                onChangeText={setContent}
            />
            {/*<Pressable onPress={handleSearch} style={styles.button}>*/}
            {/*    <Text> Search for friends </Text>*/}
            {/*</Pressable>*/}

            {/*<Pressable onPress={() => createPost(post)} style={styles.createPostButton}>*/}
            {/*    <Text> post! </Text>*/}
            {/*</Pressable>*/}

            {/*<TouchableOpacity style={styles.pickGroupsButton} onPress={() => router.push("/create/assignGroup")}>*/}
            {/*    <Text>pick groups</Text>*/}
            {/*</TouchableOpacity>*/}

            <TouchableOpacity style={styles.pickGroupsButton} onPress={() => router.push({ pathname: "/create/assignGroup", params: { content: content} })}>
                <Text>done</Text>
            </TouchableOpacity>


        </View>
    );
};

const styles = StyleSheet.create({
    // container: {
    //     flex: 1,
    //     justifyContent: 'center',
    //     alignItems: 'center',
    // },
    // permissionButton: {
    //     position: 'absolute',
    //     top: 50,
    //     left: 50,
    //     backgroundColor: 'black',
    //     padding: 10,
    //     borderRadius: 5,
    // },
    // text: {
    //     color: 'white',
    // },
    container: {
        backgroundColor: "black",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    t: {
        color: "white",
    },
    input: {
        marginVertical: 4,
        marginHorizontal: 40,
        borderWidth: 1,
        borderRadius: 4,
        padding: 20,
        backgroundColor: "white",
        fontSize: 30,
    },
    button: {
        marginVertical: 4,
        marginHorizontal: 40,
        position: "absolute",
        backgroundColor: "white",
        borderRadius: 4,
        top: 50,
        left: 50,
    },
    pickGroupsButton: {
        marginVertical: 4,
        marginHorizontal: 40,
        position: "absolute",
        backgroundColor: "white",
        borderRadius: 4,
        top: 500,
        left: 50,
    },
    createPostButton: {
        marginVertical: 4,
        marginHorizontal: 40,
        position: "absolute",
        backgroundColor: "white",
        borderRadius: 4,
        top: 500,
        right: 50,
    }
});

export default Page;
