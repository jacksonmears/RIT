import {View, Text, Pressable, StyleSheet, TextInput} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { auth, db, } from '@/firebase';
import { Camera, getCameraDevice, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';
import { doc, setDoc, addDoc, collection, query, orderBy, getDocs } from "firebase/firestore";

const Page = () => {
    const user = auth.currentUser;
    const cameraRef = useRef<Camera>(null);
    const [snapshotPath, setSnapshotPath] = useState<string | null>(null);
    const [device, setDevice] = useState<any>(null);
    const { hasPermission: cameraHasPermission, requestPermission: requestCameraPermission } = useCameraPermission();
    const { hasPermission: micHasPermission, requestPermission: requestMicPermission } = useMicrophonePermission();
    const [post, setPost] = useState('');


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



    const createPost = async (content: string) => {
        if (!user) return;
        try {

            const postRef = await addDoc(collection(db, "posts"), {
                content: content
            });

            const postID = postRef.id
            console.log("post created with: ", postID)

            const userRef = await setDoc(doc(db, "users", user.uid, "posts", postID), {
                createdAt: new Date().toISOString(),
            });

            // need to add a groupRef to connect the post to a specific group(s)


        } catch (error) {
            console.error(error);
        }
    }


    const getRecentPosts = async () => {
        if (!user) return;

        try {
            const q = query(
                collection(db, "users", user.uid, "posts"),
                orderBy("createdAt", "desc") // Retrieves newest posts first (LIFO)
            );

            const querySnapshot = await getDocs(q);
            const posts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            console.log("Recent posts:", posts);
            return posts;

        } catch (error) {
            console.error("Error retrieving posts:", error);
        }
    };


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
                value={post}
                onChangeText={setPost}
            />
            {/*<Pressable onPress={handleSearch} style={styles.button}>*/}
            {/*    <Text> Search for friends </Text>*/}
            {/*</Pressable>*/}

            <Pressable onPress={() => createPost(post)} style={styles.createPostButton}>
                <Text> post! </Text>
            </Pressable>

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
    createPostButton: {
        marginVertical: 4,
        marginHorizontal: 40,
        position: "absolute",
        backgroundColor: "white",
        borderRadius: 4,
        top: 500,
        left: 50,
    }
});

export default Page;
